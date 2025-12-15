// Coach - petits composants UI (sans frameworks, sans drame)
import { h } from './utils.js';

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

export function Kpi(label, value) {
  return h('div', { class: 'kpi' },
    h('div', { class: 'kpi__label' }, label),
    h('div', { class: 'kpi__value' }, value)
  );
}

export function ProgressBar(pct) {
  return h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100' },
    h('div', { style: `width:${Math.max(0, Math.min(100, pct))}%` })
  );
}
