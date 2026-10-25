# Ganymede — calculateurs, conversions et astronomie

Plus de soixante outils gratuits qui fonctionnent entièrement dans le navigateur : calculateurs
d'électronique, de maths, de physique et de santé, convertisseur d'unités et de devises, temps
astronomique, et tout le nécessaire pour observer le ciel (dans l'esprit de
[Heavens-Above](https://www.heavens-above.com) et des pages de [Don Cross](https://cosinekitty.com)).

**Site en ligne :** https://greg50100.github.io/personnal-site/

## Outils disponibles

| Rubrique | Outils |
| --- | --- |
| Astronomie | Ce soir dans le ciel · Carte du ciel · Calendrier astronomique · Calculateur du système solaire · Le Soleil · La Lune · Résumé des planètes · Éclipses et passages · Passages de l'ISS et satellites · Satellites brillants · Où est l'ISS ? · Jour et nuit sur la Terre |
| Dates et temps | Heure et temps astronomique (UTC, TAI, TT, GPS, jour julien, temps sidéral, équation du temps) · Fuseaux horaires · Calcul de dates · Pâques et jours fériés |
| Conversions et calcul | Convertisseur (75 grandeurs, plus de 600 unités, devises BCE) · Calculatrice scientifique |
| Électronique | Loi d'Ohm · Codes des résistances (couleurs, CMS) et des condensateurs · Séries E · Série/parallèle · Pont diviseur · LED · Tolérances · Puissance · Valeur efficace · Réactance · Impédance RLC · Résonance LC · Filtres passifs · Constante de temps · 555 · AOP · Polarisation BJT · Zener · Transformateur · Wheatstone · Triangle-étoile · Câbles (chute de tension, section) · Bobine à air · Batterie · Coût de l'énergie |
| Matériel | Cartes de développement (Arduino, ESP8266, ESP32, Raspberry Pi Pico et Raspberry Pi) · Capteurs et modules · Vérifier un montage · Bus et niveaux logiques · Résistances de tirage I2C · Autonomie en veille profonde |
| Mathématiques | Traceur de courbes · Second degré · Matrices · Pourcentages · PGCD/PPCM · Complexes · Bases numériques |
| Physique | Chute libre · Projectile · Loi de Newton · Gaz parfaits · Bernoulli · Ondes |
| Météo | Air humide et diagramme psychrométrique · Confort thermique (formules de l'intégration Home Assistant Thermal Comfort) · Ressenti, pression et altitude |
| Santé | IMC · Métabolisme · Masse grasse |
| Chimie | Masse molaire |

Les outils d'astronomie partagent le **lieu d'observation** (sélecteur dans l'en-tête : villes,
géolocalisation ou coordonnées), mémorisé dans le navigateur. Une page « À propos » présente les
projets dont proviennent les outils (application Android Ganymede, dépôts d'astronomie et de conversion).

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
├── config/site.js           # nom du site, description, liens GitHub
├── data/projects.js         # projets présentés sur la page « À propos »
├── context/                 # thème clair/sombre et lieu d'observation partagés
├── components/              # en-tête, recherche (Ctrl K), pied de page, cartes, sélecteur de lieu…
├── pages/                   # accueil, catalogue, rubrique, page d'outil, à propos
├── lib/                     # formatage français (nombres, angles, heures), notation SI
└── tools/
    ├── registry.js          # ⭐ REGISTRE DES OUTILS
    ├── kit/                 # calculateur générique piloté par une « spec », graphiques
    ├── astronomy/           # lib/ (astro, time, geo), components/ (cartes, graphiques), un dossier par outil
    ├── utilities/converter/ # units/ (grandeurs par famille), currency.js (taux BCE)
    ├── materiel/            # data/ (cartes, modules), check.js (vérification d'un montage)
    ├── temps/ maths/ physique/ meteo/ sante/ chimie/ electronics/
```

## Ajouter un outil

**Calculateur simple (formulaire → résultats)** : écrire une spec, sans React.

```js
// src/tools/physique/energie-cinetique.js
export default {
  inputs: [
    { id: 'm', label: 'Masse', unit: 'kg', value: '1000' },
    { id: 'v', label: 'Vitesse', unit: 'm/s', value: '20' },
  ],
  compute: ({ m, v }) => ({ results: [{ label: 'Énergie cinétique', value: 0.5 * m * v * v, unit: 'J', main: true }] }),
  formulas: ['E = ½ m v²'],
}
```

```js
// src/tools/registry.js
{ id: 'energie-cinetique', category: 'physique', title: 'Énergie cinétique', summary: '…', icon: I.Gauge,
  component: calc(() => import('./physique/energie-cinetique.js')) },
```

Une spec peut aussi renvoyer un tableau (`table`), un graphique (`chart`, ou `chart.component` pour un
graphique sur mesure comme le diagramme de l'air humide) et des notes ; les champs acceptent les préfixes SI
(« 4k7 », « 100n »), des listes de choix et des valeurs prédéfinies. Une liste `references` affiche les
sources, et chaque formule ou note peut y renvoyer (`ref`) par un numéro. Voir `src/tools/kit/Calculator.jsx`.

**Outil avec une interface sur mesure** : un composant React (export default), déclaré avec
`component: lazy(() => import('./rubrique/MonOutil.jsx'))`.

Dans les deux cas, la page `#/<rubrique>/<id>`, le menu, le catalogue, la recherche et l'accueil se
mettent à jour automatiquement. Chaque outil est chargé à la demande.

Autres points d'extension :

- **Nouvelle rubrique** : ajouter une entrée à `CATEGORIES` dans `registry.js`.
- **Nouvelle grandeur ou unité** : `src/tools/utilities/converter/units/` (un facteur vers l'unité de
  base, ou `toBase`/`fromBase` pour les conversions non linéaires ; `si()` génère les préfixes).
- **Nouveau projet** sur la page À propos : `src/data/projects.js`.
- **Classes CSS communes** (`card`, `btn`, `input`, `label`, `chip`, `table-data`…) : `src/index.css`.
- **Couleurs** : palettes `night` (bleu nuit) et `accent` (ambre) dans `tailwind.config.js`.

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
- Fond de carte du monde : [Natural Earth](https://www.naturalearthdata.com) (domaine public), via
  [world-atlas](https://github.com/topojson/world-atlas), converti en tracé SVG équirectangulaire.
- Satellites : [satellite.js](https://github.com/shashwatak/satellite-js) (MIT), éléments orbitaux
  [CelesTrak](https://celestrak.org).
- Taux de change : taux de référence de la Banque centrale européenne via [Frankfurter](https://frankfurter.dev).
- Secondes intercalaires : IERS. Icônes : [Lucide](https://lucide.dev).

## Licence

Code du site sous licence MIT : voir le fichier `LICENSE`. Les données reprises d'autres projets
gardent leur propre licence (voir la section précédente).
