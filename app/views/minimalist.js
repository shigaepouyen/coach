// Vue - transition minimaliste
import { h, numberOrNull, formatDateTime, trafficLightBadge, trafficLightFromPain } from '../utils.js';
import { Card, Button, Notice, Divider, Kpi } from '../ui.js';
import { getProfile, saveProfile, getMinimalistLogs, addMinimalistLog } from '../db.js';
import { inferStageFromLogs, computeNextTarget } from '../logic/minimalist.js';

export async function MinimalistView() {
  const profile = await getProfile();
  if (!profile) {
    location.hash = '#/onboarding';
    return h('div', {});
  }

  const logs = await getMinimalistLogs({ limit: 30 });
  const last = logs[0] || null;

  let stage = inferStageFromLogs(logs);

  // metronome (Web Audio)
  let audioCtx = null;
  let metroTimer = null;

  function startMetronome() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume?.();
    const beatMs = Math.round(60000 / 180); // 180 BPM
    if (metroTimer) return;

    const beep = () => {
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.06;
      o.connect(g);
      g.connect(audioCtx.destination);
      const t = audioCtx.currentTime;
      o.start(t);
      o.stop(t + 0.05);
    };

    beep();
    metroTimer = setInterval(beep, beatMs);
  }

  function stopMetronome() {
    if (metroTimer) clearInterval(metroTimer);
    metroTimer = null;
  }

  const totalRun = h('input', { placeholder: 'Ex: 50', inputmode: 'decimal', value: last?.totalRunMinutes ?? '' });
  const targetNow = profile.minimalist?.targetMinutes || 1;
  const minutes = h('input', { placeholder: String(targetNow), inputmode: 'decimal', value: String(targetNow) });
  const painMorning = h('input', { placeholder: '0-10', inputmode: 'numeric', value: '' });

  const badgeWrap = h('div', {});
  function updatePainBadge() {
    const pm = numberOrNull(painMorning.value);
    const st = pm == null ? null : trafficLightFromPain(pm);
    badgeWrap.innerHTML = '';
    if (!st) return;
    const b = trafficLightBadge(st);
    badgeWrap.appendChild(h('div', { class: b.cls }, `${b.label} (matin)`));
  }
  painMorning.addEventListener('input', updatePainBadge);

  updatePainBadge();

  const nextWrap = h('div', {});
  function recomputeNext() {
    const pm = numberOrNull(painMorning.value);
    const painState = pm == null ? (last?.painState || 'VERT') : trafficLightFromPain(pm);

    const total = numberOrNull(totalRun.value);
    const ct = computeNextTarget({
      lastTarget: numberOrNull(minutes.value) || targetNow,
      lastPainState: painState,
      stage,
      totalRunMinutes: total
    });
    nextWrap.innerHTML = '';
    nextWrap.appendChild(Notice(`<strong>Prochaine dose</strong> - ${ct.nextTarget} min - ${ct.message}`));
  }

  minutes.addEventListener('input', recomputeNext);
  totalRun.addEventListener('input', recomputeNext);
  painMorning.addEventListener('input', recomputeNext);

  recomputeNext();

  const saveBtn = Button('Enregistrer la session minimaliste', { variant: 'btn--ok', onClick: async () => {
    const m = numberOrNull(minutes.value);
    if (m == null || m <= 0) { alert('Entrez un temps minimaliste (minutes).'); return; }

    const pm = numberOrNull(painMorning.value);
    const painState = pm == null ? 'VERT' : trafficLightFromPain(pm);

    const total = numberOrNull(totalRun.value);
    const ct = computeNextTarget({
      lastTarget: m,
      lastPainState: painState,
      stage,
      totalRunMinutes: total
    });

    await addMinimalistLog({
      kind: 'run_minimalist',
      stage,
      targetMinutes: m,
      minutesMinimalist: m,
      totalRunMinutes: total,
      painMorning: pm,
      painState
    });

    // mise à jour du profil
    stage = inferStageFromLogs(await getMinimalistLogs({ limit: 30 }));
    const updated = {
      ...profile,
      minimalist: { ...(profile.minimalist || {}), stage, targetMinutes: ct.nextTarget }
    };
    await saveProfile(updated);

    location.hash = '#/minimalist';
    location.reload();
  }});

  const info = (() => {
    if (stage === 'MICRODOSE') {
      return 'Micro-doses jusqu’à 10 minutes propres. Objectif: adapter le pied, le tendon et la technique sans choc brutal.';
    }
    return 'Consolidation. Progression prudente (≈ +10%).';
  })();

  const startBtn = Button('Métronome 180 bpm - démarrer', { onClick: () => startMetronome() });
  const stopBtn = Button('Stop', { variant: 'btn--ghost', onClick: () => stopMetronome() });

  const lastCard = last ? Card('Dernière session',
    h('div', { class: 'row' },
      Kpi('Date', formatDateTime(last.ts)),
      Kpi('Minutes minimalistes', `${last.minutesMinimalist || 0} min`),
      Kpi('Douleur matin', last.painMorning == null ? '—' : `${last.painMorning}/10`)
    ),
    Divider(),
    (() => {
      const b = trafficLightBadge(last.painState || 'VERT');
      return h('div', { class: b.cls }, b.label);
    })()
  ) : null;

  return h('div', { class: 'grid' },
    Card('Transition minimaliste',
      Notice(`<strong>Règle</strong> - temps d’exposition d’abord. Cap 10% de votre sortie - et votre ego reste au vestiaire.`),
      Divider(),
      h('div', { class: 'row' },
        h('div', { class: 'badge' }, `Stade: ${stage}`),
        h('div', { class: 'badge' }, `Dose cible actuelle: ${targetNow} min`)
      ),
      h('div', { class: 'small' }, info),
      Divider(),
      h('h3', {}, 'Logger une session'),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Durée totale de la sortie (minutes)'),
          totalRun,
          h('div', { class: 'small' }, 'Optionnel - sert à limiter à 10%.')
        ),
        h('div', {},
          h('label', {}, 'Minutes en minimaliste'),
          minutes
        )
      ),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Douleur le lendemain matin (0-10)'),
          painMorning,
          badgeWrap
        ),
        h('div', {},
          h('label', {}, 'Cadence'),
          h('div', { class: 'row' }, startBtn, stopBtn),
          h('div', { class: 'small' }, 'Feedback auditif: cadence élevée (≈ 180 pas/min).')
        )
      ),
      Divider(),
      nextWrap,
      Divider(),
      h('div', { class: 'row row--between' },
        saveBtn,
        Button('Retour', { variant: 'btn--ghost', onClick: () => location.hash = '#/home' })
      )
    ),
    lastCard,
    Card('Historique (10 derniers)',
      h('table', { class: 'table' },
        h('thead', {},
          h('tr', {},
            h('th', {}, 'Date'),
            h('th', {}, 'Minutes'),
            h('th', {}, 'Total'),
            h('th', {}, 'Douleur matin'),
            h('th', {}, 'État')
          )
        ),
        h('tbody', {},
          ...logs.slice(0,10).map(l => {
            const b = trafficLightBadge(l.painState || 'VERT');
            return h('tr', {},
              h('td', {}, formatDateTime(l.ts)),
              h('td', {}, l.minutesMinimalist ?? '—'),
              h('td', {}, l.totalRunMinutes ?? '—'),
              h('td', {}, l.painMorning ?? '—'),
              h('td', {}, h('span', { class: b.cls }, l.painState || '—'))
            );
          })
        )
      )
    )
  );
}
