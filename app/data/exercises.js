// Coach - Bibliothèque d'exercices
// Structure :
// - Chaque exercice a un ID unique (slug).
// - `progression` et `regression` pointent vers d'autres IDs pour créer des chaînes.
// - `equipment`: 'bw' (bodyweight), 'kb' (kettlebell), 'band', 'box', etc.

export const EXERCISES = {
  // --- Matrice de Fentes (Échauffement) ---
  'lunge-forward': {
    name: 'Fente Avant (avec extension)',
    category: 'lunge-matrix',
    target: 'Plan sagittal, mobilité fléchisseurs de hanche',
    equipment: 'bw',
    videoUrl: 'https://www.youtube.com/watch?v=iMZaf49lD1s',
    instructions: [
      'Faites un grand pas en avant, gardez le torse droit.',
      'Descendez jusqu\'à ce que les deux genoux soient à 90 degrés.',
      'En remontant, serrez le fessier de la jambe arrière pour sentir l\'étirement.',
    ],
  },
  'lunge-lateral': {
    name: 'Fente Latérale',
    category: 'lunge-matrix',
    target: 'Plan frontal, mobilité adducteurs, stabilité fessiers',
    equipment: 'bw',
    videoUrl: 'https://www.youtube.com/watch?v=iMZaf49lD1s',
    instructions: [
      'Gardez les deux pieds pointés droit devant.',
      'Faites un grand pas sur le côté, en gardant une jambe tendue.',
      'Poussez les hanches vers l\'arrière et ne laissez pas le genou fléchi s\'effondrer vers l\'intérieur.',
    ],
  },
  'lunge-rotational': {
    name: 'Fente Rotative',
    category: 'lunge-matrix',
    target: 'Plan transversal, mobilité et ouverture de hanche',
    equipment: 'bw',
    videoUrl: 'https://www.youtube.com/watch?v=iMZaf49lD1s',
    instructions: [
      'Depuis la position debout, pivotez sur un pied et ouvrez l\'autre jambe à 90 degrés vers l\'arrière.',
      'Descendez en fente, en gardant le genou avant aligné avec le pied.',
      'Revenez à la position de départ en poussant sur la jambe avant.',
    ],
  },

  // --- Foot Core (Gainage du pied) ---
  'foot-core-doming': {
    name: 'Short Foot / Doming',
    category: 'foot-core',
    target: 'Activation neurale des muscles intrinsèques du pied',
    equipment: 'bw',
    progression: 'foot-core-towel-curls',
    videoUrl: 'https://www.youtube.com/watch?v=kig-2M0j-4U',
    instructions: [
      'Assis, pied à plat au sol.',
      'Essayez de raccourcir votre pied en contractant les muscles pour soulever l\'arche.',
      'Les orteils doivent rester détendus et à plat sur le sol.',
      'Maintenez la contraction 5-8 secondes, puis relâchez.',
    ],
  },
  'foot-core-towel-curls': {
    name: 'Towel Curls (Enroulement serviette)',
    category: 'foot-core',
    target: 'Renforcement des fléchisseurs d\'orteils et de l\'arche',
    equipment: 'bw, towel',
    regression: 'foot-core-doming',
    videoUrl: 'https://www.youtube.com/watch?v=1j_k_8i0_sM',
    instructions: [
      'Assis, pied à plat sur une serviette posée au sol.',
      'Utilisez vos orteils pour ramener la serviette vers vous.',
      'Gardez le talon au sol pendant tout le mouvement.',
      'Une fois la serviette entièrement ramenée, étalez-la et recommencez.',
    ],
  },

  // --- Activation Chaîne Postérieure ---
  'glute-bridge': {
    name: 'Pont Fessier (Glute Bridge)',
    category: 'glute-activation',
    target: 'Activation du grand fessier, stabilité du bassin',
    equipment: 'bw',
    videoUrl: 'https://www.youtube.com/watch?v=N48d7n_S6tY',
    instructions: [
      'Allongé sur le dos, genoux fléchis, pieds à plat près des fesses.',
      'Contractez les fessiers pour soulever le bassin jusqu\'à former une ligne droite des genoux aux épaules.',
      'Maintenez la contraction en haut pendant 2 secondes avant de redescendre lentement.',
    ],
  },

  // --- Force Générale ---
  'squat-assisted': {
    name: 'Squat Bipodal Assisté',
    category: 'strength',
    target: 'Apprentissage moteur du squat, force quadriceps/fessiers',
    equipment: 'bw',
    progression: 'squat-bw',
    videoUrl: 'https://www.youtube.com/watch?v=OuR_GzG_q0Y',
    instructions: [
      'Utilisez un cadre de porte ou un TRX pour vous aider à maintenir l\'équilibre.',
      'Descendez en contrôlant le mouvement, le dos droit, comme pour vous asseoir sur une chaise.',
      'Utilisez l\'assistance au minimum pour remonter.',
    ],
  },
  'squat-bw': {
    name: 'Squat Bipodal (Poids du corps)',
    category: 'strength',
    target: 'Force des quadriceps et fessiers',
    equipment: 'bw',
    regression: 'squat-assisted',
    videoUrl: 'https://www.youtube.com/watch?v=xqvCmoLULNY',
    instructions: [
      'Pieds largeur d\'épaules, pointes de pieds légèrement ouvertes.',
      'Descendez en gardant le dos droit et le torse ouvert, jusqu\'à ce que les cuisses soient parallèles au sol.',
      'Poussez sur les talons pour remonter à la position de départ.',
    ],
  },

  // --- Mollets & Tendon d'Achille ---
  'calf-raise-straight': {
    name: 'Élévation Mollets (Genou tendu)',
    category: 'calf-achilles',
    target: 'Renforcement du gastrocnémien',
    equipment: 'bw',
    progression: 'calf-raise-bent',
    videoUrl: 'https://www.youtube.com/watch?v=HmgXnST4Mdw',
    instructions: [
      'Debout, en appui sur un pied (optionnel), montez sur la pointe du pied aussi haut que possible.',
      'Contrôlez la descente sur 3 à 5 secondes.',
      'Le genou de la jambe de travail doit rester tendu.',
    ],
  },
  'calf-raise-bent': {
    name: 'Élévation Mollets (Genou fléchi)',
    category: 'calf-achilles',
    target: 'Renforcement du soléaire',
    equipment: 'bw',
    regression: 'calf-raise-straight',
    videoUrl: 'https://www.youtube.com/watch?v=HmgXnST4Mdw&t=125s',
    instructions: [
      'Assis, ou debout avec le genou de la jambe de travail fléchi (environ 90 degrés).',
      'Montez sur la pointe du pied aussi haut que possible.',
      'Contrôlez la descente lentement.',
    ],
  },
};

