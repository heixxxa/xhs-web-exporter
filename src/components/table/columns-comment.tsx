// src/components/table/columns-comment.tsx
import { h } from 'preact';
import { createColumnHelper } from '@tanstack/table-core';
import { XHSComment } from '@/types/xhs';

const columnHelper = createColumnHelper<XHSComment>();

export const columns = [
  // Selection checkbox
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        class="checkbox checkbox-sm align-middle"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  // Index
  columnHelper.display({
    id: 'index',
    header: '#',
    cell: (info) => info.row.index + 1,
  }),
  // Avatar & Username
  columnHelper.accessor('user', {
    header: 'User',
    cell: (info) => {
      const user = info.getValue();
      return (
        <div class="flex items-center space-x-3">
          <div class="avatar">
            <div class="mask mask-squircle w-10 h-10">
              <img src={user.avatar} alt="Avatar" />
            </div>
          </div>
          <div>
            <div class="font-bold">{user.nickname}</div>
            <div class="text-sm opacity-50">{user.ip_location}</div>
          </div>
        </div>
      );
    },
  }),
  // Comment Content
  columnHelper.accessor('content', {
    header: 'Content',
    cell: (info) => (
      <div class="max-w-xs whitespace-pre-wrap break-words text-sm">
        {info.getValue()}
        {info.row.original.pictures.length > 0 && (
          <div class="mt-2 flex flex-wrap gap-2">
            {info.row.original.pictures.map((pic, idx) => (
              <a href={pic} target="_blank" rel="noopener noreferrer" key={idx}>
                <img src={pic} class="w-16 h-16 object-cover rounded border border-base-300" />
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }),
  // Likes
  columnHelper.accessor('like_count', {
    header: 'Likes',
    cell: (info) => <div class="text-center font-mono">{info.getValue()}</div>,
  }),
  // Date
  columnHelper.accessor('upload_time', {
    header: 'Date',
    cell: (info) => {
        const time = info.getValue();
        if (!time) return '-';
        return <div class="text-xs">{new Date(time).toLocaleString()}</div>;
    },
  }),
];
