import type { XHSNote } from '@/types/xhs';
import { normalizeXhsUrl } from './parsers';

export const XHS_HOME_FEED_NOTE_CARD_SELECTOR = 'section.note-item';

type NoteLinkCandidate = {
  href: string;
  noteId: string;
  hasHash: boolean;
  hasQuery: boolean;
  isCanonicalId: boolean;
};

function getTextContent(root: ParentNode, selectors: string[]) {
  for (const selector of selectors) {
    const text = root.querySelector(selector)?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return '';
}

function getImageUrl(element: Element | null) {
  if (!(element instanceof HTMLImageElement)) {
    return '';
  }

  return normalizeXhsUrl(
    element.currentSrc ||
      element.src ||
      element.getAttribute('src') ||
      element.getAttribute('data-src') ||
      '',
  );
}

function parseCount(raw: string) {
  const normalized = raw.replace(/,/g, '').trim().toLowerCase();
  if (!normalized) {
    return 0;
  }

  if (normalized.endsWith('万') || normalized.endsWith('w')) {
    return Math.round(Number.parseFloat(normalized.slice(0, -1)) * 10000) || 0;
  }

  if (normalized.endsWith('k')) {
    return Math.round(Number.parseFloat(normalized.slice(0, -1)) * 1000) || 0;
  }

  const digits = normalized.replace(/[^\d.]/g, '');
  return Math.round(Number.parseFloat(digits)) || 0;
}

function extractNoteHref(card: Element) {
  const candidates = Array.from(card.querySelectorAll<HTMLAnchorElement>('a[href*="/explore/"]'))
    .map((link) => parseNoteLinkCandidate(link.getAttribute('href') || link.href || ''))
    .filter((candidate): candidate is NoteLinkCandidate => !!candidate)
    .sort((a, b) => scoreNoteLinkCandidate(b) - scoreNoteLinkCandidate(a));

  return candidates[0]?.href || '';
}

function extractNoteId(href: string) {
  const candidate = parseNoteLinkCandidate(href);

  if (!candidate) {
    return '';
  }

  if (candidate.isCanonicalId) {
    return candidate.noteId;
  }

  return !candidate.hasHash && !candidate.noteId.includes('-') ? candidate.noteId : '';
}

function parseNoteLinkCandidate(href: string): NoteLinkCandidate | null {
  const rawHref = href.trim();
  if (!rawHref) {
    return null;
  }

  try {
    const url = new URL(rawHref, location.origin);
    const noteId = url.pathname.match(/^\/explore\/([^/]+)/)?.[1]?.trim() || '';

    if (!noteId) {
      return null;
    }

    return {
      href: rawHref,
      noteId,
      hasHash: !!url.hash,
      hasQuery: !!url.search,
      isCanonicalId: /^[0-9a-f]{24}$/i.test(noteId),
    };
  } catch {
    return null;
  }
}

function scoreNoteLinkCandidate(candidate: NoteLinkCandidate) {
  let score = 0;

  if (candidate.isCanonicalId) {
    score += 100;
  }

  if (!candidate.hasHash) {
    score += 20;
  }

  // XHS often appends tracking params to the real note link, so query params are a weak signal.
  if (!candidate.hasQuery) {
    score += 10;
  }

  if (!candidate.noteId.includes('-')) {
    score += 5;
  }

  return score;
}

function extractUserId(card: Element) {
  const href =
    card.querySelector<HTMLAnchorElement>('a.author[href*="/user/profile/"]')?.href || '';
  return href.match(/\/user\/profile\/([^/?]+)/)?.[1] || '';
}

export function parseXhsNoteCardElement(card: Element): XHSNote | null {
  const noteId = extractNoteId(extractNoteHref(card));
  if (!noteId) {
    return null;
  }

  const title = getTextContent(card, ['.title span', '.title']);
  const nickname = getTextContent(card, ['.author .name', '.name']);
  const coverImage = getImageUrl(card.querySelector('.cover img'));
  const avatar = getImageUrl(card.querySelector('.author-avatar'));
  const likedCount = parseCount(getTextContent(card, ['.like-wrapper .count', '.count']));
  const noteType: XHSNote['note_type'] = card.querySelector('.play-icon') ? 'video' : 'normal';

  return {
    note_id: noteId,
    note_url: new URL(`/explore/${noteId}`, location.origin).toString(),
    note_type: noteType,
    user: {
      user_id: extractUserId(card),
      nickname,
      avatar,
    },
    title,
    desc: '',
    liked_count: likedCount,
    collected_count: 0,
    comment_count: 0,
    share_count: 0,
    images_list: coverImage ? [coverImage] : [],
    tags: [],
    upload_time: Date.now(),
  };
}

export function collectXhsHomeFeedNoteCards(root: Node) {
  if (!(root instanceof Document || root instanceof DocumentFragment || root instanceof Element)) {
    return [] as Element[];
  }

  const cards: Element[] = [];
  if (root instanceof Element && root.matches(XHS_HOME_FEED_NOTE_CARD_SELECTOR)) {
    cards.push(root);
  }

  cards.push(...Array.from(root.querySelectorAll(XHS_HOME_FEED_NOTE_CARD_SELECTOR)));
  return cards;
}
