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
  async function render() {
    const { path, query } = parseHash();
    const view = routes[path] || routes['/404'] || routes['/home'];
    const root = qs('#app');

    // nav active
    qsa('.bottom-nav__item').forEach(a => {
      const href = a.getAttribute('href') || '';
      const active = href === `#${path}`;
      a.classList.toggle('active', active);
    });

    if (!root) return;

    root.innerHTML = '';
    const el = await view({ path, query });
    if (el) root.appendChild(el);
    if (typeof onRoute === 'function') onRoute({ path, query });
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('load', render);

  return {
    go(path) { location.hash = path.startsWith('#') ? path : '#' + path; },
    refresh() { render(); }
  };
}
