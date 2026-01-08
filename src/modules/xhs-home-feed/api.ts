import { Interceptor } from '@/core/extensions';
import { db } from '@/core/database';
import logger from '@/utils/logger';
import { XHSNote } from '@/types/xhs';

// https://www.xiaohongshu.com/api/sns/web/v1/homefeed
// https://www.xiaohongshu.com/api/sns/web/v1/search/notes
export const XHSHomeFeedInterceptor: Interceptor = (req, res, ext) => {
  if (!/\/api\/sns\/web\/v1\/homefeed/.test(req.url) && !/\/api\/sns\/web\/v1\/search\/notes/.test(req.url)) {
    return;
  }

  try {
    const json = JSON.parse(res.responseText);
    const items = json.data.items || json.data.notes || []; // Search uses 'notes', Home uses 'items' usually.
    
    // We need to parse each item.
    // The structure might vary slightly but XHS generally returns note_card.
    
    const notes: XHSNote[] = items.map((item: any) => {
        // Sometimes item is the note itself, sometimes it wraps note_card in 'note_card'
        // Let's assume the Python logic: item has 'note_card' or item IS the note_card (search vs home)
        // Checking python data_util.py line 65: handle_note_info(data) where data seems to be the item.
        // It accesses data['note_card'].
        
        let card = item.note_card ? item.note_card : item;
        // Search API might return flatten structure.
        // If it doesn't have note_card but has 'id', it might be the flat structure.
        if (!item.note_card && item.id) {
            // Flattened structure simulation or it's directly there
             card = item;
        }

        // If 'display_title' exists (search result), map to title.
        
        // Defensive coding
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
            title: card.display_title || card.title || '',
            desc: card.desc || '',
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
            tags: [], // Need to parse tags list
            upload_time: card.time || Date.now(),
        } as XHSNote;
    }).filter((n: any) => n && n.note_id);

    // Add captured data to the database.
    db.extAddXHSNotes(ext.name, notes);

    logger.info(`XHSHomeFeed: ${notes.length} items received`);
  } catch (err) {
    logger.debug(req.method, req.url, res.status, res.responseText);
    logger.errorWithBanner('XHSHomeFeed: Failed to parse API response', err as Error);
  }
};
