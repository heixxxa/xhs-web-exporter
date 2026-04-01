// src/modules/xhs-note-detail/api.ts
import { db } from '@/core/database';
import { Interceptor } from '@/core/extensions';
import { parseXhsNoteDetailResponse } from '@/modules/xhs-shared';
import logger from '@/utils/logger';

// https://www.xiaohongshu.com/api/sns/web/v1/feed
export const XHSNoteDetailInterceptor: Interceptor = (req, res, ext) => {
  // Check if API URL path is exactly that (often used for detail via POST/GET)
  // Usually feed interface returns an array of items, but when opening a detail modal,
  // it might request this endpoint with a specific note ID in the payload.
  // Note: Home feed is ALSO this endpoint sometimes or `/homefeed`.
  // Wait, user provided context shows logs: "XHSHomeFeed: 39 items received".
  // Home feed is handled.
  // Detail page url is https://www.xiaohongshu.com/explore/xxxx
  // The XHR/Fetch for detail is usually `/api/sns/web/v1/feed`.

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
