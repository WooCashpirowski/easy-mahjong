export function setupInstallation(onChange) {
  const displayMode = window.matchMedia('(display-mode: standalone)');
  const state = {
    installed: displayMode.matches || window.navigator.standalone === true,
    canInstall: false,
    offlineReady: false,
    updateReady: false,
    error: '',
  };
  let installPrompt;
  let registration;
  let reloadRequested = false;
  const notify = () => onChange({ ...state });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    state.canInstall = true;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = undefined;
    state.installed = true;
    state.canInstall = false;
    notify();
  });
  displayMode.addEventListener('change', event => {
    state.installed = event.matches || window.navigator.standalone === true;
    notify();
  });

  function checkUpdate() {
    state.updateReady = Boolean(registration.waiting && navigator.serviceWorker.controller);
    notify();
  }

  if (!window.isSecureContext) {
    state.error = 'Instalacja i gra offline wymagają otwarcia aplikacji pod adresem HTTPS.';
    notify();
  } else if (!('serviceWorker' in navigator)) {
    state.error = 'Ta przeglądarka nie obsługuje gry offline. Spróbuj w Chrome lub Safari.';
    notify();
  } else {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadRequested) window.location.reload();
    });
    navigator.serviceWorker.register(new URL('../../sw.js', import.meta.url), { updateViaCache: 'none' }).then(result => {
      registration = result;
      checkUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') checkUpdate();
          if (worker.state === 'redundant' && !registration.active) {
            state.error = 'Nie udało się pobrać gry offline. Połącz się z internetem i otwórz aplikację ponownie.';
            notify();
          }
        });
      });
      return navigator.serviceWorker.ready;
    }).then(() => {
      state.offlineReady = true;
      notify();
    }).catch(() => {
      state.error = 'Nie udało się przygotować gry offline. Połącz się z internetem i otwórz aplikację ponownie.';
      notify();
    });
    notify();
  }

  return {
    async install() {
      if (!installPrompt) return;
      const prompt = installPrompt;
      installPrompt = undefined;
      state.canInstall = false;
      notify();
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } catch {
        state.error = 'Wybierz instalację w menu przeglądarki.';
        notify();
      }
    },
    update() {
      if (!registration?.waiting) return;
      reloadRequested = true;
      registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
    },
  };
}
