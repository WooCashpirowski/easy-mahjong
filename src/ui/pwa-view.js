import { setupInstallation } from '../pwa/installation.js';

export function setupPwaView(root) {
  const status = root.querySelector('[data-pwa-status]');
  const installButton = root.querySelector('[data-pwa-install]');
  const instructions = root.querySelector('[data-pwa-instructions]');
  const update = root.querySelector('[data-pwa-update]');
  const controller = setupInstallation(state => {
    status.textContent = state.error || (state.offlineReady ? 'Gra jest gotowa do działania offline.' : 'Przygotowywanie gry offline…');
    status.dataset.ready = String(state.offlineReady && !state.error);
    installButton.hidden = !state.canInstall || state.installed;
    instructions.hidden = state.installed;
    update.hidden = !state.updateReady;
    root.querySelector('[data-pwa-heading]').textContent = state.installed ? 'Mahjong na Twoim tablecie' : 'Zabierz Mahjong ze sobą';
  });
  installButton.addEventListener('click', () => controller.install());
  root.querySelector('[data-pwa-refresh]').addEventListener('click', () => controller.update());
}
