import dayjs from 'dayjs';

import { Media, Tweet, User } from '@/types';
import { XHSComment, XHSNote } from '@/types/xhs';
import {
  extractTweetMedia,
  getFileExtensionFromUrl,
  getMediaIndex,
  getMediaOriginalUrl,
  getProfileImageOriginalUrl,
} from './api';
import { parseTwitterDateTime } from './common';
import { FileLike } from './download';

export type PatternExtractor = (tweet: Tweet, media: Media) => string;
export type ExportMediaContext = 'tweet' | 'user' | 'note' | 'comment';
export type ExportableMediaType = 'photo' | 'video' | 'animated_gif';

type ExportableMediaFile = FileLike & { type: ExportableMediaType };
type ExportableItem = Tweet | User | XHSNote | XHSComment;

/**
 * All available patterns for customizing filenames when downloading media files.
 */
export const patterns: Record<string, { description: string; extractor: PatternExtractor }> = {
  id: {
    description: 'The tweet ID',
    extractor: (tweet) => tweet.rest_id,
  },
  screen_name: {
    description: 'The username of tweet author',
    extractor: (tweet) => tweet.core.user_results.result.core.screen_name,
  },
  name: {
    description: 'The profile name of tweet author',
    extractor: (tweet) => tweet.core.user_results.result.core.name,
  },
  index: {
    description: 'The media index in tweet (start from 0)',
    extractor: (tweet, media) => String(getMediaIndex(tweet, media)),
  },
  num: {
    description: 'The order of media in tweet (1/2/3/4)',
    extractor: (tweet, media) => String(getMediaIndex(tweet, media) + 1),
  },
  date: {
    description: 'The post date in YYYYMMDD format',
    extractor: (tweet) => parseTwitterDateTime(tweet.legacy.created_at).format('YYYYMMDD'),
  },
  time: {
    description: 'The post time in HHmmss format',
    extractor: (tweet) => parseTwitterDateTime(tweet.legacy.created_at).format('HHmmss'),
  },
  type: {
    description: 'The media type (photo/video/animated_gif)',
    extractor: (tweet, media) => media.type,
  },
  ext: {
    description: 'The file extension of media (jpg/png/mp4)',
    extractor: (tweet, media) => getFileExtensionFromUrl(getMediaOriginalUrl(media)),
  },
};

export const DEFAULT_MEDIA_TYPES = ['photo', 'video', 'animated_gif'] as const;
export const USER_MEDIA_TYPES = ['photo'] as const;
export const XHS_MEDIA_TYPES = ['photo', 'video'] as const;

function isTweet(item: ExportableItem): item is Tweet {
  return 'core' in item && 'legacy' in item && !('avatar' in item) && !('note_id' in item);
}

function isUser(item: ExportableItem): item is User {
  return 'avatar' in item && 'core' in item && 'legacy' in item;
}

function isXhsNote(item: ExportableItem): item is XHSNote {
  return 'note_id' in item && 'images_list' in item && !('comment_id' in item);
}

function isXhsComment(item: ExportableItem): item is XHSComment {
  return 'comment_id' in item && 'pictures' in item;
}

function normalizeTimestamp(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return Date.now();
  }

  return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

function sanitizeFilename(value: string) {
  const sanitized = Array.from(value)
    .map((char) => {
      if (char.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(char)) {
        return '_';
      }

      return char;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/g, '');

  return sanitized || 'media';
}

function formatXhsMediaFilename(
  prefix: string,
  type: ExportableMediaType,
  order: number,
  timestamp: number,
  url: string,
) {
  const ext = getFileExtensionFromUrl(url);
  const date = dayjs(normalizeTimestamp(timestamp)).format('YYYYMMDD');
  return sanitizeFilename(`${prefix}_${type}_${order}_${date}.${ext}`);
}

function buildTweetMediaFiles(
  tweet: Tweet,
  includeRetweets: boolean,
  filenamePattern: string,
): ExportableMediaFile[] {
  if (!includeRetweets && tweet.legacy.retweeted_status_result) {
    return [];
  }

  return extractTweetMedia(tweet).map((media) => {
    let filename = filenamePattern;
    for (const [key, value] of Object.entries(patterns)) {
      filename = filename.replace(`{${key}}`, value.extractor(tweet, media));
    }

    return {
      filename: sanitizeFilename(filename),
      type: media.type,
      url: getMediaOriginalUrl(media),
    };
  });
}

function buildUserMediaFiles(user: User): ExportableMediaFile[] {
  const files: ExportableMediaFile[] = [];

  if (user.avatar.image_url) {
    const ext = getFileExtensionFromUrl(user.avatar.image_url);
    const filename = sanitizeFilename(`${user.core.screen_name}_profile_image.${ext}`);
    files.push({
      filename,
      type: 'photo',
      url: getProfileImageOriginalUrl(user.avatar.image_url),
    });
  }

  if (user.legacy.profile_banner_url) {
    const ext = getFileExtensionFromUrl(user.legacy.profile_banner_url);
    const filename = sanitizeFilename(`${user.core.screen_name}_profile_banner.${ext}`);
    files.push({
      filename,
      type: 'photo',
      url: user.legacy.profile_banner_url,
    });
  }

  return files;
}

function buildXhsNoteMediaFiles(note: XHSNote): ExportableMediaFile[] {
  const files: ExportableMediaFile[] = [];
  const notePrefix = `note_${note.note_id}`;

  if (note.note_type !== 'video' || !note.video_addr) {
    note.images_list.forEach((url, index) => {
      files.push({
        filename: formatXhsMediaFilename(notePrefix, 'photo', index + 1, note.upload_time, url),
        type: 'photo',
        url,
      });
    });
  }

  if (note.video_addr) {
    files.push({
      filename: formatXhsMediaFilename(notePrefix, 'video', 1, note.upload_time, note.video_addr),
      type: 'video',
      url: note.video_addr,
    });
  }

  return files;
}

function buildXhsCommentMediaFiles(comment: XHSComment): ExportableMediaFile[] {
  return comment.pictures.map((url, index) => ({
    filename: formatXhsMediaFilename(
      `comment_${comment.comment_id}`,
      'photo',
      index + 1,
      comment.upload_time,
      url,
    ),
    type: 'photo' as const,
    url,
  }));
}

/**
 * Extract media from tweets, users, notes and comments.
 */
export function extractMedia(
  data: ExportableItem[],
  includeRetweets: boolean,
  filenamePattern: string,
): FileLike[] {
  const gallery = new Map<string, ExportableMediaFile>();

  for (const item of data) {
    if (isTweet(item)) {
      for (const media of buildTweetMediaFiles(item, includeRetweets, filenamePattern)) {
        gallery.set(media.filename, media);
      }

      continue;
    }

    if (isUser(item)) {
      for (const media of buildUserMediaFiles(item)) {
        gallery.set(media.filename, media);
      }

      continue;
    }

    if (isXhsNote(item)) {
      for (const media of buildXhsNoteMediaFiles(item)) {
        gallery.set(media.filename, media);
      }

      continue;
    }

    if (isXhsComment(item)) {
      for (const media of buildXhsCommentMediaFiles(item)) {
        gallery.set(media.filename, media);
      }
    }
  }

  return Array.from(gallery.values());
}
