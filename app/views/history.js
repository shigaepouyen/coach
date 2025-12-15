// Vue - historique (séances + logs)
import { h, formatDateTime, humanKg } from '../utils.js';
import { Card, Button, Notice, Divider } from '../ui.js';
import { getProfile, getWorkouts, getPainLogs, getMinimalistLogs } from '../db.js';
import { protocolLabel } from '../logic/apre.js';

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function HistoryView() {
  const profile = await getProfile();
  if (!profile) {
    location.hash = '#/onboarding';
    return h('div', {});
  }

  const [workouts, pains, minis] = await Promise.all([
    getWorkouts({ limit: 50 }),
    getPainLogs({ limit: 50 }),
    getMinimalistLogs({ limit: 50 })
  ]);

  const exportBtn = Button('Exporter JSON', { variant: 'btn--ghost', onClick: () => {
    downloadJSON('coach-export.json', { profile, workouts, pains, minis, exportedAt: new Date().toISOString() });
  }});

  const workoutRows = workouts.map(w => h('tr', {},
    h('td', {}, formatDateTime(w.ts)),
    h('td', {}, w.kind === 'apre' ? protocolLabel(w.protocolId) : w.kind),
    h('td', {}, w.exerciseName || w.exerciseId || '—'),
    h('td', {}, w.baselineStartKg != null ? humanKg(w.baselineStartKg) : '—'),
    h('td', {}, w.repsSet3 ?? '—'),
    h('td', {}, w.baselineNextKg != null ? humanKg(w.baselineNextKg) : '—')
  ));

  const painRows = pains.map(p => h('tr', {},
    h('td', {}, formatDateTime(p.ts)),
    h('td', {}, p.bodyPart || '—'),
    h('td', {}, p.painAfter ?? '—'),
    h('td', {}, p.painMorning ?? '—'),
    h('td', {}, p.state || '—')
  ));

  return h('div', { class: 'grid' },
    Card('Historique',
      Notice('<strong>Tout est local</strong> - donc oui, ça survit au réseau. Essayez de survivre aux chaussettes humides aussi.'),
      Divider(),
      h('div', { class: 'row row--between' },
        h('div', { class: 'row' }, exportBtn),
        Button('Retour', { variant: 'btn--ghost', onClick: () => location.hash = '#/home' })
      )
    ),

    Card('Séances (50 dernières)',
      workouts.length ? h('table', { class: 'table' },
        h('thead', {},
          h('tr', {},
            h('th', {}, 'Date'),
            h('th', {}, 'Type'),
            h('th', {}, 'Exercice'),
            h('th', {}, 'Départ'),
            h('th', {}, 'Reps S3'),
            h('th', {}, 'Suivante')
          )
        ),
        h('tbody', {}, ...workoutRows)
      ) : Notice('Aucune séance enregistrée.')
    ),

    Card('Douleur (50 derniers)',
      pains.length ? h('table', { class: 'table' },
        h('thead', {},
          h('tr', {},
            h('th', {}, 'Date'),
            h('th', {}, 'Zone'),
            h('th', {}, 'Après'),
            h('th', {}, 'Matin'),
            h('th', {}, 'État')
          )
        ),
        h('tbody', {}, ...painRows)
      ) : Notice('Aucun check douleur enregistré.')
    )
  );
}
