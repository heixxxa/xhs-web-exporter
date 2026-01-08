// src/modules/xhs-note-detail/api.ts
import { Interceptor } from '@/core/extensions';
import { db } from '@/core/database';
import logger from '@/utils/logger';
import { XHSNote } from '@/types/xhs';

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
    const json = JSON.parse(res.responseText);
    const items = json.data.items || [];
    
    // In detail view, items usually contain just one note (the one opened).
    // Or a list of related notes.
    const notes: XHSNote[] = items.map((item: any) => {
        const card = item.note_card;
        if (!card) return null;
        
        const user = card.user || {};
        const interact = card.interact_info || {};
        
        return {
            note_id: item.id || card.id || card.note_id,
            note_url: `https://www.xiaohongshu.com/explore/${item.id || card.id}`,
            note_type: card.type === 'video' ? 'video' : 'normal',
            user: {
                user_id: user.user_id,
                nickname: user.nickname,
                avatar: user.avatar,
                ip_location: card.ip_location
            },
            title: card.title || card.display_title || '',
            desc: card.desc || '', // This is the full content text!
            liked_count: interact.liked_count || 0,
            collected_count: interact.collected_count || 0,
            comment_count: interact.comment_count || 0,
            share_count: interact.share_count || 0,
            images_list: ((card) => {
              let imgs = (card.image_list || []).map((img: any) => {
                let url = '';
                if (img.info_list && img.info_list.length > 1) {
                  url = img.info_list[1].url;
                } else {
                  url = img.url || '';
                }
                return url;
              });
              if (imgs.length === 0 && card.cover) {
                let coverUrl = '';
                if (card.cover.info_list && card.cover.info_list.length > 1) {
                  coverUrl = card.cover.info_list[1].url;
                } else {
                  coverUrl = card.cover.url || '';
                }
                if (coverUrl) imgs.push(coverUrl);
              }
              return imgs.filter((url: string) => !!url).map((url: string) => {
                return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
              });
            })(card),
            video_addr: (card.video?.media?.stream?.h264?.[0]?.master_url || '').replace('http://', 'https://'),
            tags: (card.tag_list || []).map((t: any) => t.name),
            upload_time: card.time || Date.now(),
        } as XHSNote;
    }).filter((n: any) => n && n.note_id);

    if (notes.length > 0) {
        db.extAddXHSNotes(ext.name, notes);
        logger.info(`XHSNoteDetail: ${notes.length} notes captured (with full desc)`);
    }

  } catch (err) {
    logger.debug(req.method, req.url, res.status, res.responseText);
    logger.errorWithBanner('XHSNoteDetail: Failed to parse API response', err as Error);
  }
};
