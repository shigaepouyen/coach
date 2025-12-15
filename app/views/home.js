// Vue - accueil
import { h, formatDateTime, trafficLightBadge, trafficLightFromPain, humanKg } from '../utils.js';
import { Card, Button, Notice, Divider, Kpi } from '../ui.js';
import { getProfile, getWorkouts, getPainLogs, getMinimalistLogs, saveProfile } from '../db.js';
import { inferStageFromLogs, computeNextTarget } from '../logic/minimalist.js';
import { protocolLabel } from '../logic/apre.js';

function last(arr) { return arr && arr.length ? arr[0] : null; }

export async function HomeView() {
  const profile = await getProfile();
  if (!profile) {
    location.hash = '#/onboarding';
    return h('div', {});
  }

  const [workouts, pains, minis] = await Promise.all([
    getWorkouts({ limit: 20 }),
    getPainLogs({ limit: 20 }),
    getMinimalistLogs({ limit: 20 })
  ]);

  const lastWorkout = last(workouts);
  const lastPain = last(pains);
  const lastMini = last(minis);

  const painState = lastPain ? trafficLightFromPain(Math.max(lastPain.painAfter ?? 0, lastPain.painMorning ?? 0)) : null;
  const painBadge = painState ? trafficLightBadge(painState) : null;

  const stage = inferStageFromLogs(minis);
  const target = computeNextTarget({
    lastTarget: lastMini?.targetMinutes || profile.minimalist?.targetMinutes || 1,
    lastPainState: lastMini?.painState || 'VERT',
    stage,
    totalRunMinutes: profile.runningWeeklyMinutes ? (profile.runningWeeklyMinutes / 3) : null // approximation: 3 sorties
  });

  // garder stage/target en profil pour cohérence
  const newProfile = {
    ...profile,
    minimalist: { ...(profile.minimalist || {}), stage, targetMinutes: target.nextTarget }
  };
  // écriture opportuniste, mais seulement si ça change vraiment
  if ((profile.minimalist?.stage !== stage) || (profile.minimalist?.targetMinutes !== target.nextTarget)) {
    saveProfile(newProfile).catch(() => {});
  }

  const greet = profile.name ? `Bonjour ${profile.name}` : 'Bonjour';

  const coachLine = (() => {
    if (!painState) return 'Vous lancez la machine. Ajoutez un check douleur après vos séances, votre futur vous remerciera.';
    if (painState === 'ROUGE') return 'Signal rouge - l’objectif du jour c’est de durer. Régression ou repos, et on repart propre.';
    if (painState === 'ORANGE') return 'Signal orange - maintenance intelligente. La progression, c’est aussi savoir attendre 24h.';
    return 'Signal vert - feu vert, mais la technique reste la loi.';
  })();

  const baselinePeek = (() => {
    const b = profile.apreBaselines || {};
    const exIds = Object.keys(b);
    if (!exIds.length) return null;
    const ex0 = exIds[0];
    const p = b[ex0]?.APRE6 ?? b[ex0]?.APRE10 ?? b[ex0]?.APRE3;
    if (!p) return null;
    return `Baseline exemple - ${ex0} : ${humanKg(p)}`;
  })();

  return h('div', { class: 'grid' },
    Card(greet,
      Notice(`<strong>Coaching du jour</strong> - ${coachLine}`),
      baselinePeek ? h('div', { class: 'small mono' }, baselinePeek) : null
    ),

    h('div', { class: 'grid grid--2' },
      Card('Résumé',
        h('div', { class: 'row' },
          Kpi('Dernière séance', lastWorkout ? formatDateTime(lastWorkout.ts) : '—'),
          Kpi('Type', lastWorkout ? (lastWorkout.kind === 'apre' ? protocolLabel(lastWorkout.protocolId) : lastWorkout.kind) : '—'),
          Kpi('Minimaliste - prochaine dose', `${target.nextTarget} min`)
        ),
        Divider(),
        h('div', { class: 'row row--between' },
          Button('Lancer une séance', { onClick: () => location.hash = '#/apre' }),
          Button('Check douleur', { variant: 'btn--ghost', onClick: () => location.hash = '#/pain' }),
          Button('Transition minimaliste', { variant: 'btn--ghost', onClick: () => location.hash = '#/minimalist' })
        )
      ),
      Card('État douleur',
        painBadge ? h('div', { class: painBadge.cls }, painBadge.label) : Notice('Pas de données récentes. Ajoutez un check-in (après effort et le lendemain matin).'),
        lastPain ? h('div', { class: 'small' }, `Dernier check - après: ${lastPain.painAfter ?? '—'}/10 - matin: ${lastPain.painMorning ?? '—'}/10 - zone: ${lastPain.bodyPart || '—'}`) : null
      )
    ),

    Card('Bibliothèque',
      h('p', {}, 'Une base d’exercices avec progressions - régressions, pour que l’entraînement continue même quand la forme du jour décide d’être capricieuse.'),
      Button('Ouvrir la bibliothèque', { variant: 'btn--ghost', onClick: () => location.hash = '#/library' })
    ),

    Card('Profil',
      h('div', { class: 'row' },
        h('div', { class: 'kpi' }, h('div', { class: 'kpi__label' }, 'Niveau'), h('div', { class: 'kpi__value' }, profile.trainingAge || '—')),
        h('div', { class: 'kpi' }, h('div', { class: 'kpi__label' }, 'Arrondi charges'), h('div', { class: 'kpi__value' }, `${profile.weightStepKg || 2.5} kg`))
      ),
      Divider(),
      Button('Modifier le profil', { variant: 'btn--ghost', onClick: () => location.hash = '#/onboarding' })
    )
  );
}
