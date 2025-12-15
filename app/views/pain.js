// Vue - douleur (Traffic Light)
import { h, numberOrNull, formatDateTime, trafficLightBadge, trafficLightFromPain } from '../utils.js';
import { Card, Button, Notice, Divider } from '../ui.js';
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

  const bodyPart = h('input', { placeholder: 'Ex: tendon d’Achille, genou, hanche…' });
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
      h('div', { class: badge.cls }, badge.label),
      h('p', {}, h('strong', {}, res.action.title), ' - ', res.action.detail),
      h('div', { class: 'small' }, `Pire score pris en compte - ${res.worst}/10`)
    );
  }

  painAfter.addEventListener('input', recompute);
  painMorning.addEventListener('input', recompute);

  const saveBtn = Button('Enregistrer le check-in', { variant: 'btn--ok', onClick: async () => {
    const pa = numberOrNull(painAfter.value);
    const pm = numberOrNull(painMorning.value);
    if (pa == null && pm == null) {
      alert('Entrez au moins une valeur (après ou matin).');
      return;
    }

    const res = computeTrafficLight({ painAfter: pa ?? 0, painMorning: pm, baselineMorning });
    await addPainLog({
      kind: 'manual',
      bodyPart: bodyPart.value.trim(),
      painAfter: pa,
      painMorning: pm,
      state: res.state,
      note: res.action.title
    });

    location.hash = '#/pain';
    location.reload();
  }});

  const autoFill = Button('Pré-remplir depuis le dernier check', { variant: 'btn--ghost', onClick: () => {
    if (!last) return;
    bodyPart.value = last.bodyPart || '';
    painAfter.value = last.painAfter ?? '';
    painMorning.value = last.painMorning ?? '';
    recompute();
  }});

  // table
  const rows = logs.map(l => {
    const st = l.state || (l.painAfter != null || l.painMorning != null ? trafficLightFromPain(Math.max(l.painAfter ?? 0, l.painMorning ?? 0)) : '—');
    const b = trafficLightBadge(st);
    return h('tr', {},
      h('td', {}, formatDateTime(l.ts)),
      h('td', {}, l.bodyPart || '—'),
      h('td', {}, l.painAfter ?? '—'),
      h('td', {}, l.painMorning ?? '—'),
      h('td', {}, h('span', { class: b.cls }, st))
    );
  });

  // initial compute
  recompute();

  return h('div', { class: 'grid' },
    Card('Check douleur (Traffic Light)',
      Notice('<strong>But</strong> - décider quoi faire, pas juste collectionner des chiffres.'),
      Divider(),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Zone'),
          bodyPart,
          h('div', { class: 'small' }, 'Soyez précis: “dessus du pied”, “tendon d’Achille”, etc.')
        ),
        h('div', {},
          h('label', {}, 'Référence matin (dernière valeur)'),
          h('div', { class: 'badge' }, baselineMorning == null ? '—' : `${baselineMorning}/10`)
        )
      ),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Après effort (0-10)'),
          painAfter
        ),
        h('div', {},
          h('label', {}, 'Le lendemain matin (0-10)'),
          painMorning
        )
      ),
      Divider(),
      resultWrap,
      Divider(),
      h('div', { class: 'row row--between' },
        h('div', { class: 'row' }, saveBtn, autoFill),
        Button('Retour', { variant: 'btn--ghost', onClick: () => location.hash = '#/home' })
      )
    ),

    Card('Historique douleur (20 derniers)',
      h('table', { class: 'table' },
        h('thead', {},
          h('tr', {},
            h('th', {}, 'Date'),
            h('th', {}, 'Zone'),
            h('th', {}, 'Après'),
            h('th', {}, 'Matin'),
            h('th', {}, 'État')
          )
        ),
        h('tbody', {}, ...rows)
      )
    )
  );
}
