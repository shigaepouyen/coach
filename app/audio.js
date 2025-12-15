// Coach - Module Audio (Web Audio API)
// Gère le métronome pour la cadence de course.

let audioCtx = null;
let oscillator = null;
let intervalId = null;

function initAudioContext() {
  if (!audioCtx) {
    // Crée le contexte audio de manière "lazy" et compatible avec tous les navigateurs.
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

/**
 * Démarre le métronome à un BPM donné.
 * @param {number} bpm - Battements par minute (ex: 180).
 */
export function startMetronome(bpm = 180) {
  if (intervalId) {
    // Le métronome tourne déjà, ne fait rien.
    return;
  }

  initAudioContext();

  const interval = 60000 / bpm; // Calcul de l'intervalle en millisecondes

  const playBeep = () => {
    if (!audioCtx) return;
    // Crée un oscillateur pour générer le son.
    oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine'; // Une onde sinusoïdale pour un bip doux.
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Fréquence (A5)

    // Connecte l'oscillateur aux haut-parleurs.
    oscillator.connect(audioCtx.destination);

    // Démarre et arrête le son pour créer un "bip" court.
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05); // Durée du bip: 50ms
  };

  // Joue un premier bip immédiatement, puis lance l'intervalle.
  playBeep();
  intervalId = setInterval(playBeep, interval);
}

/**
 * Arrête le métronome.
 */
export function stopMetronome() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (oscillator) {
    oscillator.disconnect();
    oscillator = null;
  }
  // Note: Nous ne fermons pas le contexte audio car il pourrait être réutilisé.
}
