import { db } from '@/core/database';
import { Interceptor } from '@/core/extensions';
import { parseXhsHomeFeedResponse } from '@/modules/xhs-shared';
import logger from '@/utils/logger';

// https://www.xiaohongshu.com/api/sns/web/v1/homefeed
// https://www.xiaohongshu.com/api/sns/web/v1/search/notes
export const XHSHomeFeedInterceptor: Interceptor = (req, res, ext) => {
  if (
    !/\/api\/sns\/web\/v1\/homefeed/.test(req.url) &&
    !/\/api\/sns\/web\/v1\/search\/notes/.test(req.url)
  ) {
    return;
  }

  try {
    const { notes, dataKeys, itemCount, hasItemsArray } = parseXhsHomeFeedResponse(
      res.responseText,
    );

    if (!hasItemsArray) {
      logger.warn('XHSHomeFeed: Matched response but note list is missing', {
        url: req.url,
        dataKeys,
      });
      return;
    }

    void db.extAddXHSNotes(ext.name, notes);

    if (notes.length === 0) {
      logger.warn('XHSHomeFeed: Matched response but extracted 0 notes', {
        url: req.url,
        itemCount,
        dataKeys,
      });
    }

    logger.info(`XHSHomeFeed: ${notes.length} items received`);
  } catch (err) {
    logger.debug(req.method, req.url, res.status, res.responseText);
    logger.errorWithBanner('XHSHomeFeed: Failed to parse API response', err as Error);
  }
};
