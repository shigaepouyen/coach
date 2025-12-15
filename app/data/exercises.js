// Coach - bibliothèque d'exercices et templates (avec Tags & Réhab)
export const EXERCISES = [
  // --- ECHAUFFEMENT / MOBILITÉ ---
  {
    id: 'lunge_matrix',
    name: 'Lunge Matrix (Échauffement)',
    category: 'Mobilité - Hanches',
    cues: ['3 axes : Devant, Côté, Rotation', '5 reps par jambe', 'Contrôle genou'],
    tags: ['warmup', 'mobility'],
    regressionId: null, progressionId: null
  },
  {
    id: 'clamshell_iso',
    name: 'Clamshell (Moyen Fessier)',
    category: 'Mobilité - Hanches',
    cues: ['Couché côté', 'Ouvrir le genou sans bouger le bassin', 'Tenir 30-45s'],
    tags: ['rehab', 'low_impact', 'glutes'],
    regressionId: null, progressionId: null
  },

  // --- FORCE BAS DU CORPS (Squat) ---
  {
    id: 'squat_assisted',
    name: 'Squat assisté (chaise)',
    category: 'Force - bas du corps',
    cues: ['Pieds ancrés', 'Descente contrôlée'],
    tags: ['low_impact'],
    regressionId: null, progressionId: 'squat_bw'
  },
  {
    id: 'squat_bw',
    name: 'Squat poids du corps',
    category: 'Force - bas du corps',
    cues: ['Amplitude confortable', 'Souffle en remontant'],
    tags: ['low_impact'],
    regressionId: 'squat_assisted', progressionId: 'goblet_squat'
  },
  {
    id: 'goblet_squat',
    name: 'Goblet Squat (kettlebell)',
    category: 'Force - bas du corps',
    cues: ['Charge au sternum', 'Torse haut'],
    tags: ['load'],
    regressionId: 'squat_bw', progressionId: 'back_squat'
  },
  {
    id: 'back_squat',
    name: 'Back Squat (barre)',
    category: 'Force - bas du corps',
    cues: ['Barre stable', 'Gainage fort'],
    tags: ['load', 'heavy'],
    regressionId: 'goblet_squat', progressionId: 'pistol_squat'
  },
  {
    id: 'pistol_squat',
    name: 'Pistol Squat (unilatéral)',
    category: 'Force - bas du corps',
    cues: ['Équilibre', 'Genou dans l’axe'],
    tags: ['load', 'balance', 'heavy_knee'],
    regressionId: 'back_squat', progressionId: null
  },

  // --- GAINAGE ---
  {
    id: 'plank_knees',
    name: 'Planche sur genoux',
    category: 'Gainage',
    cues: ['Bassin neutre'],
    tags: ['rehab', 'core'],
    regressionId: null, progressionId: 'plank_elbows'
  },
  {
    id: 'plank_elbows',
    name: 'Planche (coudes)',
    category: 'Gainage',
    cues: ['Ligne tête-bassin-talons'],
    tags: ['core'],
    regressionId: 'plank_knees', progressionId: 'plank_high'
  },
  {
    id: 'plank_high',
    name: 'High plank (bras tendus)',
    category: 'Gainage',
    cues: ['Mains sous épaules'],
    tags: ['core'],
    regressionId: 'plank_elbows', progressionId: 'plank_leg_lift'
  },
  {
    id: 'plank_leg_lift',
    name: 'Planche avec élévation',
    category: 'Gainage',
    cues: ['Pas de rotation bassin'],
    tags: ['core'],
    regressionId: 'plank_high', progressionId: null
  },

  // --- MOLLETS / TENDON ---
  {
    id: 'calf_iso_double',
    name: 'Mollets Isométrique (2 pieds)',
    category: 'Mollets - tendon',
    cues: ['Monter haut', 'Tenir 45s sans bouger'],
    tags: ['rehab', 'low_impact'],
    regressionId: null, progressionId: 'calf_ecc_single'
  },
  {
    id: 'calf_ecc_single',
    name: 'Mollets Excentrique (1 pied)',
    category: 'Mollets - tendon',
    cues: ['Monter à 2 pieds', 'Descendre en 3-5s sur 1 pied'],
    tags: ['rehab', 'low_impact'],
    regressionId: 'calf_iso_double', progressionId: 'calf_single_loaded'
  },
  {
    id: 'calf_single_loaded',
    name: 'Mollets 1 pied chargé',
    category: 'Mollets - tendon',
    cues: ['Amplitude complète', 'Charge progressive'],
    tags: ['load'],
    regressionId: 'calf_ecc_single', progressionId: 'pogo_hops'
  },
  {
    id: 'pogo_hops',
    name: 'Pogo Hops (Pliométrie)',
    category: 'Mollets - tendon',
    cues: ['Rebonds rapides', 'Jambes ressort'],
    tags: ['impact', 'plyo', 'risk'],
    regressionId: 'calf_single_loaded', progressionId: null
  },

  // --- PIED / FOOT CORE ---
  {
    id: 'short_foot',
    name: 'Short Foot (Doming)',
    category: 'Pied - foot core',
    cues: ['Rapprocher avant-pied du talon', 'Ne pas crisper orteils'],
    tags: ['rehab', 'low_impact'],
    regressionId: null, progressionId: 'toe_yoga'
  },
  {
    id: 'toe_yoga',
    name: 'Yoga des orteils',
    category: 'Pied - foot core',
    cues: ['Dissocier gros orteil'],
    tags: ['rehab', 'low_impact'],
    regressionId: 'short_foot', progressionId: 'single_leg_balance'
  },
  {
    id: 'single_leg_balance',
    name: 'Équilibre 1 pied',
    category: 'Pied - contrôle',
    cues: ['Bassin stable', 'Regard loin'],
    tags: ['balance', 'low_impact'],
    regressionId: 'toe_yoga', progressionId: null
  }
];

