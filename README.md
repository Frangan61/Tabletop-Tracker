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

## Clé API BoardGameGeek (optionnel)

L'API XML2 de BGG exige désormais une clé d'application. Pour l'activer :

1. Créez une clé gratuite sur BoardGameGeek (profil → *Developer* / applications)
2. Lancez le serveur avec :

```bash
BGG_API_KEY=votre_cle python3 server.py
```

Sans clé, la page **Jeux** vous propose automatiquement la saisie manuelle
(nom + poids BGG entre 1 et 5).

## Formule de points (configurable dans ⚙ Paramètres)

Pour chaque partie enregistrée :

```
points du joueur = points_de_rang(rang) × poids_BGG(jeu)     (si multiplicateur activé)
                 + bonus_record × poids_BGG(jeu)              (si record perso sur ce jeu)
```

- **Points de rang** par défaut : 1er = 10, 2e = 7, 3e = 5, 4e = 3, 5e = 2, 6e et + = 1
- **Poids BGG** : complexité du jeu entre 1 (léger) et 5 (expert), récupérée via BGG ou saisie à la main
- **Bonus record** : +5 × poids BGG quand le score brut du joueur bat son meilleur
  score précédent **sur ce même jeu** (une première partie sur un jeu ne donne pas de bonus)
- **Ex-aequo** : les scores égaux partagent le même rang (rangs 1, 1, 3, 4…)

Les points calculés sont **stockés avec la partie** à l'enregistrement ; changez la
formule dans les paramètres puis cliquez sur « Recalculer toutes les parties » si besoin.

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
