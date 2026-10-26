# Ganymede — calculateurs, conversions et astronomie

Plus de quatre-vingts outils gratuits, rangés en quatre espaces (Astronomie, Électronique, Sciences,
Pratique), qui fonctionnent entièrement dans le navigateur : calculateurs
d'électronique, de maths, de physique et de santé, convertisseur d'unités et de devises, temps
astronomique, et tout le nécessaire pour observer le ciel (dans l'esprit de
[Heavens-Above](https://www.heavens-above.com) et des pages de [Don Cross](https://cosinekitty.com)).

**Site en ligne :** https://greg50100.github.io/personnal-site/

## Espaces et rubriques

Le site est découpé en quatre espaces, chacun en rubriques (`#/<espace>` liste ses rubriques,
`#/<espace>/<outil>` ouvre un outil).

| Espace | Rubriques et outils |
| --- | --- |
| **Astronomie** | *Ciel et observation* : Ce soir dans le ciel · Carte du ciel · Calendrier astronomique · Éclipses et passages · Jour et nuit sur la Terre · Heure et temps astronomique (UTC, TAI, TT, GPS, jour julien, temps sidéral, équation du temps)<br>*Soleil, Lune et planètes* : Calculateur du système solaire · Le Soleil · La Lune · Résumé des planètes<br>*Satellites* : Passages de l'ISS et satellites · Satellites brillants · Où est l'ISS ? |
| **Électronique** | *Bases et réseaux* : Loi d'Ohm · Puissance · Série/parallèle · Pont diviseur · LED · Tolérances · Séries E · Wheatstone · Triangle-étoile<br>*Composants et codes* : Brochages de composants (transistors, régulateurs, 74HC, CMOS 4000…) · Codes des résistances (couleurs, CMS) et des condensateurs · Boîtiers · Symboles<br>*Cartes et modules* : Cartes de développement (Arduino, ESP8266, ESP32, Raspberry Pi Pico et Raspberry Pi), avec le brochage et la table des broches de chaque carte · Capteurs et modules (avec leur câblage type) · Vérifier un montage · Bus et niveaux logiques · Résistances de tirage I2C · Autonomie en veille profonde<br>*Câbles et connectique* : Brochages de connecteurs (USB, HDMI, RJ45, OBD-II…) · Fils AWG · Couleurs des conducteurs · Chute de tension · Section de câble · Largeur de piste (IPC-2221) · Résistivité et permittivité<br>*Alimentation et énergie* : Transformateur · LM317 · Condensateur de filtrage · Dissipateur · Autonomie d'une batterie · Piles et accumulateurs · Fusibles · Coût de l'énergie<br>*Alternatif et signaux* : Valeur efficace · Réactance · Impédance RLC · Résonance LC · Filtres passifs · Constante de temps · Bobine à air · Décibels · Atténuateur en T et en π<br>*Montages actifs* : 555 · AOP · Polarisation BJT · Zener |
| **Sciences** | *Mathématiques* : Traceur de courbes · Second degré · Matrices · PGCD/PPCM · Complexes · Bases numériques<br>*Physique* : Chute libre · Projectile · Loi de Newton · Gaz parfaits · Bernoulli · Ondes<br>*Météo* : Air humide et diagramme psychrométrique · Confort thermique (formules de l'intégration Home Assistant Thermal Comfort) · Ressenti, pression et altitude<br>*Chimie* : Masse molaire |
| **Pratique** | *Conversions et calcul* : Convertisseur (75 grandeurs, plus de 600 unités, devises BCE) · Calculatrice scientifique · Pourcentages<br>*Dates et heures* : Fuseaux horaires · Calcul de dates · Pâques et jours fériés<br>*Santé* : IMC · Métabolisme · Masse grasse |

Les anciennes adresses (`#/materiel/esp32`, `#/maths`, `#/materiel/brochages`…) redirigent vers les nouvelles.

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
├── App.jsx                  # routes : accueil, catalogue, #/<espace>, #/<espace>/<outil>, à propos
├── registry.js              # ⭐ REGISTRE DU SITE : rassemble les espaces, adresses, recherche, anciennes adresses
├── config/site.js           # nom du site, description, liens GitHub
├── data/projects.js         # projets présentés sur la page « À propos »
├── context/                 # thème clair/sombre et lieu d'observation partagés
├── components/              # en-tête, recherche (Ctrl K), pied de page, cartes, sélecteur de lieu…
├── pages/                   # accueil, catalogue, page d'espace, page d'outil, à propos
├── lib/                     # formatage français (nombres, angles, heures), notation SI
├── kit/                     # calculateur générique piloté par une « spec », graphiques, symboles de schémas électriques
└── domains/                 # un dossier par espace, chacun avec son registry.js (espace, rubriques, outils)
    ├── astronomie/          # lib/ (astro, time, geo), components/ (cartes, graphiques), un dossier par outil
    ├── electronique/
    │   ├── calculs/         # calculateurs (calc/), formules, schémas électriques
    │   ├── materiel/        # cartes (fiche + brochage), modules, câblages, vérification d'un montage
    │   └── references/      # connecteurs, composants, fils, tables et symboles
    ├── sciences/            # maths/ physique/ meteo/ chimie/
    └── pratique/            # converter/ (units/, currency.js), calculator/, dates/, sante/
```

## Ajouter un outil

**Calculateur simple (formulaire → résultats)** : écrire une spec, sans React.

```js
// src/domains/sciences/physique/energie-cinetique.js
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
// src/domains/sciences/registry.js
{ id: 'energie-cinetique', rubrique: 'physique', title: 'Énergie cinétique', summary: '…', icon: I.Gauge,
  component: calc(() => import('./physique/energie-cinetique.js')) },
```

Une spec peut aussi renvoyer un tableau (`table`), un graphique (`chart`, ou `chart.component` pour un
graphique sur mesure comme le diagramme de l'air humide) et des notes ; les champs acceptent les préfixes SI
(« 4k7 », « 100n »), des listes de choix et des valeurs prédéfinies. Une liste `references` affiche les
sources, et chaque formule ou note peut y renvoyer (`ref`) par un numéro. Un composant `schematic` dessine le
schéma du montage avec les valeurs saisies (symboles dans `src/kit/schematic.jsx`). Voir `src/kit/Calculator.jsx`.

**Outil avec une interface sur mesure** : un composant React (export default), déclaré avec
`component: lazy(() => import('./dossier/MonOutil.jsx'))` dans le registre de l'espace.

Dans les deux cas, la page `#/<espace>/<id>`, le menu, le catalogue, la recherche et l'accueil se
mettent à jour automatiquement. Chaque outil est chargé à la demande.

Autres points d'extension :

- **Nouvelle rubrique** : ajouter une entrée à `RUBRIQUES` dans le `registry.js` de l'espace.
- **Nouvel espace** : créer `src/domains/<espace>/registry.js` (exports `DOMAIN`, `RUBRIQUES`, `TOOLS`) et
  l'ajouter à `MODULES` dans `src/registry.js`. Les tests (`src/registry.test.js`) vérifient que chaque outil
  est rangé dans une rubrique de son espace et que les liens internes pointent vers une adresse actuelle.
- **Nouvelle grandeur ou unité** : `src/domains/pratique/converter/units/` (un facteur vers l'unité de
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
  Les fichiers compacts de `src/domains/astronomie/data/` en sont extraits.
- Fond de carte du monde : [Natural Earth](https://www.naturalearthdata.com) (domaine public), via
  [world-atlas](https://github.com/topojson/world-atlas), converti en tracé SVG équirectangulaire.
- Satellites : [satellite.js](https://github.com/shashwatak/satellite-js) (MIT), éléments orbitaux
  [CelesTrak](https://celestrak.org).
- Taux de change : taux de référence de la Banque centrale européenne via [Frankfurter](https://frankfurter.dev).
- Secondes intercalaires : IERS. Icônes : [Lucide](https://lucide.dev).

## Licence

Code du site sous licence MIT : voir le fichier `LICENSE`. Les données reprises d'autres projets
gardent leur propre licence (voir la section précédente).
