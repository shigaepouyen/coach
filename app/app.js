// Coach - point d'entrée
import { createRouter } from './router.js';
import { qs } from './utils.js';
import { getProfile } from './db.js';

import { OnboardingView } from './views/onboarding.js';
import { HomeView } from './views/home.js';
import { ApreView } from './views/apre.js';
import { PainView } from './views/pain.js';
import { MinimalistView } from './views/minimalist.js';
import { HistoryView } from './views/history.js';
import { LibraryView } from './views/library.js';

function setNetPill() {
  const pill = qs('#net-pill');
  const tagline = qs('#tagline');
  if (!pill) return;
  const online = navigator.onLine;
  pill.textContent = online ? 'En ligne' : 'Hors ligne';
  pill.style.color = online ? 'rgba(61,220,151,.95)' : 'rgba(255,209,102,.95)';
  if (tagline) tagline.textContent = online ? 'coaching pragmatique - sync possible' : 'coaching pragmatique - offline';
}

window.addEventListener('online', setNetPill);
window.addEventListener('offline', setNetPill);
setNetPill();

// Service worker (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {
    // silence: l’app fonctionne quand même, juste moins “offline-first”
  });
}

async function guard(viewFn, ctx) {
  const profile = await getProfile();
  if (!profile && location.hash !== '#/onboarding') {
    location.hash = '#/onboarding';
    return OnboardingView();
  }
  return viewFn(ctx);
}

const routes = {
  '/onboarding': () => OnboardingView(),
  '/home': (ctx) => guard(HomeView, ctx),
  '/apre': (ctx) => guard(ApreView, ctx),
  '/pain': (ctx) => guard(PainView, ctx),
  '/minimalist': (ctx) => guard(MinimalistView, ctx),
  '/history': (ctx) => guard(HistoryView, ctx),
  '/library': (ctx) => guard(LibraryView, ctx),
  '/404': () => HomeView()
};

createRouter({ routes });
