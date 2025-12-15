// Coach - logique APRE (auto-régulation, parce que vous n'êtes pas un robot... enfin normalement)
import { clamp } from '../utils.js';

const PROTOCOLS = {
  APRE10: { targetReps: 10, label: 'APRE 10 (capacité de travail)' },
  APRE6: { targetReps: 6, label: 'APRE 6 (force + hypertrophie)' },
  APRE3: { targetReps: 3, label: 'APRE 3 (force max)' }
};

export function listProtocols() {
  return Object.entries(PROTOCOLS).map(([id, p]) => ({ id, ...p }));
}

export function protocolLabel(id) { return PROTOCOLS[id]?.label || id; }
export function protocolTarget(id) { return PROTOCOLS[id]?.targetReps ?? null; }

export function warmupPlan(baselineWeightKg, protocolId) {
  const baseline = clamp(Number(baselineWeightKg || 0), 0, 999);
  const target = protocolTarget(protocolId) || 6;

  return [
    { set: 1, pct: 0.5, weight: baseline * 0.5, repsHint: target + 2, note: 'Échauffement (facile, technique propre)' },
    { set: 2, pct: 0.75, weight: baseline * 0.75, repsHint: Math.max(3, target - 2), note: 'Échauffement (montée en tension)' },
    { set: 3, pct: 1.0, weight: baseline * 1.0, repsHint: target, note: 'Série test (max reps, arrêt si la technique s’effondre)' }
  ];
}

/**
 * Ajuste l’APRE sur la base des reps du Set 3
 * Retourne des deltas (kg) (set4Delta, nextBaselineDelta) et un message.
 */
export function ajusteAPRE({ protocolId, repsSet3 }) {
  const reps = clamp(Number(repsSet3 || 0), 0, 99);

  if (protocolId === 'APRE6') {
    if (reps <= 3) return { set4Delta: -5, nextDelta: -2.5, message: 'Charge trop lourde - on baisse pour finir proprement.' };
    if (reps <= 5) return { set4Delta: -2.5, nextDelta: 0, message: 'Un peu court - on sécurise et on consolide.' };
    if (reps <= 7) return { set4Delta: 0, nextDelta: +2.5, message: 'Cible atteinte - progression prévue à la prochaine séance.' };
    if (reps <= 12) return { set4Delta: +2.5, nextDelta: +2.5, message: 'Ça passe trop bien - on augmente dès maintenant.' };
    return { set4Delta: +5, nextDelta: +7.5, message: 'Beaucoup trop léger - augmentation significative.' };
  }

  if (protocolId === 'APRE10') {
    if (reps <= 6) return { set4Delta: -5, nextDelta: -5, message: 'Trop lourd ou fatigue élevée - on décharge.' };
    if (reps <= 9) return { set4Delta: 0, nextDelta: 0, message: 'Zone d’adaptation - on maintient.' };
    if (reps <= 12) return { set4Delta: 0, nextDelta: +2.5, message: 'Solide - on augmente légèrement la prochaine fois.' };
    return { set4Delta: +2.5, nextDelta: +2.5, message: 'Sous-maximal - on remet du stimulus.' };
  }

  // APRE3 (heuristique sûre, pas une religion)
  if (protocolId === 'APRE3') {
    if (reps <= 1) return { set4Delta: -5, nextDelta: -2.5, message: 'Trop lourd - on protège la technique et le système nerveux.' };
    if (reps === 2) return { set4Delta: -2.5, nextDelta: 0, message: 'Presque - on consolide avant de monter.' };
    if (reps <= 4) return { set4Delta: 0, nextDelta: +2.5, message: 'Cible atteinte - progression prudente.' };
    if (reps <= 6) return { set4Delta: +2.5, nextDelta: +5, message: 'Bonne marge - on augmente.' };
    return { set4Delta: +5, nextDelta: +7.5, message: 'Très léger - montée significative.' };
  }

  return { set4Delta: 0, nextDelta: 0, message: 'Protocole inconnu - rien n’est ajusté.' };
}
