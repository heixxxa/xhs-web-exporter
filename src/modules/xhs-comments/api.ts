// src/modules/xhs-comments/api.ts
import { Interceptor } from '@/core/extensions';
import { db } from '@/core/database';
import logger from '@/utils/logger';
import { XHSComment } from '@/types/xhs';

// https://www.xiaohongshu.com/api/sns/web/v2/comment/page
// https://www.xiaohongshu.com/api/sns/web/v2/comment/sub/page
export const XHSCommentsInterceptor: Interceptor = (req, res, ext) => {
  if (!/\/api\/sns\/web\/v2\/comment\/(sub\/)?page/.test(req.url)) {
    return;
  }

  try {
    const json = JSON.parse(res.responseText);
    const commentsData = json.data.comments || [];
    
    // Sometimes 'data' is the comments array itself, or data.data?
    // Based on python: comments = res_json["data"]["comments"]
    
    if (!commentsData.map) return;
    
    // Note: The API returns `note_id` or we might need to look at request params?
    // Response seems to have `note_id` in comments? Not sure.
    // Python code: `comment['note_id']`
    
    const comments: XHSComment[] = commentsData.map((c: any) => {
       const user = c.user_info || {};
       
       return {
           comment_id: c.id,
           note_id: c.note_id, // Ensure API response has note_id, usually it does.
           note_url: `https://www.xiaohongshu.com/explore/${c.note_id}`,
           user: {
               user_id: user.user_id,
               nickname: user.nickname,
               avatar: user.image,
               ip_location: c.ip_location
           },
           content: c.content,
           like_count: c.like_count || 0,
           upload_time: c.create_time, 
           ip_location: c.ip_location,
           pictures: (c.pictures || []).map((p: any) => {
               const url = p?.info_list?.[1]?.url || '';
               return url.replace('http://', 'https://');
           }).filter((u: string) => !!u),
       } as XHSComment;
    });

    if (comments.length > 0) {
        db.extAddXHSComments(ext.name, comments);
        logger.info(`XHSComments: ${comments.length} comments captured`);
    }

  } catch (err) {
    logger.debug(req.method, req.url, res.status, res.responseText);
    logger.errorWithBanner('XHSComments: Failed to parse API response', err as Error);
  }
};
