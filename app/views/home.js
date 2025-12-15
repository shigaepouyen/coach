// Vue - accueil (Mise à jour : Ajout du Score de Durabilité)
import { h, formatDateTime, trafficLightBadge, trafficLightFromPain, humanKg } from '../utils.js';
import { Card, Button, Notice, Divider, Kpi } from '../ui.js';
import { getProfile, getWorkouts, getPainLogs, getMinimalistLogs, saveProfile } from '../db.js';
import { inferStageFromLogs, computeNextTarget } from '../logic/minimalist.js';
import { protocolLabel } from '../logic/apre.js';

function last(arr) { return arr && arr.length ? arr[0] : null; }

// --- ALGO GAMIFICATION ---
function computeDurabilityScore(recentWorkouts, lastPainState) {
  // 1. Point de départ
  let score = 50; 
  
  // 2. Bonus Régularité (sur les 7 derniers jours)
  // On vise 3-4 séances par semaine. Chaque séance vaut +15 pts.
  const frequencyBonus = Math.min(recentWorkouts.length * 15, 60);
  score += frequencyBonus;

  // 3. Pénalité / Bonus Douleur (Le plus important)
  if (lastPainState === 'VERT') score += 10;
  else if (lastPainState === 'ORANGE') score -= 20;
  else if (lastPainState === 'ROUGE') score -= 50; // Chute drastique si blessé

  // Bornes 0 - 100
  return Math.max(0, Math.min(100, score));
}

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

  // --- CALCUL KPI DURABILITÉ ---
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentWorkouts = workouts.filter(w => w.ts > oneWeekAgo);
  const durabilityScore = computeDurabilityScore(recentWorkouts, painState || 'VERT');

  const stage = inferStageFromLogs(minis);
  const target = computeNextTarget({
    lastTarget: lastMini?.targetMinutes || profile.minimalist?.targetMinutes || 1,
    lastPainState: lastMini?.painState || 'VERT',
    stage,
    totalRunMinutes: profile.runningWeeklyMinutes ? (profile.runningWeeklyMinutes / 3) : null 
  });

  // Sauvegarde opportuniste (inchangée)
  const newProfile = {
    ...profile,
    minimalist: { ...(profile.minimalist || {}), stage, targetMinutes: target.nextTarget }
  };
  if ((profile.minimalist?.stage !== stage) || (profile.minimalist?.targetMinutes !== target.nextTarget)) {
    saveProfile(newProfile).catch(() => {});
  }

  const greet = profile.name ? `Bonjour ${profile.name}` : 'Bonjour';
  
  // Feedback contextuel basé sur le Score
  let coachLine = '';
  if (durabilityScore > 80) coachLine = 'Excellente dynamique. Vous construisez du solide.';
  else if (durabilityScore > 50) coachLine = 'Bonne régularité. Attention aux petits signaux.';
  else coachLine = 'Priorité : Récupération et écoute du corps. Ne forcez pas.';

  const el = h('div', { class: 'grid' },
    Card(greet,
      // Nouveau Bloc Gamification
      h('div', { class: 'row row--between', style: 'align-items:center; margin-bottom:1rem' },
        h('div', {}, 
           h('div', { class: 'small' }, 'Score de Durabilité'),
           h('div', { style: `font-size:2.5rem; font-weight:800; color:${durabilityScore > 75 ? 'var(--success)' : (durabilityScore < 40 ? 'var(--danger)' : 'var(--primary)')}` }, durabilityScore)
        ),
        h('div', { style: 'text-align:right' },
           h('div', { class: 'small' }, 'Séances (7j)'),
           h('div', { style: 'font-size:1.5rem; font-weight:700;' }, recentWorkouts.length)
        )
      ),
      Notice(`<strong>Conseil :</strong> ${coachLine}`),
      Divider(),
      h('div', { class: 'row row--between' },
         Button('Lancer une séance', { onClick: () => location.hash = '#/apre' }),
         Button('Check douleur', { variant: 'btn--ghost', onClick: () => location.hash = '#/pain' })
      )
    ),

    h('div', { class: 'grid grid--2' },
      Card('Dernière séance',
        h('div', { class: 'small' }, lastWorkout ? formatDateTime(lastWorkout.ts) : '—'),
        h('div', { style:'font-weight:600; margin-top:5px' }, lastWorkout ? (lastWorkout.kind === 'apre' ? protocolLabel(lastWorkout.protocolId) : lastWorkout.kind) : 'Aucune'),
        h('div', { class: 'small' }, lastWorkout?.exerciseName || '')
      ),
      Card('État douleur',
        painBadge ? h('div', { class: painBadge.cls }, painBadge.label) : Notice('Aucune donnée récente.'),
        lastPain ? h('div', { class: 'small', style:'margin-top:5px' }, `${lastPain.bodyPart || 'Zone?'} (Matin: ${lastPain.painMorning ?? '-'})`) : null
      )
    ),
    
    Card('Minimalisme',
      h('div', { class: 'row row--between' },
         h('div', {}, 
            h('div', { class: 'small' }, 'Prochaine dose'),
            h('div', { style:'font-weight:700; font-size:1.2rem' }, `${target.nextTarget} min`)
         ),
         Button('Noter sortie', { variant: 'btn--ghost', onClick: () => location.hash = '#/minimalist' })
      )
    )
  );

  return { el };
}