// Coach - petits composants UI (sans frameworks, sans drame)
import { h } from './utils.js';

// --- NOUVEAU: Système de notification Toast (remplace alert) ---
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = h('div', { id: 'toast-container' });
    document.body.appendChild(container);
  }

  // Icône selon le type
  const icon = type === 'error' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️');
  const el = h('div', { class: 'toast' }, 
    h('span', { style: 'font-size:1.2em' }, icon),
    h('span', {}, message)
  );
  
  if (type === 'error') el.style.borderLeft = '4px solid var(--danger)';
  if (type === 'success') el.style.borderLeft = '4px solid var(--success)';

  container.appendChild(el);

  // Animation de sortie et suppression
  setTimeout(() => {
    el.style.transition = 'all 0.3s ease-out';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}
// ---------------------------------------------------------------

export function Card(title, ...children) {
  return h('section', { class: 'card' },
    title ? h('h2', {}, title) : null,
    ...children
  );
}

export function Notice(html, variant = '') {
  return h('div', { class: 'notice ' + variant, html });
}

export function Button(label, { variant = '', onClick, type = 'button', disabled = false } = {}) {
  const cls = ['btn', variant].filter(Boolean).join(' ');
  return h('button', { class: cls, type, disabled, onClick }, label);
}

export function Field(label, inputEl, hint = '') {
  return h('div', { class: 'stack' },
    h('div', {},
      h('label', {}, label),
      inputEl,
      hint ? h('div', { class: 'small' }, hint) : null
    )
  );
}

export function Badge(text, cls='badge') {
  return h('span', { class: cls }, text);
}

export function Divider() { return h('hr'); }

export function TwoCol(left, right) {
  return h('div', { class: 'grid grid--2' }, left, right);
}

// KPI mis à jour pour le nouveau design
export function Kpi(label, value) {
  return h('div', { class: 'kpi' },
    h('div', { class: 'small' }, label),
    h('div', { class: 'kpi__val' }, value)
  );
}

export function ProgressBar(pct) {
  return h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100' },
    h('div', { style: `width:${Math.max(0, Math.min(100, pct))}%` })
  );
}

// --- NOUVEAU: Timer de Repos ---
export function Timer(durationSeconds, onComplete) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let intervalId = null;

  const circle = h('circle', {
    class: 'timer-progress',
    cx: 60, cy: 60, r: radius,
    'stroke-width': 8,
    'stroke-dasharray': circumference,
    'stroke-dashoffset': 0,
    fill: 'transparent'
  });

  const timeText = h('text', {
    class: 'timer-text',
    x: 60, y: 60,
    'text-anchor': 'middle',
    'dominant-baseline': 'central'
  }, durationSeconds);

  const svg = h('svg', { class: 'timer-svg', viewBox: '0 0 120 120' },
    h('circle', { cx: 60, cy: 60, r: radius, 'stroke-width': 8, class: 'timer-bg' }),
    circle,
    timeText
  );

  let remaining = durationSeconds;

  const update = () => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    timeText.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;

    const progress = remaining / durationSeconds;
    const offset = circumference * (1 - progress);
    circle.setAttribute('stroke-dashoffset', offset);

    if (remaining <= 0) {
      destroy();
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
    remaining--;
  };

  const start = () => {
    if (intervalId) return;
    update();
    intervalId = setInterval(update, 1000);
  };

  const destroy = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { el: svg, start, destroy };
}