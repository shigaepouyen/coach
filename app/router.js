// Coach - router hash (SPA sans build tool, parce que l'humanité adore compliquer les choses)
import { qs, qsa } from './utils.js';

function parseHash() {
  const raw = location.hash || '#/home';
  const [path, queryString] = raw.replace(/^#/, '').split('?');
  const query = {};
  if (queryString) {
    for (const part of queryString.split('&')) {
      const [k, v] = part.split('=');
      if (!k) continue;
      query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { path: path.startsWith('/') ? path : '/' + path, query };
}

export function createRouter({ routes, onRoute } = {}) {
  let currentView = null;

  async function render() {
    // 1. Appelle la fonction de nettoyage de la vue précédente
    if (currentView && typeof currentView.onunload === 'function') {
      currentView.onunload();
    }

    const { path, query } = parseHash();
    const viewFactory = routes[path] || routes['/404'] || routes['/home'];
    const root = qs('#app');

    // nav active
    qsa('.bottom-nav__item').forEach(a => {
      const href = a.getAttribute('href') || '';
      const active = href === `#${path}`;
      a.classList.toggle('active', active);
    });

    if (!root) return;

    root.innerHTML = '';

    // 2. Crée la nouvelle vue et stocke sa référence
    currentView = await viewFactory({ path, query });

    // 3. Affiche la nouvelle vue
    if (currentView && currentView.el) {
      root.appendChild(currentView.el);
    }

    if (typeof onRoute === 'function') onRoute({ path, query });
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('load', render);

  return {
    go(path) { location.hash = path.startsWith('#') ? path : '#' + path; },
    refresh() { render(); }
  };
}
