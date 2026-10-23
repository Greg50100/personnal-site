# GREG.MECH — site personnel

Vitrine de mes projets et boîte à outils qui fonctionne entièrement dans le navigateur :
utilitaires du quotidien, calculs mathématiques, électronique et astronomie (dans l'esprit de
[Heavens-Above](https://www.heavens-above.com) et des pages de [Don Cross](https://cosinekitty.com)).

**Site en ligne :** https://greg50100.github.io/personnal-site/

## Outils disponibles

| Rubrique | Outils |
| --- | --- |
| Astronomie | Ce soir dans le ciel (éphémérides, crépuscules, planètes visibles, courbes de hauteur) · Carte du ciel en temps réel · Calendrier astronomique · Calculateur du système solaire · Passages de l'ISS et des satellites |
| Utilitaires | Convertisseur d'unités (19 grandeurs) · Calculatrice scientifique |
| Mathématiques | Équation du second degré · PGCD / PPCM / facteurs premiers · Nombres complexes · Bases numériques |
| Électronique | Code couleur des résistances · Loi d'Ohm et puissance · Pont diviseur de tension · Résistance pour LED · Temporisateur 555 |

Les outils d'astronomie partagent le **lieu d'observation** (sélecteur dans l'en-tête : villes,
géolocalisation ou coordonnées), mémorisé dans le navigateur.

## Démarrer

```bash
npm install
npm run dev       # serveur de développement sur http://localhost:5173
npm test          # tests unitaires (Vitest)
npm run lint      # ESLint
npm run build     # version de production dans dist/
npm run check     # lint + tests + build, comme la CI
```

## Structure

```
src/
├── App.jsx                  # routes (générées à partir du registre)
├── config/site.js           # nom du site, liens GitHub…
├── data/projects.js         # liste des dépôts affichés sur la page « Projets »
├── context/                 # thème clair/sombre et lieu d'observation partagés
├── components/              # en-tête, pied de page, cartes, sélecteur de lieu…
├── pages/                   # accueil, catalogue, rubrique, page d'outil, projets
├── lib/format.js            # formatage français (nombres, angles, heures)
└── tools/
    ├── registry.js          # ⭐ REGISTRE DES OUTILS
    ├── astronomy/           # lib/astro.js (fonctions communes), data/ (catalogues d'étoiles), un dossier par outil
    ├── utilities/
    ├── maths/
    └── electronics/
```

## Ajouter un outil

1. Créer le composant, par exemple `src/tools/maths/pourcentage/Percentage.jsx` :

   ```jsx
   export default function Percentage() {
     return <div className="card card-pad">…</div>
   }
   ```

2. Le déclarer dans `src/tools/registry.js` :

   ```js
   {
     id: 'pourcentage',
     category: 'maths',
     title: 'Pourcentages',
     summary: 'Hausse, baisse, taux et proportions.',
     icon: Percent,                 // icône lucide-react
     status: 'dev',                 // 'stable' | 'beta' | 'dev'
     repo: 'Ganymede',              // dépôt d'origine (facultatif)
     component: lazy(() => import('./maths/pourcentage/Percentage.jsx')),
   },
   ```

C'est tout : la page `#/maths/pourcentage`, le menu mobile, le catalogue, la recherche et l'accueil
se mettent à jour automatiquement. Chaque outil est chargé à la demande, il n'alourdit pas le reste du site.

Autres points d'extension :

- **Nouvelle rubrique** : ajouter une entrée à `CATEGORIES` dans `registry.js`.
- **Nouvelle grandeur ou unité** dans le convertisseur : `src/tools/utilities/converter/units.js`
  (un facteur vers l'unité de base, ou `toBase`/`fromBase` pour les conversions non linéaires).
- **Nouveau projet** sur la page Projets : `src/data/projects.js`.
- **Classes CSS communes** (`card`, `btn`, `input`, `label`, `chip`, `table-data`…) : `src/index.css`.

## Déploiement

Le workflow `.github/workflows/deploy.yml` vérifie chaque pull request (lint, tests, build) et publie
le site sur GitHub Pages à chaque push sur `main`. Le routage utilise des URL avec `#` (HashRouter),
compatibles avec l'hébergement statique de GitHub Pages sans configuration.
Pour un domaine personnel, remplacer `base` dans `vite.config.js` par `'/'`.

## Crédits et licences des données

- Calculs astronomiques : [Astronomy Engine](https://github.com/cosinekitty/astronomy) — Don Cross, licence MIT
  (le successeur du moteur utilisé par ses pages *Astronomy Calendar*, *Sky View* et *Solar System Calculator*).
- Étoiles (jusqu'à la magnitude 6), tracés et noms des constellations, objets Messier :
  [d3-celestial](https://github.com/ofrohn/d3-celestial) — Olaf Frohn, licence BSD-3.
  Les fichiers compacts de `src/tools/astronomy/data/` en sont extraits.
- Satellites : [satellite.js](https://github.com/shashwatak/satellite-js) (MIT), éléments orbitaux
  [CelesTrak](https://celestrak.org).
- Icônes : [Lucide](https://lucide.dev).
