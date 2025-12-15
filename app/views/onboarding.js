// Vue - onboarding
import { h, numberOrNull } from '../utils.js';
import { Card, Button, Notice, Divider } from '../ui.js';
import { getProfile, saveProfile, resetAll } from '../db.js';

export async function OnboardingView() {
  const existing = await getProfile();

  const nameInput = h('input', { placeholder: 'Ex: JC', value: existing?.name || '' });
  const trainingAge = h('select', {},
    ...['Novice', 'Intermédiaire', 'Avancé'].map(v => h('option', { value: v, selected: existing?.trainingAge === v }, v))
  );

  const bw = h('input', { placeholder: 'Ex: 72', inputmode: 'decimal', value: existing?.bodyWeightKg ?? '' });

  const weekly = h('input', { placeholder: 'Ex: 180', inputmode: 'decimal', value: existing?.runningWeeklyMinutes ?? '' });

  const step = h('select', {},
    ...[1, 2.5, 5].map(v => h('option', { value: String(v), selected: String(existing?.weightStepKg ?? 2.5) === String(v) }, `${v} kg`))
  );

  const wantsMin = h('select', {},
    h('option', { value: 'oui', selected: existing?.wantsMinimalist === true }, 'Oui'),
    h('option', { value: 'non', selected: existing?.wantsMinimalist === false }, 'Non')
  );

  const injury = h('textarea', { placeholder: 'Ex: tendon d’Achille sensible, ITBS, fasciite, etc.', value: existing?.injuryHistory || '' });

  const equip = existing?.equipment || {};
  const cb = (key, label) => h('label', { class: 'badge' },
    h('input', { type: 'checkbox', checked: !!equip[key], style: 'margin-right:8px' }),
    label
  );

  const equipWrap = h('div', { class: 'row' },
    cb('none', 'Aucun matériel'),
    cb('dumbbells', 'Haltères / kettlebell'),
    cb('barbell', 'Barre'),
    cb('bands', 'Bandes élastiques')
  );

  // hack: récupérer les checkbox facilement
  const equipKeys = ['none', 'dumbbells', 'barbell', 'bands'];
  const equipBoxes = Array.from(equipWrap.querySelectorAll('input[type="checkbox"]'));

  const saveBtn = Button('Enregistrer', { variant: '', onClick: async () => {
    const profile = {
      name: nameInput.value.trim() || 'Vous',
      trainingAge: trainingAge.value,
      bodyWeightKg: numberOrNull(bw.value),
      runningWeeklyMinutes: numberOrNull(weekly.value),
      weightStepKg: numberOrNull(step.value) || 2.5,
      wantsMinimalist: wantsMin.value === 'oui',
      injuryHistory: injury.value.trim(),
      equipment: Object.fromEntries(equipKeys.map((k, i) => [k, equipBoxes[i]?.checked || false])),
      apreBaselines: existing?.apreBaselines || {},
      minimalist: existing?.minimalist || { targetMinutes: 1, stage: 'MICRODOSE' }
    };

    // mini sanity checks
    if (profile.bodyWeightKg != null && (profile.bodyWeightKg < 25 || profile.bodyWeightKg > 250)) {
      alert('Poids de corps improbable. Si c’est volontaire, mettez une valeur réaliste pour le coaching.');
      return;
    }

    await saveProfile(profile);
    location.hash = '#/home';
  }});

  const resetBtn = Button('Tout réinitialiser', { variant: 'btn--danger', onClick: async () => {
    if (!confirm('Effacer toutes les données locales ?')) return;
    await resetAll();
    location.hash = '#/onboarding';
    location.reload();
  }});

  const el = h('div', { class: 'grid' },
    Card('Démarrage express',
      Notice('<strong>Objectif</strong> - une web app autonome, offline-first, avec un moteur de décision (APRE - Traffic Light - minimaliste).'),
      Divider(),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Prénom - alias'),
          nameInput,
          h('div', { class: 'small' }, 'Uniquement pour personnaliser les écrans.')
        ),
        h('div', {},
          h('label', {}, 'Niveau d’entraînement'),
          trainingAge
        )
      ),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Poids de corps (kg)'),
          bw,
          h('div', { class: 'small' }, 'Optionnel - utile pour quelques ratios et rappels.')
        ),
        h('div', {},
          h('label', {}, 'Volume course hebdo (minutes)'),
          weekly,
          h('div', { class: 'small' }, 'Optionnel - sert au plafond 10% de la transition minimaliste.')
        )
      ),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Arrondi des charges'),
          step,
          h('div', { class: 'small' }, 'Ex: 2,5 kg si vous avez des disques de 1,25 kg.')
        ),
        h('div', {},
          h('label', {}, 'Transition minimaliste'),
          wantsMin
        )
      ),
      h('label', {}, 'Matériel'),
      equipWrap,
      h('label', {}, 'Historique douleurs - blessures'),
      injury,
      Divider(),
      h('div', { class: 'row row--between' },
        h('div', { class: 'row' }, saveBtn, Button('Voir la bibliothèque', { variant: 'btn--ghost', onClick: () => location.hash = '#/library' })),
        resetBtn
      ),
      h('div', { class: 'small' }, 'Données stockées en local (IndexedDB). Pas besoin de réseau pour s’en servir.')
    )
  );

  return { el };
}
