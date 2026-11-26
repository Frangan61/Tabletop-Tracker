# 🎲 TableTop Tracker

Application web **locale** pour consigner vos parties de jeux de société :
joueurs, jeux, scores bruts et classement, avec **pondération par la complexité
BGG (poids 1–5)** du jeu joué.

- 100 % local : les données restent sur votre machine (`localStorage` du navigateur)
- Zéro dépendance à installer : Python 3 (stdlib uniquement) + navigateur
- Recherche de jeux via l'API BoardGameGeek (optionnelle, avec repli en saisie manuelle)

## Lancement

```bash
cd tabletop-tracker
python3 server.py
# puis ouvrir http://127.0.0.1:8787
```

Le serveur n'écoute que sur `127.0.0.1` (votre machine uniquement).
Le port se change avec la variable d'environnement `PORT`.

**Sans serveur** : ouvrir directement `static/index.html` dans le navigateur
(fonctionne en `file://`, mais la recherche BGG est alors indisponible →
saisie manuelle des jeux).

## Sur smartphone (PWA)

L'app est une **PWA installable** (manifest + service worker) : une fois ouverte
depuis le téléphone, « Ajouter à l'écran d'accueil » crée une vraie icône plein écran,
et l'app fonctionne **hors-ligne** (seule la recherche BGG nécessite le réseau).

Deux façons d'y accéder depuis le téléphone :

1. **Même Wi-Fi** : lancer le serveur en écoutant sur le réseau local
   ```bash
   HOST=0.0.0.0 python3 server.py
   ```
   puis ouvrir `http://<IP-du-PC>:8787` sur le téléphone (IP du PC : `ipconfig` sur
   Windows, `ip addr` / `hostname -I` sur Mac/Linux). Le défaut reste `127.0.0.1`.
   ⚠️ pas d'authentification : à n'utiliser que sur un Wi-Fi de confiance.
2. **Tunnel USB (plus sûr)** : téléphone en USB + débogage USB, puis
   `adb reverse tcp:8787 tcp:8787` et ouvrir `http://127.0.0.1:8787` sur le téléphone.

⚠️ Les données (`localStorage`) sont **propres à chaque navigateur/appareil** :
exportez le JSON (⚙ Paramètres) sur un appareil et importez-le sur l'autre pour
les transférer.

## Clé API BoardGameGeek (optionnel)

L'API XML2 de BGG exige désormais une clé d'application. Pour l'activer :

1. Créez une clé gratuite sur BoardGameGeek (profil → *Developer* / applications)
2. Lancez le serveur avec :

```bash
BGG_API_KEY=votre_cle python3 server.py
```

Sans clé, la page **Jeux** vous propose automatiquement la saisie manuelle
(nom + poids BGG entre 1 et 5).

## Formule de points dynamique (configurable dans ⚙ Paramètres)

Pour chaque partie enregistrée :

```
points du joueur = (points_de_rang(rang) + perf) × poids_BGG(jeu)   (si multiplicateur activé)
```

- **Points de rang** par défaut : 1er = 10, 2e = 7, 3e = 5, 4e = 3, 5e = 2, 6e et + = 1
- **Poids BGG** : complexité du jeu entre 1 (léger) et 5 (expert), récupérée via BGG ou saisie à la main
- **perf (dynamique)** : compare le score brut du joueur à **tous les scores des parties
  précédentes du même jeu** — plus il est haut dans cet historique, plus la perf est élevée :
  - mode **percentile** (recommandé) : `perf = coef × (% de scores historiques battus)`
  - mode **zscore** : `perf = coef × clamp((score − moyenne) / écart-type, 0, 3) / 3`
  - `perf = 0` si le jeu n'a pas encore d'historique ; `coef` réglable (défaut 10)
- **Ex-aequo** : les scores égaux partagent le même rang (rangs 1, 1, 3, 4…)

Exemple : victoire (10 pts) avec un score qui bat 90 % de l'historique du jeu, poids 2.3
→ (10 + 9) × 2.3 ≈ 43,7 pts, contre (10 + 2) × 2.3 ≈ 27,6 pts pour un score médian.

Les points calculés sont **stockés avec la partie** à l'enregistrement ; changez la
formule dans les paramètres puis cliquez sur « Recalculer toutes les parties » si besoin.

## Tags & recherche de jeu

Chaque jeu peut avoir des **tags** (catégories BGG + mécanismes récupérés
automatiquement, ou saisis à la main), une **durée moyenne** et un **nombre de
joueurs min/max**. La page **🎯 Trouver un jeu** filtre la ludothèque selon :
nombre de joueurs, temps disponible, tags et texte libre — avec un bouton
« ▶ Jouer à celui-là » qui pré-remplit la nouvelle partie.

## Fonctionnalités

- **Classement général** pondéré, filtrable (30 j / 3 mois / 12 mois) + dernières parties
- **Joueurs** : création (nom + couleur), page personnelle avec historique complet,
  records (meilleur score, meilleure partie en points, séries de victoires),
  statistiques sur les 5/10 dernières parties (points moyens, rang moyen, % victoires),
  jeux favoris, graphique d'évolution des points cumulés
- **Jeux** : recherche BGG (nom, année, poids, joueurs min/max, image) ou saisie manuelle,
  fiche par jeu avec classement dédié et historique des parties
- **Nouvelle partie** : sélection du jeu, date, participants + scores bruts, aperçu en direct
  du rang et des points calculés avant enregistrement
- **Paramètres** : formule de points, export JSON / CSV des parties, import JSON, reset

## Structure

```
tabletop-tracker/
├── server.py               # serveur local : statiques + proxy API BGG (loopback)
├── static/
│   ├── *.html              # 7 pages
│   ├── styles.css
│   └── js/
│       ├── scoring.js      # rangs, points pondérés, classement (pur, testé)
│       ├── store.js        # localStorage + CRUD + export/import (testé)
│       ├── stats.js        # statistiques joueur
│       ├── charts.js       # graphique canvas (sans dépendance)
│       ├── bgg.js          # client du proxy BGG
│       ├── app.js          # helpers DOM + navigation
│       └── page-*.js       # une page par fichier
└── tests/                  # tests Node (aucun framework requis)
```

## Tests

```bash
node tests/scoring.test.js      # rangs, pondération, bonus record, classement
node tests/store.test.js        # CRUD, persistance, recalcul, export/import
node tests/smoke-pages.test.js  # chaque page s'exécute (DOM mocké), vide + données
```

## Données

Stockées dans le `localStorage` du navigateur sous la clé `ttt:v1`.
Exportez-les en JSON depuis ⚙ Paramètres pour sauvegarder / transférer
vers un autre navigateur ou une autre machine.