// --- TEMPLATES ---
export const WORKOUT_TEMPLATES = [
  {
    id: 'runner_strength_base',
    name: 'Renforcement Coureur (Base)',
    description: 'La séance fondamentale : Mobilité + Force + Mollets.',
    exercises: ['lunge_matrix', 'goblet_squat', 'calf_ecc_single', 'plank_elbows'],
    tags: ['general']
  },
  {
    id: 'power_session',
    name: 'Puissance & Pliométrie',
    description: 'Avancé uniquement. Fraîcheur requise.',
    exercises: ['lunge_matrix', 'pogo_hops', 'back_squat'],
    tags: ['performance', 'impact']
  },
  {
    id: 'foot_core_routine',
    name: 'Routine "Pied Fort"',
    description: 'Fondation du pied. Idéal transition minimaliste.',
    exercises: ['short_foot', 'toe_yoga', 'calf_iso_double', 'single_leg_balance'],
    tags: ['prehab', 'low_impact']
  },
  // --- REHAB TEMPLATES ---
  {
    id: 'rehab_achilles_phase1',
    name: '🚑 Réhab Achille (Phase 1)',
    description: 'Douleur tendineuse ? Priorité à l’isométrie et au contrôle.',
    exercises: ['calf_iso_double', 'short_foot', 'plank_knees', 'squat_assisted'],
    tags: ['rehab', 'safe']
  },
  {
    id: 'rehab_itbs_knee',
    name: '🚑 Réhab Genou / ITBS',
    description: 'Activation fessiers sans charge axiale lourde.',
    exercises: ['clamshell_iso', 'plank_elbows', 'squat_assisted', 'single_leg_balance'],
    tags: ['rehab', 'safe']
  }
];

const MAP = new Map(EXERCISES.map(e => [e.id, e]));
const TPL_MAP = new Map(WORKOUT_TEMPLATES.map(t => [t.id, t]));

export function getExercise(id) { return MAP.get(id) || null; }
export function listExercises() { return EXERCISES.slice(); }

export function getTemplate(id) { return TPL_MAP.get(id) || null; }
export function listTemplates() { return WORKOUT_TEMPLATES.slice(); }

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