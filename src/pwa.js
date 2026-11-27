import { registerSW } from 'virtual:pwa-register';

/*
 * The kiosk tab never closes or does a full page load, so the browser would
 * neither look for a new version nor let one take over on its own. This checks
 * on a timer, and holds a new version until the welcome screen, so a deploy
 * never reloads someone out of the middle of a run.
 *
 * In `npm run dev` the plugin swaps this module for a no-op, so there's no
 * service worker to get in the way while developing.
 */
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

let updateReady = false;
let isOnWelcomeScreen = false;

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateReady = true;
    if (isOnWelcomeScreen) applyUpdate();
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    setInterval(() => {
      if (navigator.onLine) registration.update().catch(() => {});
    }, UPDATE_CHECK_INTERVAL_MS);
  },
});

function applyUpdate() {
  updateReady = false;
  // Activates the waiting worker; the page reloads once it takes control.
  updateServiceWorker(true);
}

// Called on every route change; only the welcome screen is safe to reload.
export function setOnWelcomeScreen(onWelcome) {
  isOnWelcomeScreen = onWelcome;
  if (onWelcome && updateReady) applyUpdate();
}
