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
    // OnboardingView retourne déjà un objet { el, render }
    // mais pour la simplicité du guard, on l'enveloppe.
    const view = await OnboardingView();
    return { el: view.el };
  }
  return viewFn(ctx);
}

// Wrapper pour les vues qui retournent juste un élément DOM
const view = (viewFn) => async (ctx) => {
  const result = await viewFn(ctx);
  // Si la vue retourne déjà le bon format, on le passe
  if (result && result.el) return result;
  // Sinon, on l'enveloppe
  return { el: result };
};

const routes = {
  '/onboarding': view(OnboardingView),
  '/home': (ctx) => guard(view(HomeView), ctx),
  '/apre': (ctx) => guard(view(ApreView), ctx),
  '/pain': (ctx) => guard(view(PainView), ctx),
  '/minimalist': (ctx) => guard(MinimalistView, ctx), // MinimalistView gérera son propre format
  '/history': (ctx) => guard(view(HistoryView), ctx),
  '/library': (ctx) => guard(view(LibraryView), ctx),
  '/404': view(HomeView)
};

createRouter({ routes });
