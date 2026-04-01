// src/modules/xhs-comments/api.ts
import { db } from '@/core/database';
import { Interceptor } from '@/core/extensions';
import { parseXhsCommentsResponse } from '@/modules/xhs-shared';
import logger from '@/utils/logger';

// https://www.xiaohongshu.com/api/sns/web/v2/comment/page
// https://www.xiaohongshu.com/api/sns/web/v2/comment/sub/page
export const XHSCommentsInterceptor: Interceptor = (req, res, ext) => {
  if (!/\/api\/sns\/web\/v2\/comment\/(sub\/)?page/.test(req.url)) {
    return;
  }

  try {
    const comments = parseXhsCommentsResponse(res.responseText);

    if (comments.length > 0) {
      void db.extAddXHSComments(ext.name, comments);
      logger.info(`XHSComments: ${comments.length} comments captured`);
    }
  } catch (err) {
    logger.debug(req.method, req.url, res.status, res.responseText);
    logger.errorWithBanner('XHSComments: Failed to parse API response', err as Error);
  }
};
