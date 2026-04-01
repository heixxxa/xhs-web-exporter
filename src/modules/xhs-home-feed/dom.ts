import { db } from '@/core/database';
import { Extension } from '@/core/extensions';
import { collectXhsHomeFeedNoteCards, parseXhsNoteCardElement } from '@/modules/xhs-shared';
import { XHSNote } from '@/types/xhs';
import logger from '@/utils/logger';

const INITIAL_SCAN_DELAYS = [0, 400, 1200] as const;
const MUTATION_SCAN_DELAY = 160;

export class XHSHomeFeedDomCapture {
  private observer: MutationObserver | null = null;
  private domReadyHandler: (() => void) | null = null;
  private mutationTimer: number | null = null;
  private initialScanTimers: number[] = [];
  private pendingCards = new Set<Element>();

  constructor(private readonly ext: Extension) {}

  public start() {
    if (document.body) {
      this.attach();
      return;
    }

    this.domReadyHandler = () => {
      this.domReadyHandler = null;
      this.attach();
    };

    document.addEventListener('DOMContentLoaded', this.domReadyHandler, { once: true });
  }

  public stop() {
    if (this.domReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler);
      this.domReadyHandler = null;
    }

    if (this.mutationTimer !== null) {
      clearTimeout(this.mutationTimer);
      this.mutationTimer = null;
    }

    for (const timer of this.initialScanTimers) {
      clearTimeout(timer);
    }
    this.initialScanTimers = [];

    this.pendingCards.clear();
    this.observer?.disconnect();
    this.observer = null;
  }

  private attach() {
    if (this.observer || !document.body) {
      return;
    }

    for (const delay of INITIAL_SCAN_DELAYS) {
      const timer = window.setTimeout(() => {
        void this.captureCards(collectXhsHomeFeedNoteCards(document));
      }, delay);
      this.initialScanTimers.push(timer);
    }

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          for (const card of collectXhsHomeFeedNoteCards(node)) {
            this.pendingCards.add(card);
          }
        }
      }

      if (this.pendingCards.size === 0) {
        return;
      }

      if (this.mutationTimer !== null) {
        clearTimeout(this.mutationTimer);
      }

      this.mutationTimer = window.setTimeout(() => {
        const cards = Array.from(this.pendingCards);
        this.pendingCards.clear();
        this.mutationTimer = null;
        void this.captureCards(cards);
      }, MUTATION_SCAN_DELAY);
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
    logger.debug('XHSHomeFeed DOM fallback attached');
  }

  private async captureCards(cards: Iterable<Element>) {
    const noteMap = new Map<string, XHSNote>();

    for (const card of cards) {
      const note = parseXhsNoteCardElement(card);
      if (note?.note_id) {
        noteMap.set(note.note_id, note);
      }
    }

    const notes = [...noteMap.values()];
    if (notes.length === 0) {
      return;
    }

    try {
      await db.extAddXHSNotes(this.ext.name, notes);
      logger.debug(`XHSHomeFeed DOM captured ${notes.length} notes`);
    } catch (error) {
      logger.error('XHSHomeFeed DOM capture failed', error);
    }
  }
}
