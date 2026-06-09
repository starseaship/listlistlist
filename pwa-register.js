import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    setInterval(() => {
      registration.update().catch(console.warn);
    }, 60 * 60 * 1000);
  },
  onRegisterError(error) {
    console.warn('PWA service worker registration failed', error);
  }
});
