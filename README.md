# Coach - Web app (SPA + PWA)

Une petite web app autonome (offline-first) pour :
- APRE (3 / 6 / 10) - 4 séries et ajustement automatique
- Traffic Light douleur (après effort + lendemain matin)
- Transition minimaliste basée sur le temps d’exposition + métronome 180 bpm
- Bibliothèque d’exercices avec progressions / régressions (mini-graphe)

## Démarrer en local

### Option 1 (Python)
Depuis le dossier `coach-app` :
```bash
python -m http.server 8000
```
Puis ouvrir :
- http://localhost:8000

### Option 2 (Node)
```bash
npx serve .
```

## PWA (hors-ligne)

- Le service worker met en cache les assets (HTML/CSS/JS/icons) pour que l’app se charge hors-ligne.
- Les données sont stockées en local via IndexedDB.

## Structure

- `index.html` - shell SPA
- `service-worker.js` - cache offline
- `app/db.js` - IndexedDB
- `app/logic/*` - moteurs (APRE, douleur, minimaliste)
- `app/views/*` - écrans
- `app/data/exercises.js` - bibliothèque (progressions)
