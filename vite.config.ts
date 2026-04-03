import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

import preact from '@preact/preset-vite';
import monkey from 'vite-plugin-monkey';
import i18nextLoader from 'vite-plugin-i18next-loader';

import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import prefixSelector from 'postcss-prefix-selector';
import remToPx from 'postcss-rem-to-pixel-next';
import { APP_ROOT_ID } from './src/constants/app';

const appRootSelector = `#${APP_ROOT_ID}`;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    minify: false,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
        remToPx({ propList: ['*'] }),
        // Use scoped CSS.
        prefixSelector({
          prefix: appRootSelector,
          exclude: [new RegExp(`^${escapeRegExp(appRootSelector)}`)],
        }),
      ],
    },
  },
  plugins: [
    preact(),
    i18nextLoader({ paths: ['./src/i18n/locales'], namespaceResolution: 'basename' }),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: {
          '': 'Xiaohongshu Web Exporter',
          'zh-CN': '小红书数据导出工具',
        },
        description: {
          '': 'Export notes, comments and much more to JSON/CSV/HTML from Xiaohongshu web app.',
          'zh-CN': '从小红书网页版导出笔记、评论等数据为 JSON/CSV/HTML。',
        },
        namespace: 'https://github.com/heixxxa',
        icon: 'https://companieslogo.com/img/orig/xiaohongshu-81d36809.png',
        match: ['https://www.xiaohongshu.com/*'],
        grant: ['unsafeWindow', 'GM_registerMenuCommand'],
        'run-at': 'document-start',
        updateURL:
          'https://github.com/heixxxa/xhs-web-exporter/releases/latest/download/xhs-web-exporter.user.js',
        downloadURL:
          'https://github.com/heixxxa/xhs-web-exporter/releases/latest/download/xhs-web-exporter.user.js',
        require: [
          'https://cdn.jsdelivr.net/npm/dayjs@1.11.13/dayjs.min.js',
          'https://cdn.jsdelivr.net/npm/dexie@4.0.11/dist/dexie.min.js',
          'https://cdn.jsdelivr.net/npm/dexie-export-import@4.1.4/dist/dexie-export-import.js',
          'https://cdn.jsdelivr.net/npm/file-saver-es@2.0.5/dist/FileSaver.min.js',
          'https://cdn.jsdelivr.net/npm/i18next@24.2.3/i18next.min.js',
          'https://cdn.jsdelivr.net/npm/preact@10.26.4/dist/preact.min.js',
          'https://cdn.jsdelivr.net/npm/preact@10.26.4/hooks/dist/hooks.umd.js',
          'https://cdn.jsdelivr.net/npm/@preact/signals-core@1.8.0/dist/signals-core.min.js',
          'https://cdn.jsdelivr.net/npm/@preact/signals@2.0.0/dist/signals.min.js',
          'https://cdn.jsdelivr.net/npm/@tanstack/table-core@8.21.2/build/umd/index.production.js',
        ],
      },
      build: {
        externalGlobals: {
          dayjs: 'dayjs',
          dexie: 'Dexie',
          'dexie-export-import': 'DexieExportImport',
          'file-saver-es': 'FileSaver',
          i18next: 'i18next',
          preact: 'preact',
          'preact/hooks': 'preactHooks',
          '@preact/signals': 'preactSignals',
          '@tanstack/table-core': 'TableCore',
        },
      },
    }),
  ],
});
