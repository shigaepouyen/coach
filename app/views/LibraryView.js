// Coach - Vue Bibliothèque
import { h } from '../utils.js';
import { EXERCISES } from '../data/exercises.js';

function renderExercise(id, data) {
  return h('div', { class: 'exercise-card' },
    h('h3', {}, data.name),
    h('p', {}, h('strong', {}, 'Cible : '), data.target),
    h('ul', { class: 'instructions' }, ...data.instructions.map(i => h('li', {}, i))),
    data.videoUrl ? h('a', { href: data.videoUrl, target: '_blank', rel: 'noopener' }, 'Vidéo de démonstration') : ''
  );
}

export function LibraryView() {
  const root = h('div', { class: 'view' });

  const render = () => {
    const categories = Object.entries(EXERCISES).reduce((acc, [id, data]) => {
      const cat = data.category || 'uncategorized';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push([id, data]);
      return acc;
    }, {});

    const categoryTitles = {
      'lunge-matrix': 'Échauffement : Matrice de Fentes',
      'foot-core': 'Fondations : Foot Core',
      'uncategorized': 'Autres exercices'
    };

    const content = h('div', {},
      h('h1', {}, 'Bibliothèque d\'exercices'),
      ...Object.entries(categories).map(([cat, exercises]) =>
        h('div', {},
          h('h2', { class: 'category-title' }, categoryTitles[cat] || cat),
          h('div', { class: 'exercise-grid' }, ...exercises.map(([id, data]) => renderExercise(id, data)))
        )
      )
    );
    root.replaceChildren(content);
  };

  return { el: root, render };
}
