import { render } from 'preact';
import { App } from './core/app';
import extensions from './core/extensions';

import RuntimeLogsModule from './modules/runtime-logs';
import XHSCommentsModule from './modules/xhs-comments';
import XHSHomeFeedModule from './modules/xhs-home-feed';
import XHSNoteDetailModule from './modules/xhs-note-detail';

import './index.css';

extensions.add(XHSHomeFeedModule);
extensions.add(XHSNoteDetailModule);
extensions.add(XHSCommentsModule);
extensions.add(RuntimeLogsModule);
extensions.start();

function mountApp() {
  const root = document.createElement('div');
  root.id = 'xhse-root';
  document.body.append(root);

  render(<App />, root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
