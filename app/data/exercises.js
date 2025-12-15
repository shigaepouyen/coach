// Coach - bibliothèque d'exercices (mini, mais extensible)
export const EXERCISES = [
  // Squat progression (exemple)
  {
    id: 'squat_assisted',
    name: 'Squat assisté (chaise / appui)',
    category: 'Force - bas du corps',
    cues: [
      'Pieds ancrés, genoux dans l’axe des orteils',
      'Descente contrôlée, buste gainé'
    ],
    regressionId: null,
    progressionId: 'squat_bw'
  },
  {
    id: 'squat_bw',
    name: 'Squat poids du corps',
    category: 'Force - bas du corps',
    cues: [
      'Amplitude confortable',
      'Respiration: inspire en bas, souffle en remontant'
    ],
    regressionId: 'squat_assisted',
    progressionId: 'goblet_squat'
  },
  {
    id: 'goblet_squat',
    name: 'Goblet Squat (kettlebell / haltère)',
    category: 'Force - bas du corps',
    cues: [
      'Charge proche du sternum',
      'Coudes vers le bas, torse haut'
    ],
    regressionId: 'squat_bw',
    progressionId: 'back_squat'
  },
  {
    id: 'back_squat',
    name: 'Back Squat (barre)',
    category: 'Force - bas du corps',
    cues: [
      'Barre stable, gainage fort',
      'Pieds vissés, contrôle du tempo'
    ],
    regressionId: 'goblet_squat',
    progressionId: 'pistol_squat'
  },
  {
    id: 'pistol_squat',
    name: 'Pistol Squat (unilatéral)',
    category: 'Force - bas du corps',
    cues: [
      'Équilibre, genou suit la trajectoire de l’orteil',
      'Progression lente, pas de ego reps'
    ],
    regressionId: 'back_squat',
    progressionId: null
  },

  // Plank progression
  {
    id: 'plank_knees',
    name: 'Planche sur genoux',
    category: 'Gainage',
    cues: ['Bassin neutre', 'Respiration contrôlée'],
    regressionId: null,
    progressionId: 'plank_elbows'
  },
  {
    id: 'plank_elbows',
    name: 'Planche (coudes)',
    category: 'Gainage',
    cues: ['Ligne tête-bassin-talons', 'Fessiers engagés'],
    regressionId: 'plank_knees',
    progressionId: 'plank_high'
  },
  {
    id: 'plank_high',
    name: 'High plank (position pompe)',
    category: 'Gainage',
    cues: ['Mains sous épaules', 'Cage thoracique “rentrée”'],
    regressionId: 'plank_elbows',
    progressionId: 'plank_leg_lift'
  },
  {
    id: 'plank_leg_lift',
    name: 'Planche avec élévation de jambe',
    category: 'Gainage',
    cues: ['Pas de rotation du bassin', 'Contrôle lent'],
    regressionId: 'plank_high',
    progressionId: null
  },

  // Calf/Achilles progression
  {
    id: 'calf_iso_double',
    name: 'Mollets isométrique (2 pieds, 45s)',
    category: 'Mollets - tendon',
    cues: ['Monter haut', 'Tenir sans rebond'],
    regressionId: null,
    progressionId: 'calf_ecc_single'
  },
  {
    id: 'calf_ecc_single',
    name: 'Mollets excentrique (descente 1 pied)',
    category: 'Mollets - tendon',
    cues: ['Monter à 2 pieds', 'Descendre en 3-5s sur 1 pied'],
    regressionId: 'calf_iso_double',
    progressionId: 'calf_single_loaded'
  },
  {
    id: 'calf_single_loaded',
    name: 'Mollets 1 pied chargé',
    category: 'Mollets - tendon',
    cues: ['Amplitude complète', 'Charge progressive'],
    regressionId: 'calf_ecc_single',
    progressionId: 'pogo_hops'
  },
  {
    id: 'pogo_hops',
    name: 'Pogo hops (pliométrie basse)',
    category: 'Mollets - tendon',
    cues: ['Rebonds rapides', 'Jambes “ressort”, atterrissage léger'],
    regressionId: 'calf_single_loaded',
    progressionId: null
  },

  // Foot core
  {
    id: 'short_foot',
    name: 'Short Foot (doming)',
    category: 'Pied - foot core',
    cues: ['Rapprocher l’avant du pied du talon sans crisper les orteils', 'Tenir 10-20s'],
    regressionId: null,
    progressionId: 'toe_yoga'
  },
  {
    id: 'toe_yoga',
    name: 'Yoga des orteils (dissociation)',
    category: 'Pied - foot core',
    cues: ['Gros orteil monte pendant que les autres restent au sol, puis inverse', 'Lent, contrôlé'],
    regressionId: 'short_foot',
    progressionId: 'single_leg_balance'
  },
  {
    id: 'single_leg_balance',
    name: 'Équilibre 1 pied (progressif)',
    category: 'Pied - contrôle',
    cues: ['Bassin stable', 'Regard loin, respiration'],
    regressionId: 'toe_yoga',
    progressionId: null
  }
];

const MAP = new Map(EXERCISES.map(e => [e.id, e]));

export function getExercise(id) { return MAP.get(id) || null; }

export function listExercises() { return EXERCISES.slice(); }

export function walkProgression(startId, dir = 'progression', max = 10) {
  const out = [];
  let cur = getExercise(startId);
  let steps = 0;
  while (cur && steps < max) {
    out.push(cur);
    cur = dir === 'regression' ? getExercise(cur.regressionId) : getExercise(cur.progressionId);
    steps += 1;
  }
  return out;
}
