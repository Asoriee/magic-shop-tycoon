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

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte(), yandexSdkDevMockPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
  },
})

