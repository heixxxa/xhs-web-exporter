import { createColumnHelper } from '@tanstack/table-core';
import { options } from '@/core/options';
import { XHSComment } from '@/types/xhs';
import { formatDateTime } from '@/utils/common';

const columnHelper = createColumnHelper<XHSComment>();

export const columns = [
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
  columnHelper.display({
    id: 'index',
    header: '#',
    cell: (info) => info.row.index + 1,
  }),
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
    ),
  }),
  columnHelper.accessor('like_count', {
    header: 'Likes',
    cell: (info) => <div class="text-center font-mono">{info.getValue()}</div>,
  }),
  columnHelper.accessor('upload_time', {
    header: 'Date',
    cell: (info) => {
      const time = info.getValue();
      if (!time) return '-';
      return <div class="text-xs">{formatDateTime(time, options.get('dateTimeFormat'))}</div>;
    },
  }),
  columnHelper.accessor('captured_at', {
    header: 'Captured At',
    cell: (info) => {
      const time = info.getValue();
      if (!time) return '-';
      return <div class="text-xs">{formatDateTime(time, options.get('dateTimeFormat'))}</div>;
    },
  }),
];
