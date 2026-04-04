export interface XHSUser {
  user_id: string;
  nickname: string;
  avatar: string;
  ip_location?: string;
}

export interface XHSNote {
  note_id: string;
  note_url: string;
  note_type: 'normal' | 'video';
  captured_at?: number;
  user: XHSUser;
  title: string;
  desc: string;
  liked_count: number;
  collected_count: number;
  comment_count: number;
  share_count: number;
  images_list: string[];
  video_addr?: string;
  video_cover?: string;
  tags: string[];
  upload_time: number;
}

export interface XHSComment {
  comment_id: string;
  note_id: string;
  note_url: string;
  captured_at?: number;
  user: XHSUser;
  content: string;
  like_count: number;
  upload_time: number;
  ip_location?: string;
  pictures: string[];
}
