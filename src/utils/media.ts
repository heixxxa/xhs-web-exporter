import dayjs from 'dayjs';

import { XHSComment, XHSNote } from '@/types/xhs';
import { FileLike } from './download';

export type ExportMediaContext = 'note' | 'comment';
export type ExportableMediaType = 'photo' | 'video';

type ExportableMediaFile = FileLike & { type: ExportableMediaType };
type ExportableItem = XHSNote | XHSComment;

export const XHS_MEDIA_TYPES = ['photo', 'video'] as const;

function isXhsNote(item: ExportableItem): item is XHSNote {
  return 'note_id' in item && !('comment_id' in item);
}

function isXhsComment(item: ExportableItem): item is XHSComment {
  return 'comment_id' in item && 'pictures' in item;
}

function getFileExtensionFromUrl(url: string) {
  const sanitized = url.split('?')[0]?.split('#')[0] ?? '';
  const ext = sanitized.split('.').pop()?.toLowerCase();
  return ext && /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
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
 * Extract media from notes and comments.
 */
export function extractMedia(data: ExportableItem[]): FileLike[] {
  const gallery = new Map<string, ExportableMediaFile>();

  for (const item of data) {
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