/**
 * Retrouve un exercice par son ID
 * @param {string} id
 * @returns {object | undefined}
 */
export function getExercise(id) {
  return EXERCISES[id];
}

/**
 * Retourne la chaîne de progression complète pour un exercice donné
 * @param {string} id
 * @returns {object[]}
 */
export function getProgressionChain(id) {
  const chain = [];
  if (!EXERCISES[id]) {
    return []; // Retourne un tableau vide si l'ID n'est pas valide
  }
  let currentId = id;

  // Remonte jusqu'au début de la chaîne (régression)
  while (EXERCISES[currentId] && EXERCISES[currentId].regression) {
    currentId = EXERCISES[currentId].regression;
  }

  // Descend la chaîne jusqu'à la fin (progression)
  while (currentId && EXERCISES[currentId]) {
    chain.push({ id: currentId, ...EXERCISES[currentId] });
    currentId = EXERCISES[currentId].progression;
  }

  return chain;
}

// --- Modèles de séance ---
export const WORKOUT_TEMPLATES = {
  'fondations': {
    name: 'Fondations (Prévention & Stabilité)',
    description: 'Une séance rapide axée sur le renforcement du pied et l\'activation de la chaîne postérieure. Idéale en début de cycle ou pour la récupération active.',
    blocks: [
      { name: 'Échauffement', exercises: [{ id: 'lunge-forward', type: 'reps', sets: 1, reps: 10 }] },
      { name: 'Foot Core', exercises: [{ id: 'foot-core-doming', type: 'hold', sets: 3, holdSeconds: 8 }] },
      { name: 'Activation Fessiers', exercises: [{ id: 'glute-bridge', type: 'reps', sets: 3, reps: 15 }] },
    ],
  },
  'force-runner': {
    name: 'Force pour Coureurs (HSR)',
    description: 'Séance basée sur les principes de "Heavy Slow Resistance" pour améliorer l\'économie de course et la résilience des tissus.',
    blocks: [
      { name: 'Échauffement', exercises: [{ id: 'lunge-forward', type: 'reps', sets: 1, reps: 10 }] },
      { name: 'Force', exercises: [{ id: 'squat-bw', type: 'apre', apreProtocol: 'APRE6' }] },
      { name: 'Mollets', exercises: [{ id: 'calf-raise-straight', type: 'reps', sets: 3, reps: 15 }] },
    ],
  },
};

export function getTemplate(id) {
  return WORKOUT_TEMPLATES[id];
}

export function listTemplates() {
  return Object.entries(WORKOUT_TEMPLATES).map(([id, t]) => ({ id, ...t }));
}
