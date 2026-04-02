// src/modules/xhs-note-detail/api.ts
import { db } from '@/core/database';
import { Interceptor } from '@/core/extensions';
import { parseXhsNoteDetailResponse } from '@/modules/xhs-shared';
import logger from '@/utils/logger';

// Note detail requests are fetched from this endpoint on the Xiaohongshu web app.
export const XHSNoteDetailInterceptor: Interceptor = (req, res, ext) => {
  if (!/\/api\/sns\/web\/v1\/feed/.test(req.url)) {
    return;
  }

  try {
    const notes = parseXhsNoteDetailResponse(res.responseText);

    if (notes.length > 0) {
      void db.extAddXHSNotes(ext.name, notes);
      logger.info(`XHSNoteDetail: ${notes.length} notes captured (with full desc)`);
    }
  } catch (err) {
    logger.debug(req.method, req.url, res.status, res.responseText);
    logger.errorWithBanner('XHSNoteDetail: Failed to parse API response', err as Error);
  }
};
