import { unsafeWindow } from '$';
import { options } from '@/core/options';
import logger from '@/utils/logger';
import { Signal } from '@preact/signals';
import { Extension, ExtensionConstructor } from './extension';

/**
 * Global object reference. In some cases, the `unsafeWindow` is not available.
 */
const globalObject = unsafeWindow ?? window ?? globalThis;

/**
 * The original XHR method backup.
 */
const xhrOpen = globalObject.XMLHttpRequest.prototype.open;

function getFetchRequestInfo(resource: RequestInfo | URL, config?: RequestInit) {
  const requestLike =
    typeof resource === 'object' && resource !== null && 'url' in resource
      ? (resource as Pick<Request, 'method' | 'url'>)
      : null;

  const url =
    typeof resource === 'string' ? resource : (requestLike?.url ?? resource?.toString?.() ?? '');

  const method = config?.method || requestLike?.method || 'GET';

  return { method, url };
}

/**
 * The registry for all extensions.
 */
export class ExtensionManager {
  private extensions: Map<string, Extension> = new Map();
  private disabledExtensions: Set<string> = new Set();
  private debugEnabled = false;

  /**
   * Signal for subscribing to extension changes.
   */
  public signal = new Signal(1);

  constructor() {
    this.disabledExtensions = new Set(options.get('disabledExtensions', []));

    // Do some extra logging when debug mode is enabled.
    if (options.get('debug')) {
      this.debugEnabled = true;
      logger.info('Debug mode enabled');
    }

    this.installHttpHooks();
  }

  /**
   * Register and instantiate a new extension.
   *
   * @param ctor Extension constructor.
   */
  public add(ctor: ExtensionConstructor) {
    try {
      logger.debug(`Register new extension: ${ctor.name}`);
      const instance = new ctor(this);
      this.extensions.set(instance.name, instance);
    } catch (err) {
      logger.error(`Failed to register extension: ${ctor.name}`, err);
    }
  }

  /**
   * Set up all enabled extensions.
   */
  public start() {
    const registeredNames = new Set(this.extensions.keys());
    const activeDisabledExtensions = [...this.disabledExtensions].filter((name) =>
      registeredNames.has(name),
    );

    if (activeDisabledExtensions.length !== this.disabledExtensions.size) {
      this.disabledExtensions = new Set(activeDisabledExtensions);
      options.set('disabledExtensions', activeDisabledExtensions);
    }

    for (const ext of this.extensions.values()) {
      if (this.disabledExtensions.has(ext.name)) {
        this.disable(ext.name);
      } else {
        this.enable(ext.name);
      }
    }
  }

  public enable(name: string) {
    try {
      this.disabledExtensions.delete(name);
      options.set('disabledExtensions', [...this.disabledExtensions]);

      const ext = this.extensions.get(name)!;
      ext.enabled = true;
      ext.setup();

      logger.debug(`Enabled extension: ${name}`);
      this.signal.value++;
    } catch (err) {
      logger.error(`Failed to enable extension: ${name}`, err);
    }
  }

  public disable(name: string) {
    try {
      this.disabledExtensions.add(name);
      options.set('disabledExtensions', [...this.disabledExtensions]);

      const ext = this.extensions.get(name)!;
      ext.enabled = false;
      ext.dispose();

      logger.debug(`Disabled extension: ${name}`);
      this.signal.value++;
    } catch (err) {
      logger.error(`Failed to disable extension: ${name}`, err);
    }
  }

  public getExtensions() {
    return [...this.extensions.values()];
  }

  /**
   * Hook XHR and fetch so enabled extensions can inspect page API responses.
   * This needs to be done before any request is made.
   */
  private installHttpHooks() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const manager = this;

    globalObject.XMLHttpRequest.prototype.open = function (method: string, url: string) {
      if (manager.debugEnabled) {
        logger.debug(`XHR initialized`, { method, url });
      }

      // When the request is done, we call all registered interceptors.
      this.addEventListener('load', () => {
        if (manager.debugEnabled) {
          logger.debug(`XHR finished`, { method, url });
        }

        // Run current enabled interceptors.
        manager
          .getExtensions()
          .filter((ext) => ext.enabled)
          .forEach((ext) => {
            const func = ext.intercept();
            if (func) {
              func({ method, url }, this, ext);
            }
          });
      });

      // @ts-expect-error it's fine.
      // eslint-disable-next-line prefer-rest-params
      xhrOpen.apply(this, arguments);
    };

    logger.info('Hooked into XMLHttpRequest');

    // Hook into Window.fetch
    const originalFetch = globalObject.fetch?.bind(globalObject);
    if (typeof originalFetch !== 'function') {
      logger.warn('Window.fetch is not available, skipping fetch hook');
      return;
    }

    globalObject.fetch = async (...args) => {
      const [resource, config] = args;
      const response = await originalFetch(...args);
      const { method, url } = getFetchRequestInfo(resource, config);

      if (manager.debugEnabled) {
        logger.debug(`Fetch finished`, { method, url });
      }

      if (response.ok) {
        const clone = response.clone();
        clone
          .text()
          .then((responseText) => {
            // Mock an XHR object for compatibility with existing interceptors.
            const fakeXhr = {
              responseText,
              status: response.status,
              statusText: response.statusText,
            } as XMLHttpRequest;

            manager
              .getExtensions()
              .filter((ext) => ext.enabled)
              .forEach((ext) => {
                const func = ext.intercept();
                if (func) {
                  func({ method, url }, fakeXhr, ext);
                }
              });
          })
          .catch((err) => {
            logger.debug('Failed to read fetch response', err);
          });
      }

      return response;
    };
    logger.info('Hooked into Fetch');
  }
}
