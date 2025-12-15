// Coach - utilitaires (petits trucs indispensables, comme le café)
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v === true) el.setAttribute(k, '');
    else if (v === false || v == null) {}
    else el.setAttribute(k, String(v));
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    if (typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(String(child)));
    else el.appendChild(child);
  }
  return el;
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  // fallback basique
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

export function roundToStep(value, step = 2.5) {
  if (!isFinite(value)) return 0;
  if (!isFinite(step) || step <= 0) return value;
  return Math.round(value / step) * step;
}

export function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function numberOrNull(v) {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function withClass(el, cls, on = true) {
  if (!el) return el;
  el.classList.toggle(cls, !!on);
  return el;
}

export function trafficLightFromPain(painScore) {
  const p = clamp(Number(painScore || 0), 0, 10);
  if (p <= 3) return 'VERT';
  if (p <= 5) return 'ORANGE';
  return 'ROUGE';
}

export function trafficLightBadge(state) {
  if (state === 'VERT') return { cls: 'badge badge--ok', label: 'VERT - zone sûre' };
  if (state === 'ORANGE') return { cls: 'badge badge--warn', label: 'ORANGE - vigilance' };
  if (state === 'ROUGE') return { cls: 'badge badge--danger', label: 'ROUGE - stop' };
  return { cls: 'badge', label: '…' };
}

export function humanKg(n) {
  if (!Number.isFinite(n)) return '–';
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)} kg`;
}
