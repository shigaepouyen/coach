// Coach - Traffic Light (douleur -> décisions)
import { clamp, trafficLightFromPain } from '../utils.js';

export function computeTrafficLight({ painAfter = 0, painMorning = null, baselineMorning = null } = {}) {
  const after = clamp(Number(painAfter || 0), 0, 10);
  const morning = painMorning == null ? null : clamp(Number(painMorning), 0, 10);
  const baseline = baselineMorning == null ? null : clamp(Number(baselineMorning), 0, 10);

  const worst = Math.max(after, morning ?? 0);

  // Règle du lendemain: si la douleur du matin augmente par rapport au basal, on durcit
  let state = trafficLightFromPain(worst);
  if (morning != null && baseline != null && morning > baseline) {
    // si ça monte, on n’essaie pas de négocier avec les tissus
    if (state === 'VERT') state = 'ORANGE';
    if (state === 'ORANGE') state = 'ROUGE';
  }

  const action = actionFromState(state);

  return { state, worst, action };
}

export function actionFromState(state) {
  if (state === 'VERT') return {
    title: 'Progression autorisée',
    detail: 'Vous pouvez progresser (charge ou volume) si la technique reste propre.'
  };
  if (state === 'ORANGE') return {
    title: 'Progression gelée',
    detail: 'Maintenez la même charge et le même volume à la prochaine séance. Surveillez 24h.'
  };
  if (state === 'ROUGE') return {
    title: 'Régression obligatoire',
    detail: 'Réduisez de 20 à 50% (ou repos 48h) et évitez les aggravants jusqu’au retour en vert.'
  };
  return { title: '—', detail: '—' };
}
