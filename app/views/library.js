// Vue - bibliothèque d'exercices
import { h } from '../utils.js';
import { Card, Button, Notice, Divider } from '../ui.js';
import { getProfile } from '../db.js';
import { listExercises, getExercise, walkProgression } from '../data/exercises.js';

export async function LibraryView(ctx = {}) {
  const profile = await getProfile();
  if (!profile) {
    location.hash = '#/onboarding';
    return h('div', {});
  }

  const { query = {} } = ctx;
  const selectedId = query.id || null;

  const all = listExercises();
  const categories = Array.from(new Set(all.map(e => e.category))).sort();

  const filterSel = h('select', {},
    h('option', { value: 'all' }, 'Toutes catégories'),
    ...categories.map(c => h('option', { value: c }, c))
  );

  const listWrap = h('div', { class: 'grid' });
  const detailWrap = h('div', { class: 'grid' });

  function renderList() {
    const cat = filterSel.value;
    const items = all.filter(e => cat === 'all' ? true : e.category === cat);

    listWrap.innerHTML = '';
    listWrap.append(
      ...items.map(e => Card(e.name,
        h('div', { class: 'small' }, e.category),
        Divider(),
        h('div', { class: 'row row--between' },
          Button('Voir', { variant: 'btn--ghost', onClick: () => location.hash = `#/library?id=${encodeURIComponent(e.id)}` }),
          Button('Démarrer une séance', { onClick: () => {
            // raccourci: ouvrir APRE et laisser l'exercice sélectionné
            location.hash = '#/apre';
            // l’app n’a pas de store global; la personne choisira l’exo dans l’écran APRE
          }})
        )
      ))
    );
  }

  function renderDetail() {
    detailWrap.innerHTML = '';
    if (!selectedId) return;

    const ex = getExercise(selectedId);
    if (!ex) {
      detailWrap.append(Card('Exercice introuvable', Notice('ID inconnu.')));
      return;
    }

    const chainUp = walkProgression(ex.id, 'regression', 5).reverse();
    const chainDown = walkProgression(ex.id, 'progression', 5).slice(1);
    const chain = chainUp.concat(chainDown);

    const chainEl = h('div', { class: 'row' },
      ...chain.map(node => h('span', { class: 'badge', style: node.id === ex.id ? 'border-color: rgba(110,231,255,.35); color: var(--text)' : '' }, node.name))
    );

    detailWrap.append(
      Card(ex.name,
        h('div', { class: 'small' }, ex.category),
        Divider(),
        Notice('<strong>Objectif</strong> - progresser ou régresser sans casser la séance (ni le corps).'),
        Divider(),
        h('h3', {}, 'Consignes'),
        h('ul', {},
          ...(ex.cues || []).map(c => h('li', {}, c))
        ),
        Divider(),
        h('h3', {}, 'Progression - régression'),
        chainEl,
        Divider(),
        h('div', { class: 'row row--between' },
          Button('Retour liste', { variant: 'btn--ghost', onClick: () => location.hash = '#/library' }),
          Button('Aller à la séance', { onClick: () => location.hash = '#/apre' })
        )
      )
    );
  }

  filterSel.addEventListener('change', renderList);

  renderList();
  renderDetail();

  return h('div', { class: 'grid' },
    Card('Bibliothèque d’exercices',
      Notice('<strong>Pas une liste plate</strong> - un graphe de progressions, parce que les corps ne progressent pas en ligne droite.'),
      Divider(),
      h('div', { class: 'grid grid--2' },
        h('div', {},
          h('label', {}, 'Filtre catégorie'),
          filterSel
        ),
        h('div', { class: 'row row--between', style: 'align-items:end' },
          Button('Profil', { variant: 'btn--ghost', onClick: () => location.hash = '#/onboarding' }),
          Button('Accueil', { variant: 'btn--ghost', onClick: () => location.hash = '#/home' })
        )
      )
    ),
    selectedId ? detailWrap : null,
    listWrap
  );
}
