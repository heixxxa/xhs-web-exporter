import { render } from 'preact';
import { App } from './core/app';
import extensions from './core/extensions';
import { APP_ROOT_ID } from './constants/app';

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
  if (!document.body || document.getElementById(APP_ROOT_ID)) {
    return;
  }

  const root = document.createElement('div');
  root.id = APP_ROOT_ID;
  document.body.append(root);

  render(<App />, root);
}

function scheduleMountApp() {
  const queueMount = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(mountApp, { timeout: 2000 });
      return;
    }

    window.setTimeout(mountApp, 300);
  };

  // Wait until the page finishes hydrating before injecting our own UI.
  if (document.readyState === 'complete') {
    queueMount();
    return;
  }

  window.addEventListener('load', queueMount, { once: true });
}

scheduleMountApp();
