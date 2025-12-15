// Vue - transition minimaliste
import { h, numberOrNull, formatDateTime, trafficLightBadge, trafficLightFromPain } from '../utils.js';
import { Card, Button, Notice, Divider, Kpi, showToast } from '../ui.js';
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

  // Metronome (Web Audio API)
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
    showToast('Métronome 180 BPM démarré', 'info');
  }

  function stopMetronome() {
    if (metroTimer) clearInterval(metroTimer);
    metroTimer = null;
    showToast('Métronome arrêté', 'info');
  }

  const totalRun = h('input', { placeholder: 'Ex: 50', inputmode: 'decimal', value: last?.totalRunMinutes ?? '' });
  const targetNow = profile.minimalist?.targetMinutes || 1;
  const minutes = h('input', { placeholder: String(targetNow), inputmode: 'decimal', value: String(targetNow) });
  const painMorning = h('input', { placeholder: '0-10', inputmode: 'numeric', value: '' });
  const badgeWrap = h('div', {});

  function updatePainBadge() {
    const pm = numberOrNull(painMorning.value);
    badgeWrap.innerHTML = '';
    if (pm == null) return;
    const st = trafficLightFromPain(pm);
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
    nextWrap.appendChild(Notice(`<strong>Objectif futur:</strong> ${ct.nextTarget} min<br/><span class="small">${ct.message}</span>`));
  }

  minutes.addEventListener('input', recomputeNext);
  totalRun.addEventListener('input', recomputeNext);
  painMorning.addEventListener('input', recomputeNext);
  recomputeNext();

  const saveBtn = Button('Enregistrer Session', { variant: 'btn--ok', onClick: async () => {
    const m = numberOrNull(minutes.value);
    if (m == null || m <= 0) { showToast('Temps minimaliste manquant.', 'error'); return; }

    const pm = numberOrNull(painMorning.value);
    const painState = pm == null ? 'VERT' : trafficLightFromPain(pm);
    const total = numberOrNull(totalRun.value);
    const ct = computeNextTarget({ lastTarget: m, lastPainState: painState, stage, totalRunMinutes: total });

    await addMinimalistLog({
      kind: 'run_minimalist', stage, targetMinutes: m, minutesMinimalist: m,
      totalRunMinutes: total, painMorning: pm, painState
    });

    stage = inferStageFromLogs(await getMinimalistLogs({ limit: 30 }));
    const updated = {
      ...profile,
      minimalist: { ...(profile.minimalist || {}), stage, targetMinutes: ct.nextTarget }
    };
    await saveProfile(updated);
    
    showToast('Session sauvegardée', 'success');
    setTimeout(() => { location.hash = '#/minimalist'; location.reload(); }, 500);
  }});

  const startBtn = Button('Start 180 BPM', { onClick: startMetronome });
  const stopBtn = Button('Stop', { variant: 'btn--ghost', onClick: stopMetronome });

  return h('div', { class: 'grid' },
    Card('Transition Minimaliste',
      Notice('Respectez le temps d’exposition. Plafond à 10% du volume total.'),
      h('div', { class: 'row' },
        h('div', { class: 'badge' }, stage),
        h('div', { class: 'badge badge--ok' }, `Cible: ${targetNow} min`)
      ),
      Divider(),
      h('h3', {}, 'Nouvelle Session'),
      h('div', { class: 'grid grid--2' },
        h('div', {}, h('label', {}, 'Total sortie (min)'), totalRun),
        h('div', {}, h('label', {}, 'Temps minimaliste'), minutes)
      ),
      h('label', {}, 'Douleur le lendemain (0-10)'),
      painMorning, badgeWrap,
      Divider(),
      nextWrap,
      Divider(),
      h('div', { class: 'row row--between' },
         h('div', { class: 'row' }, startBtn, stopBtn),
         saveBtn
      )
    ),
    last ? Card('Dernière session',
      h('div', { class: 'row' },
        Kpi('Date', formatDateTime(last.ts)),
        Kpi('Minutes', `${last.minutesMinimalist || 0}`),
        Kpi('Douleur', last.painMorning ?? '—')
      )
    ) : null
  );
}