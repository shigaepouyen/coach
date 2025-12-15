// Vue - séance APRE
import { h, roundToStep, numberOrNull, humanKg } from '../utils.js';
import { Card, Button, Notice, Divider, ProgressBar } from '../ui.js';
import { getProfile, saveProfile, addWorkout, addPainLog } from '../db.js';
import { listProtocols, warmupPlan, ajusteAPRE, protocolLabel, protocolTarget } from '../logic/apre.js';
import { getExercise } from '../data/exercises.js';
import { computeTrafficLight } from '../logic/pain.js';

function makeStickman() {
  const svg = h('svg', { class: 'stickman', viewBox: '0 0 220 220', role: 'img', 'aria-label': 'Stickman tempo squat' });

  const bg = h('rect', { x: 0, y: 0, width: 220, height: 220, fill: 'transparent' });

  const head = h('circle', { cx: 150, cy: 45, r: 12, stroke: 'rgba(232,238,242,0.9)', 'stroke-width': 3, fill: 'transparent' });

  const hip = { x: 130, y: 100 };
  const shoulder = { x: 140, y: 70 };
  const knee = { x: 125, y: 140 };
  const ankle = { x: 125, y: 185 };

  const trunk = h('line', { x1: shoulder.x, y1: shoulder.y, x2: hip.x, y2: hip.y, stroke: 'rgba(232,238,242,0.9)', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const thigh = h('line', { x1: hip.x, y1: hip.y, x2: knee.x, y2: knee.y, stroke: 'rgba(232,238,242,0.9)', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const shin = h('line', { x1: knee.x, y1: knee.y, x2: ankle.x, y2: ankle.y, stroke: 'rgba(232,238,242,0.9)', 'stroke-width': 4, 'stroke-linecap': 'round' });

  const arm = h('line', { x1: shoulder.x, y1: shoulder.y, x2: shoulder.x + 30, y2: shoulder.y + 20, stroke: 'rgba(232,238,242,0.6)', 'stroke-width': 3, 'stroke-linecap': 'round' });

  const foot = h('line', { x1: ankle.x - 10, y1: ankle.y + 6, x2: ankle.x + 22, y2: ankle.y + 6, stroke: 'rgba(232,238,242,0.6)', 'stroke-width': 3, 'stroke-linecap': 'round' });

  svg.append(bg, head, trunk, thigh, shin, arm, foot);

  let raf = null;
  let running = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate({ ecc = 3, pause = 0, con = 1 } = {}) {
    const cycle = (ecc + pause + con) * 1000;
    const start = performance.now();
    running = true;

    const hipTop = { x: 130, y: 100 };
    const hipBottom = { x: 120, y: 120 };
    const kneeTop = { x: 125, y: 140 };
    const kneeBottom = { x: 140, y: 150 };

    const loop = (now) => {
      if (!running) return;
      const elapsed = (now - start) % cycle;

      // phases: ecc (descente) -> pause -> con (montée)
      let phase = 'ecc';
      let t = 0;

      const eccMs = ecc * 1000;
      const pauseMs = pause * 1000;
      const conMs = con * 1000;

      if (elapsed < eccMs) {
        phase = 'ecc';
        t = elapsed / eccMs;
      } else if (elapsed < eccMs + pauseMs) {
        phase = 'pause';
        t = pauseMs === 0 ? 1 : (elapsed - eccMs) / pauseMs;
      } else {
        phase = 'con';
        t = (elapsed - eccMs - pauseMs) / conMs;
      }

      // progress down-up
      let p;
      if (phase === 'ecc') p = t;
      else if (phase === 'pause') p = 1;
      else p = 1 - t;

      const hx = lerp(hipTop.x, hipBottom.x, p);
      const hy = lerp(hipTop.y, hipBottom.y, p);
      const kx = lerp(kneeTop.x, kneeBottom.x, p);
      const ky = lerp(kneeTop.y, kneeBottom.y, p);

      trunk.setAttribute('x2', hx);
      trunk.setAttribute('y2', hy);
      thigh.setAttribute('x1', hx);
      thigh.setAttribute('y1', hy);
      thigh.setAttribute('x2', kx);
      thigh.setAttribute('y2', ky);
      shin.setAttribute('x1', kx);
      shin.setAttribute('y1', ky);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  return { svg, animate, stop };
}

export async function ApreView() {
  const profile = await getProfile();
  if (!profile) {
    location.hash = '#/onboarding';
    return h('div', {});
  }

  const protocols = listProtocols();
  const exercises = [
    'goblet_squat',
    'back_squat',
    'calf_single_loaded',
    'calf_ecc_single',
    'plank_elbows',
    'short_foot'
  ].map(id => getExercise(id)).filter(Boolean);

  const state = {
    step: 'setup', // setup | set1 | set2 | set3 | set4 | done
    protocolId: 'APRE6',
    exerciseId: exercises[0]?.id || 'goblet_squat',
    baselineKg: null,
    repsSet3: null,
    set4Kg: null,
    nextBaselineKg: null,
    message: '',
    tempo: { ecc: 3, pause: 0, con: 1 },
    showStickman: false,
    painAfter: null,
    painMorning: null,
    painBodyPart: ''
  };

  const stick = makeStickman();

  const root = h('div', { class: 'grid' });

  function getBaselineFromProfile() {
    const map = profile.apreBaselines || {};
    const ex = map[state.exerciseId] || {};
    const w = ex[state.protocolId];
    return Number.isFinite(w) ? w : null;
  }

  function setBaselineInProfile(nextKg) {
    const stepKg = profile.weightStepKg || 2.5;
    const rounded = roundToStep(nextKg, stepKg);

    const baselines = { ...(profile.apreBaselines || {}) };
    baselines[state.exerciseId] = { ...(baselines[state.exerciseId] || {}) };
    baselines[state.exerciseId][state.protocolId] = rounded;
    profile.apreBaselines = baselines;
    return rounded;
  }

  function renderSetup() {
    const protoSel = h('select', { onChange: (e) => { state.protocolId = e.target.value; state.baselineKg = getBaselineFromProfile(); render(); } },
      ...protocols.map(p => h('option', { value: p.id, selected: state.protocolId === p.id }, p.label))
    );

    const exSel = h('select', { onChange: (e) => { state.exerciseId = e.target.value; state.baselineKg = getBaselineFromProfile(); render(); } },
      ...exercises.map(ex => h('option', { value: ex.id, selected: state.exerciseId === ex.id }, `${ex.name}`))
    );

    const baselineInput = h('input', {
      placeholder: 'Ex: 40',
      inputmode: 'decimal',
      value: state.baselineKg ?? getBaselineFromProfile() ?? '',
      onInput: (e) => state.baselineKg = numberOrNull(e.target.value)
    });

    const tempoE = h('input', { placeholder: '3', inputmode: 'decimal', value: String(state.tempo.ecc), onInput: (e) => state.tempo.ecc = Math.max(0, numberOrNull(e.target.value) ?? 0) });
    const tempoP = h('input', { placeholder: '0', inputmode: 'decimal', value: String(state.tempo.pause), onInput: (e) => state.tempo.pause = Math.max(0, numberOrNull(e.target.value) ?? 0) });
    const tempoC = h('input', { placeholder: '1', inputmode: 'decimal', value: String(state.tempo.con), onInput: (e) => state.tempo.con = Math.max(0, numberOrNull(e.target.value) ?? 0) });

    const startBtn = Button('Démarrer', { onClick: () => {
      const b = numberOrNull(baselineInput.value);
      if (!b || b <= 0) { alert('Entrez une charge de départ (kg) pour la série 3.'); return; }
      state.baselineKg = b;
      state.step = 'set1';
      render();
      if (state.showStickman) {
        stick.stop();
        stick.animate(state.tempo);
      }
    }});

    const stickToggle = Button(state.showStickman ? 'Masquer le stickman' : 'Afficher le stickman', { variant: 'btn--ghost', onClick: () => {
      state.showStickman = !state.showStickman;
      render();
      if (state.showStickman) {
        stick.stop();
        stick.animate(state.tempo);
      } else {
        stick.stop();
      }
    }});

    const hint = getExercise(state.exerciseId)?.cues?.slice(0,2)?.map(c => `- ${c}`).join('<br/>') || '';

    return Card('Séance APRE',
      Notice(`<strong>Principe</strong> - 4 séries - la 3ème pilote l’ajustement (auto-régulation).`),
      Divider(),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Protocole'),
          protoSel,
          h('div', { class: 'small' }, `Cible reps set 3 - ${protocolTarget(state.protocolId)}.`)
        ),
        h('div', {},
          h('label', {}, 'Exercice'),
          exSel
        )
      ),
      h('label', {}, 'Charge de départ (série 3) en kg'),
      baselineInput,
      h('div', { class: 'small' }, 'C’est votre estimation du RM du protocole (3RM - 6RM - 10RM). On corrigera automatiquement.'),
      Divider(),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Tempo (descente) en secondes'),
          tempoE
        ),
        h('div', {},
          h('label', {}, 'Tempo (pause) en secondes'),
          tempoP
        )
      ),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Tempo (montée) en secondes'),
          tempoC
        ),
        h('div', {},
          h('label', {}, 'Arrondi des charges'),
          h('div', { class: 'badge' }, `${profile.weightStepKg || 2.5} kg`)
        )
      ),
      hint ? Notice(`<strong>Points clés</strong><br/>${hint}`) : null,
      Divider(),
      h('div', { class: 'row row--between' },
        h('div', { class: 'row' }, startBtn, stickToggle),
        Button('Retour', { variant: 'btn--ghost', onClick: () => location.hash = '#/home' })
      ),
      state.showStickman ? h('div', { class: 'row' }, stick.svg) : null
    );
  }

  function renderSetScreen(setNumber) {
    const stepKg = profile.weightStepKg || 2.5;
    const plan = warmupPlan(state.baselineKg, state.protocolId);
    const isSet4 = setNumber === 4;

    const setInfo = isSet4
      ? { set: 4, weight: state.set4Kg, repsHint: 'max propre', note: 'Série d’ajustement' }
      : plan.find(s => s.set === setNumber);

    const weightRounded = roundToStep(setInfo.weight, stepKg);

    const pct = Math.round((setNumber / 4) * 100);

    const title = `Série ${setNumber} sur 4`;
    const note = `${setInfo.note || ''}`;
    const reps = setInfo.repsHint != null ? `Objectif reps (indicatif) - ${setInfo.repsHint}` : '';

    const nextBtnLabel = setNumber === 3 ? 'Entrer les reps de la série 3' : (setNumber === 4 ? 'Terminer' : 'Série suivante');

    const content = h('div', { class: 'stack' },
      ProgressBar(pct),
      h('div', { class: 'row row--between' },
        h('div', { class: 'badge' }, protocolLabel(state.protocolId)),
        h('div', { class: 'badge' }, getExercise(state.exerciseId)?.name || state.exerciseId)
      ),
      h('div', { class: 'notice' },
        h('div', { class: 'small' }, note),
        h('div', { class: 'mono', style: 'font-size:26px; font-weight:800; margin-top:8px; color: var(--text)' }, humanKg(weightRounded)),
        reps ? h('div', { class: 'small', style: 'margin-top:8px' }, reps) : null
      ),
      state.showStickman ? h('div', { class: 'row' }, stick.svg) : null
    );

    const nextBtn = Button(nextBtnLabel, { onClick: () => {
      if (setNumber === 1) { state.step = 'set2'; render(); return; }
      if (setNumber === 2) { state.step = 'set3'; render(); return; }
      if (setNumber === 3) { state.step = 'set3_input'; render(); return; }
      if (setNumber === 4) { state.step = 'done'; render(); return; }
    }});

    const backBtn = Button('Revenir', { variant: 'btn--ghost', onClick: () => {
      if (setNumber === 1) { state.step = 'setup'; render(); return; }
      if (setNumber === 2) { state.step = 'set1'; render(); return; }
      if (setNumber === 3) { state.step = 'set2'; render(); return; }
      if (setNumber === 4) { state.step = 'set3_input'; render(); return; }
    }});

    return Card(title,
      content,
      Divider(),
      h('div', { class: 'row row--between' },
        h('div', { class: 'row' }, backBtn),
        h('div', { class: 'row' }, nextBtn)
      )
    );
  }

  function renderSet3Input() {
    const repsInput = h('input', { placeholder: 'Ex: 7', inputmode: 'numeric', value: state.repsSet3 ?? '' });
    const hint = 'Comptez uniquement les reps avec technique propre. Stop dès que ça s’effondre.';

    const confirmBtn = Button('Calculer la série 4', { onClick: () => {
      const reps = numberOrNull(repsInput.value);
      if (reps == null || reps < 0) { alert('Entrez un nombre de répétitions.'); return; }
      state.repsSet3 = reps;
      const adj = ajusteAPRE({ protocolId: state.protocolId, repsSet3: reps });
      const stepKg = profile.weightStepKg || 2.5;
      state.set4Kg = roundToStep(state.baselineKg + adj.set4Delta, stepKg);
      state.nextBaselineKg = roundToStep(state.baselineKg + adj.nextDelta, stepKg);
      state.message = adj.message;
      state.step = 'set4';
      render();
    }});

    return Card('Série 3 - résultat',
      Notice(`<strong>Input critique</strong> - c’est ici que l’app joue les coachs (sans crier dans votre oreille).`),
      h('label', {}, 'Répétitions réalisées (série 3)'),
      repsInput,
      h('div', { class: 'small' }, hint),
      Divider(),
      h('div', { class: 'row row--between' },
        Button('Revenir', { variant: 'btn--ghost', onClick: () => { state.step = 'set3'; render(); } }),
        confirmBtn
      )
    );
  }

  function renderSet4() {
    const msg = state.message || '—';
    return h('div', { class: 'grid' },
      renderSetScreen(4),
      Card('Ajustement',
        Notice(`<strong>Décision</strong> - ${msg}`),
        h('div', { class: 'row' },
          h('div', { class: 'kpi' }, h('div', { class: 'kpi__label' }, 'Série 4'), h('div', { class: 'kpi__value' }, humanKg(state.set4Kg))),
          h('div', { class: 'kpi' }, h('div', { class: 'kpi__label' }, 'Baseline prochaine séance'), h('div', { class: 'kpi__value' }, humanKg(state.nextBaselineKg)))
        )
      )
    );
  }

  function renderDone() {
    const bodyPart = h('input', { placeholder: 'Ex: tendon d’Achille, genou, hanche…', value: state.painBodyPart || '' });
    const painAfter = h('input', { placeholder: '0-10', inputmode: 'numeric', value: state.painAfter ?? '' });
    const painMorning = h('input', { placeholder: '0-10', inputmode: 'numeric', value: state.painMorning ?? '' });

    const saveBtn = Button('Enregistrer la séance', { variant: 'btn--ok', onClick: async () => {
      // baseline update
      const roundedBaseline = setBaselineInProfile(state.nextBaselineKg ?? state.baselineKg);
      await saveProfile(profile);

      const ex = getExercise(state.exerciseId);

      const workout = await addWorkout({
        kind: 'apre',
        protocolId: state.protocolId,
        exerciseId: state.exerciseId,
        exerciseName: ex?.name || state.exerciseId,
        baselineStartKg: state.baselineKg,
        repsSet3: state.repsSet3,
        set4Kg: state.set4Kg,
        baselineNextKg: roundedBaseline
      });

      // optional pain log
      const pa = numberOrNull(painAfter.value);
      const pm = numberOrNull(painMorning.value);
      if (pa != null || pm != null) {
        const painDecision = computeTrafficLight({ painAfter: pa ?? 0, painMorning: pm });
        await addPainLog({
          kind: 'after_apre',
          relatedWorkoutId: workout.id,
          bodyPart: bodyPart.value.trim(),
          painAfter: pa,
          painMorning: pm,
          state: painDecision.state
        });
      }

      location.hash = '#/history';
    }});

    const cancelBtn = Button('Recommencer', { variant: 'btn--ghost', onClick: () => {
      state.step = 'setup';
      state.repsSet3 = null;
      state.set4Kg = null;
      state.nextBaselineKg = null;
      state.message = '';
      render();
    }});

    return Card('Fin de séance',
      Notice('<strong>Bien</strong> - maintenant, on stocke et on garde une trace. L’oubli, c’est l’ennemi de la progression.'),
      Divider(),
      h('div', { class: 'row' },
        h('div', { class: 'kpi' }, h('div', { class: 'kpi__label' }, 'Baseline début'), h('div', { class: 'kpi__value' }, humanKg(roundToStep(state.baselineKg, profile.weightStepKg || 2.5)))),
        h('div', { class: 'kpi' }, h('div', { class: 'kpi__label' }, 'Reps série 3'), h('div', { class: 'kpi__value' }, String(state.repsSet3 ?? '—'))),
        h('div', { class: 'kpi' }, h('div', { class: 'kpi__label' }, 'Baseline suivante'), h('div', { class: 'kpi__value' }, humanKg(state.nextBaselineKg ?? state.baselineKg)))
      ),
      Divider(),
      h('h3', {}, 'Check douleur (optionnel mais malin)'),
      h('div', { class: 'grid grid--2' },
        h('div', {}, h('label', {}, 'Zone'), bodyPart),
        h('div', {}, h('label', {}, 'Après effort (0-10)'), painAfter)
      ),
      h('div', {},
        h('label', {}, 'Le lendemain matin (0-10)'),
        painMorning,
        h('div', { class: 'small' }, 'Si la douleur monte à +24h, c’est un signal de surcharge.')
      ),
      Divider(),
      h('div', { class: 'row row--between' },
        cancelBtn,
        saveBtn
      )
    );
  }

  function render() {
    root.innerHTML = '';
    if (state.step === 'setup') root.appendChild(renderSetup());
    else if (state.step === 'set1') root.appendChild(renderSetScreen(1));
    else if (state.step === 'set2') root.appendChild(renderSetScreen(2));
    else if (state.step === 'set3') root.appendChild(renderSetScreen(3));
    else if (state.step === 'set3_input') root.appendChild(renderSet3Input());
    else if (state.step === 'set4') root.appendChild(renderSet4());
    else if (state.step === 'done') root.appendChild(renderDone());

    // stickman control
    if (state.showStickman && (state.step === 'setup' || state.step === 'set1' || state.step === 'set2' || state.step === 'set3' || state.step === 'set4')) {
      stick.stop();
      stick.animate(state.tempo);
    } else {
      stick.stop();
    }
  }

  // init baseline from profile
  state.baselineKg = getBaselineFromProfile();

  render();
  return root;
}
