// Vue - Séance & Runner (Support Templates, Auto-Régression & Mode Réhab)
import { h, roundToStep, numberOrNull, humanKg } from '../utils.js';
import { Card, Button, Notice, Divider, ProgressBar, showToast, Timer } from '../ui.js';
import { getProfile, saveProfile, addWorkout, addPainLog, getWorkouts, getPainLogs } from '../db.js';
import { listProtocols, warmupPlan, ajusteAPRE, protocolLabel } from '../logic/apre.js';
import { getExercise, listExercises, listTemplates, getTemplate } from '../data/exercises.js';
import { computeTrafficLight } from '../logic/pain.js';

// --- Stickman SVG ---
function makeStickman() {
  const svg = h('svg', { class: 'stickman', viewBox: '0 0 220 220', role: 'img', 'aria-label': 'Stickman tempo' });
  const bg = h('rect', { x: 0, y: 0, width: 220, height: 220, fill: 'transparent' });
  const head = h('circle', { cx: 150, cy: 45, r: 12, stroke: '#e2e8f0', 'stroke-width': 3, fill: 'transparent' });
  const hip = { x: 130, y: 100 };
  const shoulder = { x: 140, y: 70 };
  const knee = { x: 125, y: 140 };
  const ankle = { x: 125, y: 185 };
  const trunk = h('line', { x1: shoulder.x, y1: shoulder.y, x2: hip.x, y2: hip.y, stroke: '#e2e8f0', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const thigh = h('line', { x1: hip.x, y1: hip.y, x2: knee.x, y2: knee.y, stroke: '#e2e8f0', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const shin = h('line', { x1: knee.x, y1: knee.y, x2: ankle.x, y2: ankle.y, stroke: '#e2e8f0', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const arm = h('line', { x1: shoulder.x, y1: shoulder.y, x2: shoulder.x + 30, y2: shoulder.y + 20, stroke: '#94a3b8', 'stroke-width': 3, 'stroke-linecap': 'round' });
  const foot = h('line', { x1: ankle.x - 10, y1: ankle.y + 6, x2: ankle.x + 22, y2: ankle.y + 6, stroke: '#94a3b8', 'stroke-width': 3, 'stroke-linecap': 'round' });
  svg.append(bg, head, trunk, thigh, shin, arm, foot);

  let raf = null;
  let running = false;
  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate({ ecc = 3, pause = 0, con = 1 } = {}) {
    const cycle = (ecc + pause + con) * 1000;
    const start = performance.now();
    running = true;
    const hipTop = { x: 130, y: 100 }; const hipBottom = { x: 120, y: 120 };
    const kneeTop = { x: 125, y: 140 }; const kneeBottom = { x: 140, y: 150 };

    const loop = (now) => {
      if (!running) return;
      const elapsed = (now - start) % cycle;
      const eccMs = ecc * 1000, pauseMs = pause * 1000, conMs = con * 1000;
      let phase = 'ecc', t = 0;

      if (elapsed < eccMs) { phase = 'ecc'; t = elapsed / eccMs; }
      else if (elapsed < eccMs + pauseMs) { phase = 'pause'; t = pauseMs === 0 ? 1 : (elapsed - eccMs) / pauseMs; }
      else { phase = 'con'; t = (elapsed - eccMs - pauseMs) / conMs; }

      let p = (phase === 'ecc') ? t : (phase === 'pause' ? 1 : 1 - t);
      const hx = lerp(hipTop.x, hipBottom.x, p), hy = lerp(hipTop.y, hipBottom.y, p);
      const kx = lerp(kneeTop.x, kneeBottom.x, p), ky = lerp(kneeTop.y, kneeBottom.y, p);
      trunk.setAttribute('x2', hx); trunk.setAttribute('y2', hy);
      thigh.setAttribute('x1', hx); thigh.setAttribute('y1', hy);
      thigh.setAttribute('x2', kx); thigh.setAttribute('y2', ky);
      shin.setAttribute('x1', kx); shin.setAttribute('y1', ky);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
  return { svg, animate, stop };
}

export async function ApreView() {
  const profile = await getProfile();
  if (!profile) { location.hash = '#/onboarding'; return h('div', {}); }

  const protocols = listProtocols();
  const allExercises = listExercises();
  const templates = listTemplates();

  // --- NOUVEAU: DÉTECTION RISQUE / RÉHAB ---
  // On récupère le dernier log douleur pour savoir si on doit brider l'interface
  const logs = await getPainLogs({ limit: 1 });
  const lastPain = logs[0] || null;
  
  // Calcul de l'état actuel (si pas de check-in ce matin, on prend celui d'hier)
  const painState = lastPain ? (lastPain.state || 'VERT') : 'VERT';
  const isInjured = painState === 'ROUGE' || painState === 'ORANGE';
  const injuryZone = lastPain?.bodyPart || 'Zone sensible';
  // ------------------------------------------

  const sessionState = {
    mode: 'selection',
    queue: [],
    currentIndex: 0,
    results: []
  };

  let exState = {
    step: 'setup',
    protocolId: 'APRE6',
    exerciseId: null,
    baselineKg: null,
    repsSet3: null, set4Kg: null, nextBaselineKg: null,
    message: '',
    tempo: { ecc: 3, pause: 0, con: 1 },
    showStickman: true
  };

  const stick = makeStickman();
  let activeTimer = null;
  const root = h('div', { class: 'grid' });

  function getBaseline(exId, protoId) {
    const map = profile.apreBaselines || {};
    const ex = map[exId] || {};
    return Number.isFinite(ex[protoId]) ? ex[protoId] : null;
  }

  function saveBaseline(exId, protoId, val) {
    if (!profile.apreBaselines) profile.apreBaselines = {};
    if (!profile.apreBaselines[exId]) profile.apreBaselines[exId] = {};
    const rounded = roundToStep(val, profile.weightStepKg || 2.5);
    profile.apreBaselines[exId][protoId] = rounded;
    return rounded;
  }

  function startExercise(exId) {
    const ex = getExercise(exId);
    exState = {
      step: 'setup', protocolId: 'APRE6', exerciseId: exId,
      baselineKg: getBaseline(exId, 'APRE6'),
      repsSet3: null, set4Kg: null, nextBaselineKg: null,
      message: '', tempo: { ecc: 3, pause: 0, con: 1 }, showStickman: false
    };
    if (exId === 'lunge_matrix' || exId === 'clamshell_iso') { exState.baselineKg = 0; }
    render();
  }

  async function checkStagnation(results) {
    const workouts = await getWorkouts({ limit: 100 });
    const suggestions = [];

    for (const res of results) {
       if (!res.id || !res.protocolId) continue;
       const history = workouts
         .filter(w => w.exerciseId === res.id && w.protocolId === res.protocolId)
         .sort((a, b) => b.ts - a.ts); 
       
       if (history.length < 3) continue;

       const current = history[0].set4Kg || 0;
       const last = history[1].set4Kg || 0;
       const beforeLast = history[2].set4Kg || 0;

       if (current <= last && last <= beforeLast) {
          const advice = res.protocolId === 'APRE10' 
            ? 'Passez en APRE 6 (Force)' 
            : (res.protocolId === 'APRE6' ? 'Passez en APRE 3 ou Deload' : 'Deload (Semaine légère)');
          suggestions.push({ exercise: res.name, currentProto: res.protocolId, advice: advice });
       }
    }
    return suggestions;
  }

  function triggerRegression() {
    const currentEx = getExercise(exState.exerciseId);
    if (!currentEx) return;

    if (currentEx.regressionId) {
      const newEx = getExercise(currentEx.regressionId);
      if (newEx) {
        sessionState.queue[sessionState.currentIndex] = newEx.id;
        showToast(`Adaptation : Passage à ${newEx.name}`, 'info');
        startExercise(newEx.id);
      } else { showToast("Régression introuvable.", "error"); }
    } else { showToast("C'est déjà la version la plus accessible.", "warning"); }
  }

  function nextExercise() {
    sessionState.currentIndex++;
    if (sessionState.currentIndex < sessionState.queue.length) {
      startExercise(sessionState.queue[sessionState.currentIndex]);
    } else {
      sessionState.mode = 'summary';
      render();
    }
  }

  // --- RENDERERS ---

  function renderSelection() {
    // FILTRAGE INTELLIGENT BASÉ SUR LE TRAFFIC LIGHT
    let visibleTemplates = templates;
    let visibleExercises = allExercises;
    let alertBanner = null;

    if (isInjured) {
       // Si blessé, on ne garde que les templates "safe" ou "rehab"
       visibleTemplates = templates.filter(t => 
         t.tags?.includes('rehab') || 
         t.tags?.includes('safe') || 
         t.tags?.includes('low_impact')
       );
       
       // On cache les exercices à "impact" ou "risk" de la liste individuelle
       visibleExercises = allExercises.filter(e => 
         !e.tags?.includes('impact') && 
         !e.tags?.includes('risk')
       );
       
       alertBanner = h('div', { class: 'notice', style: 'border-left-color:var(--warning); background:rgba(251,191,36,0.1); margin-bottom:1rem;' },
         h('strong', { style:'color:var(--warning)' }, `⚠️ Mode Protection (${painState})`),
         h('div', {}, `Douleur détectée (${injuryZone}). Les exercices à fort impact sont masqués.`)
       );
    }

    const tplDiv = h('div', { class: 'grid' },
      ...visibleTemplates.map(t => {
          const isRehab = t.tags?.includes('rehab');
          return Card(t.name,
            isRehab ? h('span', { class:'badge badge--ok', style:'margin-bottom:8px' }, 'Recommandé') : null,
            h('div', { class: 'small', style: 'margin-bottom:10px' }, t.description),
            h('div', { class: 'row' },
              ...t.exercises.map(eid => h('span', { class: 'badge' }, getExercise(eid)?.name || eid))
            ),
            Divider(),
            Button('Démarrer cette séance', { variant: isRehab ? 'btn--ok' : '', style: 'width:100%', onClick: () => {
              sessionState.queue = [...t.exercises];
              sessionState.currentIndex = 0;
              sessionState.mode = 'running';
              startExercise(sessionState.queue[0]);
            }})
          );
      })
    );
    
    // Si aucun template dispo (cas rare si tout est taggé 'risk')
    if (visibleTemplates.length === 0) {
      tplDiv.innerHTML = '';
      tplDiv.append(Notice("Aucun programme complet disponible dans cet état de douleur. Reposez-vous ou consultez un spécialiste.", "warning"));
    }

    const exoDiv = h('div', { class: 'card' },
      h('h2', {}, 'Ou exercice unique'),
      h('select', { id: 'single-ex-select', style: 'margin-bottom:1rem' },
        ...visibleExercises.map(e => h('option', { value: e.id }, e.name))
      ),
      Button('Go', { onClick: () => {
        const sel = document.getElementById('single-ex-select'); // correction sélecteur
        sessionState.queue = [sel.value];
        sessionState.currentIndex = 0;
        sessionState.mode = 'running';
        startExercise(sessionState.queue[0]);
      }})
    );

    return h('div', { class: 'grid' },
      alertBanner || Notice('Choisissez une routine complète ou un exercice isolé.'),
      tplDiv, exoDiv
    );
  }

  function renderSetup() {
    const currentEx = getExercise(exState.exerciseId);
    const protoSel = h('select', { onChange: (e) => { exState.protocolId = e.target.value; exState.baselineKg = getBaseline(exState.exerciseId, exState.protocolId); render(); } },
      ...protocols.map(p => h('option', { value: p.id, selected: exState.protocolId === p.id }, p.label))
    );
    const baselineInput = h('input', { placeholder: 'Ex: 40', inputmode: 'decimal', value: exState.baselineKg ?? '', onInput: (e) => exState.baselineKg = numberOrNull(e.target.value) });
    const progressTxt = `Exercice ${sessionState.currentIndex + 1} / ${sessionState.queue.length}`;

    return Card(`Configuration : ${currentEx.name}`,
      h('div', { class: 'badge', style:'margin-bottom:1rem' }, progressTxt),
      h('div', { class: 'grid grid--2' },
        h('div', {}, h('label', {}, 'Protocole'), protoSel),
        h('div', {}, h('label', {}, 'Charge départ'), baselineInput)
      ),
      h('div', { class: 'small' }, 'Si poids du corps, mettre 0.'),
      currentEx.cues ? Notice(`<strong>Cues :</strong><br/>${currentEx.cues.map(c=>'- '+c).join('<br/>')}`) : null,
      Divider(),
      h('div', { class: 'row row--between' },
        Button(exState.showStickman ? 'Cacher Tempo' : 'Voir Tempo', { variant: 'btn--ghost', onClick: () => { exState.showStickman = !exState.showStickman; render(); } }),
        Button('Commencer', { onClick: () => {
          const b = numberOrNull(baselineInput.value);
          if (b === null) { showToast('Charge invalide.', 'error'); return; }
          exState.baselineKg = b; exState.step = 'set1'; render();
          if (exState.showStickman) { stick.stop(); stick.animate(exState.tempo); }
        }})
      ),
      exState.showStickman ? stick.svg : null
    );
  }

  function renderSetScreen(setNumber) {
    const stepKg = profile.weightStepKg || 2.5;
    const plan = warmupPlan(exState.baselineKg, exState.protocolId);
    const isSet4 = setNumber === 4;
    const setInfo = isSet4 ? { set: 4, weight: exState.set4Kg, repsHint: 'Max propre', note: 'Ajustement' } : plan.find(s => s.set === setNumber);
    const weightRounded = roundToStep(setInfo.weight, stepKg);
    const pct = Math.round((setNumber / 4) * 100);

    return Card(`Série ${setNumber} / 4`,
      ProgressBar(pct),
      h('div', { style: 'text-align:center; padding: 2rem 0;' },
        h('div', { style: 'font-size:3rem; font-weight:800; color:var(--primary); line-height:1' }, humanKg(weightRounded)),
        h('div', { class: 'small', style: 'margin-top:0.5rem' }, setInfo.note),
        setInfo.repsHint ? h('div', { class: 'badge', style:'margin-top:1rem' }, `Cible : ${setInfo.repsHint} reps`) : null,
        h('div', {}, Button('Trop dur / Douleur ?', { variant: 'btn--ghost', style: 'color:var(--danger); border-color:rgba(248,113,113,0.3); font-size:0.75rem; padding:6px 10px; margin-top:1rem;', onClick: () => triggerRegression() }))
      ),
      exState.showStickman ? stick.svg : null,
      Divider(),
      h('div', { class: 'row row--between' },
        Button('Retour', { variant: 'btn--ghost', onClick: () => {
            if (setNumber === 1) exState.step = 'setup';
            else if (setNumber === 2) exState.step = 'set1';
            else if (setNumber === 3) exState.step = 'set2';
            else if (setNumber === 4) exState.step = 'set3_input';
            render();
        }}),
        Button(setNumber === 3 ? 'Saisir Reps' : (setNumber === 4 ? 'Finir Exercice' : 'Repos'), { onClick: () => {
          if (setNumber === 4) {
            finishCurrentExercise();
          } else {
            exState.step = 'rest';
            exState.nextSet = setNumber + 1;
          }
          render();
        }})
      )
    );
  }

  function renderRestScreen() {
    const duration = 90;
    const onComplete = () => {
      exState.step = `set${exState.nextSet}`;
      render();
    };

    activeTimer = Timer(duration, onComplete);

    const skipButton = Button('Passer', {
      variant: 'btn--ghost',
      onClick: () => {
        activeTimer.destroy();
        onComplete();
      }
    });

    const timerCard = Card('Repos',
      h('div', { style: 'display:flex; justify-content:center; padding: 1rem 0;' }, activeTimer.el),
      h('div', { style: 'text-align:center;' }, skipButton)
    );

    // Démarrer le timer après l'affichage pour que l'animation soit fluide
    setTimeout(() => activeTimer.start(), 50);

    return timerCard;
  }

  function renderSet3Input() {
    const repsInput = h('input', { placeholder: 'Ex: 8', inputmode: 'numeric', value: exState.repsSet3 ?? '', autoFocus: true });
    return Card('Série 3 - Résultat',
      Notice('Entrez le nombre de répétitions réalisées.'),
      h('label', {}, 'Répétitions'), repsInput,
      Divider(),
      h('div', { class: 'row row--between' },
        h('div', { class: 'row' }, Button('Retour', { variant: 'btn--ghost', onClick: () => { exState.step = 'set3'; render(); } }), Button('Trop dur ?', { variant: 'btn--ghost', style:'color:var(--danger);font-size:0.75rem;', onClick:()=>triggerRegression() })),
        Button('Calculer Série 4', { onClick: () => {
          const reps = numberOrNull(repsInput.value);
          if (reps == null || reps < 0) { showToast('Reps invalides.', 'error'); return; }
          exState.repsSet3 = reps;
          const adj = ajusteAPRE({ protocolId: exState.protocolId, repsSet3: reps });
          const stepKg = profile.weightStepKg || 2.5;
          exState.set4Kg = roundToStep(exState.baselineKg + adj.set4Delta, stepKg);
          exState.nextBaselineKg = roundToStep(exState.baselineKg + adj.nextDelta, stepKg);
          exState.message = adj.message;
          exState.step = 'rest'; // Va au repos avant la série 4
          exState.nextSet = 4;
          render();
        }})
      )
    );
  }
  
  async function finishCurrentExercise() {
     const roundedBase = saveBaseline(exState.exerciseId, exState.protocolId, exState.nextBaselineKg ?? exState.baselineKg);
     await saveProfile(profile);
     const exName = getExercise(exState.exerciseId)?.name || exState.exerciseId;
     await addWorkout({
        kind: 'apre', protocolId: exState.protocolId, exerciseId: exState.exerciseId, exerciseName: exName,
        baselineStartKg: exState.baselineKg, repsSet3: exState.repsSet3, set4Kg: exState.set4Kg, baselineNextKg: roundedBase
     });
     sessionState.results.push({ id: exState.exerciseId, protocolId: exState.protocolId, name: exName, load: humanKg(exState.set4Kg), next: humanKg(roundedBase) });
     showToast(`${exName} terminé !`, 'success');
     nextExercise();
  }

  function renderSummary() {
    const adviceContainer = h('div', { class: 'stack' });
    checkStagnation(sessionState.results).then(suggestions => {
       if (suggestions.length === 0) return;
       adviceContainer.innerHTML = '';
       adviceContainer.appendChild(Divider());
       adviceContainer.appendChild(Notice('<strong>🧠 Intelligence Coach :</strong> Stagnation détectée !', 'warning'));
       suggestions.forEach(s => {
           adviceContainer.appendChild(h('div', { class: 'card', style: 'background:rgba(251, 191, 36, 0.1); border:1px solid var(--warning); padding:1rem;' }, 
              h('strong', { style:'color:var(--warning)' }, s.exercise),
              h('div', { class:'small' }, `Charge stable depuis 3 séances.`),
              h('div', { style:'margin-top:5px; font-weight:bold' }, `👉 Conseil : ${s.advice}`)
           ));
       });
    });

    const bodyPart = h('input', { placeholder: 'Ex: Genoux, Dos...', value: exState.painBodyPart || '' });
    const painAfter = h('input', { placeholder: '0-10', inputmode: 'numeric', value: exState.painAfter ?? '' });
    const painMorning = h('input', { placeholder: '0-10', inputmode: 'numeric', value: exState.painMorning ?? '' });

    return Card('Séance Terminée !',
      h('h3', {}, 'Bilan'),
      h('div', { class: 'stack', style: 'margin-top:1rem' },
        ...sessionState.results.map(r => h('div', { class: 'row row--between', style: 'border-bottom:1px solid var(--panel-border); padding:8px 0' },
            h('span', {}, r.name),
            h('span', { class: 'badge' }, `${r.load} -> ${r.next}`)
        ))
      ),
      adviceContainer,
      Divider(),
      h('h3', {}, 'Douleur (Global)'),
      h('div', { class: 'grid grid--2' },
        h('div', {}, h('label', {}, 'Zone'), bodyPart),
        h('div', {}, h('label', {}, 'Après (0-10)'), painAfter)
      ),
      h('label', {}, 'Lendemain matin (0-10)'), painMorning,
      Divider(),
      Button('Sauvegarder et Quitter', { variant: 'btn--ok', onClick: async () => {
        const pa = numberOrNull(painAfter.value);
        const pm = numberOrNull(painMorning.value);
        if (pa != null || pm != null) {
            const pd = computeTrafficLight({ painAfter: pa ?? 0, painMorning: pm });
            await addPainLog({ kind: 'after_session', bodyPart: bodyPart.value.trim(), painAfter: pa, painMorning: pm, state: pd.state, note: 'Fin de séance complète' });
        }
        location.hash = '#/history';
      }})
    );
  }

  function render() {
    root.innerHTML = '';
    // Nettoie tout timer actif avant de re-rendre
    if (activeTimer) {
      activeTimer.destroy();
      activeTimer = null;
    }

    if (sessionState.mode === 'selection') root.appendChild(renderSelection());
    else if (sessionState.mode === 'summary') root.appendChild(renderSummary());
    else {
        if (exState.step === 'setup') root.appendChild(renderSetup());
        else if (exState.step === 'set1') root.appendChild(renderSetScreen(1));
        else if (exState.step === 'set2') root.appendChild(renderSetScreen(2));
        else if (exState.step === 'set3') root.appendChild(renderSetScreen(3));
        else if (exState.step === 'set3_input') root.appendChild(renderSet3Input());
        else if (exState.step === 'rest') root.appendChild(renderRestScreen());
        else if (exState.step === 'set4') root.appendChild(renderSetScreen(4));
        if (exState.showStickman && ['setup','set1','set2','set3','set4'].includes(exState.step)) { stick.stop(); stick.animate(exState.tempo); } else { stick.stop(); }
    }
  }

  render();

  return {
    el: root,
    onunload: () => {
      stick.stop();
      if (activeTimer) {
        activeTimer.destroy();
      }
    }
  };
}