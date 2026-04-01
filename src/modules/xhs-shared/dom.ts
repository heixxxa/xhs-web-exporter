import type { XHSNote } from '@/types/xhs';
import { normalizeXhsUrl } from './parsers';

export const XHS_HOME_FEED_NOTE_CARD_SELECTOR = 'section.note-item';

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
  const links = Array.from(card.querySelectorAll<HTMLAnchorElement>('a[href*="/explore/"]'));
  const canonicalLink = links.find((link) => !(link.getAttribute('href') || '').includes('?'));

  return (
    canonicalLink?.getAttribute('href')?.trim() || links[0]?.getAttribute('href')?.trim() || ''
  );
}

function extractNoteId(href: string) {
  return href.match(/\/explore\/([^/?]+)/)?.[1] || '';
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
