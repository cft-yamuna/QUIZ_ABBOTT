/*
 * Service worker. vite-plugin-pwa bundles this file (strategies: 'injectManifest')
 * and fills in self.__WB_MANIFEST with every built file, so the kiosk runs from
 * cache once it has loaded once, with or without Wi-Fi.
 *
 * Hand-written rather than generated: workbox's generated template breaks when the
 * project path contains an apostrophe ("chetan's projects").
 */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Every route is the same single-page app; answer deep links like /quiz/3 with index.html.
// /api is the results backend and must always reach the network.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }));

// On first install, take over the open page straight away so the fonts it loads later come from the cache.
clientsClaim();

// A new version waits here until src/pwa.js says the kiosk is on the welcome screen.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
