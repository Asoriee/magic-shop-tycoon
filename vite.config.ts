import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Vite dev server mock for /sdk.js so localhost development works seamlessly
function yandexSdkDevMockPlugin(): Plugin {
  return {
    name: 'yandex-sdk-dev-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/sdk.js' || req.url?.startsWith('/sdk.js?')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.end(`
            // [Local Development Mock] Yandex Games SDK
            console.log('[Dev Server] /sdk.js served via local Vite mock.');
            window.YaGames = {
              init: async function(options) {
                console.log('[Dev Server] YaGames.init called with options:', options);
                const mockYsdk = {
                  environment: {
                    i18n: { lang: 'ru' }
                  },
                  features: {
                    LoadingAPI: {
                      ready: function() {
                        console.log('[Dev Server] LoadingAPI.ready() called.');
                      }
                    },
                    GameplayAPI: {
                      start: function() {
                        console.log('[Dev Server] GameplayAPI.start() called.');
                      },
                      stop: function() {
                        console.log('[Dev Server] GameplayAPI.stop() called.');
                      }
                    }
                  },
                  getPlayer: async function() {
                    return null;
                  },
                  getPayments: async function(opts) {
                    return {
                      getCatalog: async () => [],
                      getPurchases: async () => [],
                      purchase: async (opts) => ({ purchaseToken: 'mock-token', productID: opts.id }),
                      consumePurchase: async () => true
                    };
                  },
                  getLeaderboards: async function() {
                    return null;
                  },
                  adv: {
                    showFullscreenAdv: function(cbs) {
                      console.log('[Dev Server] showFullscreenAdv called');
                      cbs?.callbacks?.onOpen?.();
                      setTimeout(() => { cbs?.callbacks?.onClose?.(true); }, 400);
                    },
                    showRewardedVideo: function(cbs) {
                      console.log('[Dev Server] showRewardedVideo called');
                      cbs?.callbacks?.onOpen?.();
                      setTimeout(() => {
                        cbs?.callbacks?.onRewarded?.();
                        cbs?.callbacks?.onClose?.();
                      }, 400);
                    }
                  },
                  serverTime: function() {
                    return Date.now();
                  },
                  on: function() {}
                };
                window.ysdk = mockYsdk;
                return mockYsdk;
              }
            };
          `);
          return;
        }
        next();
      });
    }
  };
}

/**
 * Yandex Games Compatibility Plugin
 * 
 * Problem: Vite adds crossorigin="anonymous" to all <script type="module"> and <link rel="stylesheet">
 * tags. Yandex S3 CDN does NOT return CORS headers (Access-Control-Allow-Origin), which causes
 * browsers to abort requests with ERR_ABORTED even though the HTTP status is 404/200.
 * 
 * Fix: Strip all crossorigin attributes from the final HTML output.
 * Also inject Cache-Control no-cache meta tags so Yandex CDN does not serve stale 404 responses.
 */
function yandexGamesCompatPlugin(): Plugin {
  return {
    name: 'yandex-games-compat',
    // Only run during build, not dev server
    apply: 'build',
    transformIndexHtml(html: string): string {
      return html
        // Remove crossorigin attribute (causes ERR_ABORTED on Yandex S3 due to missing CORS headers)
        .replace(/\s+crossorigin(?:="[^"]*")?/g, '')
        // Inject no-cache meta tags right after <head> open tag
        .replace(
          '<head>',
          '<head>\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />\n    <meta http-equiv="Pragma" content="no-cache" />\n    <meta http-equiv="Expires" content="0" />'
        );
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte(), yandexSdkDevMockPlugin(), yandexGamesCompatPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
  },
  build: {
    // Disable module preload polyfill injection — it also adds crossorigin links
    modulePreload: {
      polyfill: false,
    },
  },
})


