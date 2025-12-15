// Vue - douleur (Traffic Light)
import { h, numberOrNull, formatDateTime, trafficLightBadge, trafficLightFromPain } from '../utils.js';
import { Card, Button, Notice, Divider, showToast } from '../ui.js';
import { getProfile, addPainLog, getPainLogs } from '../db.js';
import { computeTrafficLight } from '../logic/pain.js';

export async function PainView() {
  const profile = await getProfile();
  if (!profile) {
    location.hash = '#/onboarding';
    return h('div', {});
  }

  const logs = await getPainLogs({ limit: 20 });
  const last = logs[0] || null;
  const baselineMorning = last?.painMorning ?? null;

  const bodyPart = h('input', { placeholder: 'Ex: Tendon d’Achille, Hanche…' });
  const painAfter = h('input', { placeholder: '0-10', inputmode: 'numeric' });
  const painMorning = h('input', { placeholder: '0-10', inputmode: 'numeric' });
  const resultWrap = h('div', {});

  async function recompute() {
    const pa = numberOrNull(painAfter.value) ?? 0;
    const pm = numberOrNull(painMorning.value);
    const res = computeTrafficLight({ painAfter: pa, painMorning: pm, baselineMorning });
    const badge = trafficLightBadge(res.state);

    resultWrap.innerHTML = '';
    resultWrap.append(
      h('div', { class: badge.cls, style: 'margin-bottom:1rem; font-size:1rem;' }, badge.label),
      h('div', { style: 'background:rgba(255,255,255,0.05); padding:1rem; border-radius:12px;' },
         h('strong', { style: 'display:block; margin-bottom:0.5rem' }, res.action.title),
         h('span', { class: 'small' }, res.action.detail)
      )
    );
  }

  painAfter.addEventListener('input', recompute);
  painMorning.addEventListener('input', recompute);

  const saveBtn = Button('Enregistrer', { variant: 'btn--ok', onClick: async () => {
    const pa = numberOrNull(painAfter.value);
    const pm = numberOrNull(painMorning.value);
    if (pa == null && pm == null) {
      showToast('Entrez au moins une valeur (Après ou Matin).', 'error');
      return;
    }

    const res = computeTrafficLight({ painAfter: pa ?? 0, painMorning: pm, baselineMorning });
    await addPainLog({
      kind: 'manual', bodyPart: bodyPart.value.trim(),
      painAfter: pa, painMorning: pm, state: res.state, note: res.action.title
    });

    showToast('Check-in enregistré.', 'success');
    setTimeout(() => { location.hash = '#/pain'; location.reload(); }, 500);
  }});

  const autoFill = Button('Copier dernier', { variant: 'btn--ghost', onClick: () => {
    if (!last) return;
    bodyPart.value = last.bodyPart || '';
    painAfter.value = last.painAfter ?? '';
    painMorning.value = last.painMorning ?? '';
    recompute();
    showToast('Données copiées', 'info');
  }});

  // Table rows
  const rows = logs.map(l => {
    const st = l.state || (l.painAfter!=null||l.painMorning!=null ? trafficLightFromPain(Math.max(l.painAfter??0, l.painMorning??0)) : '—');
    const b = trafficLightBadge(st);
    return h('tr', {},
      h('td', {}, formatDateTime(l.ts)),
      h('td', {}, l.bodyPart || '—'),
      h('td', {}, l.painAfter ?? '—'),
      h('td', {}, l.painMorning ?? '—'),
      h('td', {}, h('span', { class: b.cls }, st))
    );
  });

  recompute();

  return h('div', { class: 'grid' },
    Card('Check Douleur',
      h('div', { class: 'grid grid--2' },
        h('div', {}, h('label', {}, 'Zone du corps'), bodyPart),
        h('div', {}, h('label', {}, 'Ref. Matin'), h('div', { class: 'badge' }, baselineMorning==null ? '—' : `${baselineMorning}/10`))
      ),
      h('div', { class: 'grid grid--2' },
        h('div', {}, h('label', {}, 'Après effort (0-10)'), painAfter),
        h('div', {}, h('label', {}, 'Lendemain matin (0-10)'), painMorning)
      ),
      Divider(),
      resultWrap,
      Divider(),
      h('div', { class: 'row row--between' },
        autoFill, saveBtn
      )
    ),
    Card('Historique',
      h('div', { style: 'overflow-x:auto' },
        h('table', { class: 'table' },
          h('thead', {},
            h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Zone'), h('th', {}, 'Après'), h('th', {}, 'Matin'), h('th', {}, 'État'))
          ),
          h('tbody', {}, ...rows)
        )
      )
    )
  );
}