// Coach - transition minimaliste (minutes > ego)
import { clamp } from '../utils.js';

export function inferStageFromLogs(logs = []) {
  // Stage 1: avant 10 minutes propres
  // Stage 2: consolidation (>= 10 min, douleur verte)
  for (const l of logs) {
    if ((l.minutesMinimalist || 0) >= 10 && l.painState === 'VERT') return 'CONSOLIDATION';
  }
  return 'MICRODOSE';
}

export function computeNextTarget({ lastTarget = 1, lastPainState = 'VERT', stage = 'MICRODOSE', totalRunMinutes = null } = {}) {
  const lt = clamp(Number(lastTarget || 1), 1, 240);
  const cap = totalRunMinutes == null ? Infinity : Math.max(1, clamp(Number(totalRunMinutes) * 0.10, 1, 240));

  if (lastPainState === 'ROUGE') {
    const next = Math.max(1, Math.floor(lt * 0.5));
    return {
      nextTarget: Math.min(next, cap),
      message: 'Douleur rouge - on réduit franchement (ou repos 48h). Les tissus n’ont pas signé pour souffrir.'
    };
  }

  if (lastPainState === 'ORANGE') {
    return {
      nextTarget: Math.min(lt, cap),
      message: 'Douleur orange - on répète la même dose. Rien ne presse, la constance gagne.'
    };
  }

  // VERT
  if (stage === 'CONSOLIDATION') {
    const bumped = Math.max(lt + 1, Math.ceil(lt * 1.10));
    return {
      nextTarget: Math.min(bumped, cap),
      message: 'Vert - progression hebdo prudente (≈ +10%).'
    };
  }

  const micro = lt + 1;
  return {
    nextTarget: Math.min(micro, 10, cap),
    message: 'Vert - micro-dose (+1 minute) jusqu’à 10 minutes propres.'
  };
}
