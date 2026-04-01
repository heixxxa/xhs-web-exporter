import { createColumnHelper } from '@tanstack/table-core';
import { XHSNote } from '@/types/xhs';

const columnHelper = createColumnHelper<XHSNote>();

export const columns = [
  columnHelper.accessor('images_list', {
    header: 'Cover',
    cell: (info) => {
      const src = info.getValue()?.[0];
      return src ? (
        <a href={src} target="_blank" rel="noopener noreferrer">
          <img src={src} class="w-16 h-16 object-cover rounded" />
        </a>
      ) : null;
    },
    enableSorting: false,
  }),
  columnHelper.accessor('title', {
    header: 'Title / Desc',
    cell: (info) => {
      const note = info.row.original;
      return (
        <div class="max-w-xs">
          <a
            href={note.note_url}
            target="_blank"
            class="font-bold hover:underline block truncate"
            title={note.title}
          >
            {note.title || '(No Title)'}
          </a>
          <div class="text-xs opacity-70 truncate" title={note.desc}>
            {note.desc}
          </div>
          <div class="text-xs opacity-50 mt-1">
            {new Date(note.upload_time).toLocaleDateString()}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor('user.nickname', {
    header: 'User',
    cell: (info) => (
      <div class="flex items-center gap-2">
        {info.row.original.user.avatar && (
          <img src={info.row.original.user.avatar} class="w-6 h-6 rounded-full" />
        )}
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('liked_count', {
    header: 'Stats',
    cell: (info) => {
      const note = info.row.original;
      return (
        <div class="text-xs space-y-1">
          <div title="Likes">❤️ {note.liked_count}</div>
          <div title="Collects">⭐ {note.collected_count}</div>
          <div title="Comments">💬 {note.comment_count}</div>
        </div>
      );
    },
  }),
];
