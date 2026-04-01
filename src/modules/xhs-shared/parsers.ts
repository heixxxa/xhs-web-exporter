import type { XHSComment, XHSNote } from '@/types/xhs';

type AnyRecord = Record<string, unknown>;

function asObject(value: unknown): AnyRecord {
  return value && typeof value === 'object' ? (value as AnyRecord) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return '';
  }

  return String(value);
}

function toNumberValue(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function normalizeXhsUrl(url: unknown) {
  return typeof url === 'string' ? url.replace(/^http:\/\//, 'https://').trim() : '';
}

function extractPreferredUrl(input: unknown) {
  const object = asObject(input);
  const infoList = asArray(object.info_list);

  for (const candidate of infoList.slice(1)) {
    const url = normalizeXhsUrl(asObject(candidate).url);
    if (url) {
      return url;
    }
  }

  for (const candidate of infoList) {
    const url = normalizeXhsUrl(asObject(candidate).url);
    if (url) {
      return url;
    }
  }

  return normalizeXhsUrl(object.url);
}

function resolveNoteCard(item: unknown) {
  const itemObject = asObject(item);
  const noteCard = asObject(itemObject.note_card);

  return Object.keys(noteCard).length > 0 ? noteCard : itemObject;
}

function resolveNoteId(item: unknown, card: AnyRecord) {
  const itemObject = asObject(item);
  return toStringValue(itemObject.id ?? card.id ?? card.note_id);
}

function extractImageList(card: AnyRecord) {
  const images = asArray(card.image_list).map(extractPreferredUrl).filter(Boolean);
  if (images.length > 0) {
    return images;
  }

  const cover = extractPreferredUrl(card.cover);
  return cover ? [cover] : [];
}

function resolveVideoAddress(card: AnyRecord) {
  const video = asObject(card.video);
  const media = asObject(video.media);
  const stream = asObject(media.stream);
  const h264 = asArray(stream.h264);

  return normalizeXhsUrl(asObject(h264[0]).master_url);
}

function resolveTags(card: AnyRecord) {
  return asArray(card.tag_list)
    .map((tag) => toStringValue(asObject(tag).name))
    .filter(Boolean);
}

function resolveXhsNote(item: unknown): XHSNote | null {
  const card = resolveNoteCard(item);
  const noteId = resolveNoteId(item, card);

  if (!noteId) {
    return null;
  }

  const user = asObject(card.user);
  const interact = asObject(card.interact_info);
  const videoAddress = resolveVideoAddress(card);

  return {
    note_id: noteId,
    note_url: `https://www.xiaohongshu.com/explore/${noteId}`,
    note_type: card.type === 'video' ? 'video' : 'normal',
    user: {
      user_id: toStringValue(user.user_id),
      nickname: toStringValue(user.nickname),
      avatar: normalizeXhsUrl(user.avatar ?? user.image),
      ip_location: typeof card.ip_location === 'string' ? card.ip_location : undefined,
    },
    title: toStringValue(card.display_title ?? card.title),
    desc: toStringValue(card.desc),
    liked_count: toNumberValue(interact.liked_count),
    collected_count: toNumberValue(interact.collected_count),
    comment_count: toNumberValue(interact.comment_count),
    share_count: toNumberValue(interact.share_count),
    images_list: extractImageList(card),
    video_addr: videoAddress || undefined,
    tags: resolveTags(card),
    upload_time: toNumberValue(card.time, Date.now()),
  };
}

export function parseXhsHomeFeedResponse(responseText: string) {
  const json = asObject(JSON.parse(responseText));
  const data = asObject(json.data);
  const hasItemsArray = Array.isArray(data.items) || Array.isArray(data.notes);
  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.notes)
      ? data.notes
      : [];

  return {
    notes: items.map(resolveXhsNote).filter((note): note is XHSNote => !!note?.note_id),
    dataKeys: Object.keys(data),
    itemCount: items.length,
    hasItemsArray,
  };
}

export function parseXhsNoteDetailResponse(responseText: string) {
  const json = asObject(JSON.parse(responseText));
  const data = asObject(json.data);
  const items = asArray(data.items);

  return items.map(resolveXhsNote).filter((note): note is XHSNote => !!note?.note_id);
}

export function parseXhsCommentsResponse(responseText: string) {
  const json = asObject(JSON.parse(responseText));
  const data = asObject(json.data);
  const comments = asArray(data.comments);

  return comments
    .map((comment) => {
      const commentObject = asObject(comment);
      const user = asObject(commentObject.user_info);
      const noteId = toStringValue(commentObject.note_id);

      return {
        comment_id: toStringValue(commentObject.id),
        note_id: noteId,
        note_url: noteId ? `https://www.xiaohongshu.com/explore/${noteId}` : '',
        user: {
          user_id: toStringValue(user.user_id),
          nickname: toStringValue(user.nickname),
          avatar: normalizeXhsUrl(user.image ?? user.avatar),
          ip_location:
            typeof commentObject.ip_location === 'string' ? commentObject.ip_location : undefined,
        },
        content: toStringValue(commentObject.content),
        like_count: toNumberValue(commentObject.like_count),
        upload_time: toNumberValue(commentObject.create_time, Date.now()),
        ip_location:
          typeof commentObject.ip_location === 'string' ? commentObject.ip_location : undefined,
        pictures: asArray(commentObject.pictures).map(extractPreferredUrl).filter(Boolean),
      } as XHSComment;
    })
    .filter((comment): comment is XHSComment => !!comment.comment_id);
}
