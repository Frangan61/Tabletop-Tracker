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

## Installer l'app sur un nouvel appareil (step by step)

Le dépôt est public : chacun peut avoir **sa propre copie** de l'app (ses propres données).

### Sur un ordinateur (Windows / macOS / Linux)

1. **Installer Python 3** (si ce n'est pas déjà fait) : https://www.python.org/downloads/ (cocher « Add Python to PATH » sur Windows). Vérifier : `python3 --version`
2. **Installer Git** : https://git-scm.com/downloads
3. Ouvrir un terminal et taper :
   ```bash
   git clone https://github.com/Frangan61/Tabletop-Tracker.git
   cd Tabletop-Tracker
   python3 server.py
   ```
4. Ouvrir le navigateur sur **http://127.0.0.1:8787** → l'app est prête.
   - Si le port 8787 est occupé : `PORT=9000 python3 server.py` puis http://127.0.0.1:9000
   - Pour la recherche BGG automatique : `BGG_API_KEY=ta_cle python3 server.py` (sinon saisie manuelle des jeux)
5. **Optionnel — l'installer comme une app** : dans le navigateur, menu ⋮ → « Installer TableTop Tracker » (Chrome/Edge) → icône sur le bureau.
6. **Mises à jour** : `cd Tabletop-Tracker && git pull` puis relancer `python3 server.py`.

### Sur un smartphone Android (Termux)

1. Installer **Termux** (F-Droid de préférence, ou Play Store).
2. Dans Termux :
   ```bash
   pkg update && pkg install -y python git
   git clone https://github.com/Frangan61/Tabletop-Tracker.git
   cd Tabletop-Tracker
   python3 server.py
   ```
3. Ouvrir **Chrome** sur le téléphone : `http://127.0.0.1:8787`
4. Menu ⋮ → **« Ajouter à l'écran d'accueil »** → l'app s'installe (icône 🎲, fonctionne hors-ligne).
5. Laisser Termux tourner en arrière-plan (ne pas le swiper). Mises à jour : `git pull` puis relancer le serveur. Au démarrage du téléphone, option `termux-boot` (voir section « Sur smartphone »).

### Sur iPhone

Pas de serveur local simple sur iOS : utiliser un PC sur le même Wi-Fi :
```bash
HOST=0.0.0.0 python3 server.py     # sur le PC
```
puis sur l'iPhone, Safari → `http://<IP-du-PC>:8787` (IP du PC : `ipconfig` Windows / `ip addr` Mac/Linux), puis Partager → « Sur l'écran d'accueil ».

### 📤 Partager une seule partie avec un ami (code)

Pas besoin de tout exporter : chaque partie a un bouton **🔗 Partager** (dernières
parties, fiche jeu, historique joueur). Il génère un **code texte** (commence par
`TTT1:…`, ~500 caractères, copiable par SMS/WhatsApp/mail) :

1. Paul enregistre la partie normalement, clique **🔗 Partager**, copie le code, l'envoie à Henri
2. Henri : ⚙ Paramètres → **« Importer une partie partagée »** → colle le code → **Importer**
3. La partie s'ajoute chez Henri : le **jeu et les joueurs sont créés automatiquement** s'il ne
   les a pas (reconnus par nom / id BGG), les **rangs et points sont recalculés avec son
   historique** (la perf est donc juste côté Henri), et un **anti-doublon** empêche d'importer
   deux fois la même partie.

### Transférer des données existantes (tes parties)

Les données sont dans le navigateur de chaque appareil. Pour copier ta base chez un ami :
chez toi ⚙ Paramètres → **Exporter en JSON** → envoie le fichier → chez lui ⚙ Paramètres → **Importer un JSON**.
(L'export sert aussi de sauvegarde.)

⚠️ Si plusieurs personnes jouent en même temps sur le même Wi-Fi (option `HOST=0.0.0.0`), chacun écrit dans **son propre** navigateur : une seule personne enregistre les parties, puis partage le JSON export.

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

### Mettre à jour l'app (Termux)

```bash
cd Tabletop-Tracker && git pull        # récupère la nouvelle version
pkill -f server.py ; python3 server.py # relance le serveur
```

Puis sur le téléphone, **recharge la page 2 fois** dans Chrome
(`http://127.0.0.1:8787`) : la 1ʳᵉ recharge télécharge le nouveau service worker,
la 2ᵉ l'active. Le service worker est en *network-first* pour les pages/scripts :
tant que le serveur répond, tu as la dernière version (le cache ne sert que hors-ligne).
Si tu vois encore l'ancienne version : vide le cache du site dans Chrome
(Paramètres → Confidentialité → Effacer les données de navigation → cache), ou
supprime l'icône de l'écran d'accueil et réinstalle la PWA.

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

## Liste de base : 50 jeux populaires

À la **première ouverture**, l'app pré-charge automatiquement **50 jeux populaires**
(Catan, Carcassonne, Wingspan, Gloomhaven, Pandemic, 7 Wonders Duel…) avec leur **id BGG**,
**poids (complexité)**, année, joueurs min/max, durée, mode (versus/duel/coop) et tags.
Ce sont des valeurs de référence : un import BGG (avec clé) ou un code partagé les corrige
ensuite automatiquement. Bouton « ✨ Ajouter les 50 jeux populaires manquants » sur la page
Jeux pour compléter une bibliothèque existante (sans doublon : détection par id BGG ou nom
similaire, ex. « Katan » = « Catan »).

## Autocomplétion, favoris, tags éditables, « Best » BGG

- **Autocomplétion** (au lieu des menus déroulants) : dans « Nouvelle partie » pour choisir le jeu
  et dans « Trouver un jeu » pour les tags — taper filtre la liste en direct (« c » → tous les jeux
  avec un « c », « cat » → Catan…), insensible à la casse/accents ; Entrée prend la 1ʳᵉ proposition
  ou la saisie libre
- **Fiche jeu** : ajouter/retirer des **tags** (autocomplétion + nouveau tag libre) et mettre le jeu
  en **⭐ favori** (badge dans la liste des jeux, filtre « ⭐ favoris » dans la recherche)
- **« Best » BGG** (`suggested_numplayers` = Best) : champ `bestPlayers` sur chaque jeu —
  rempli automatiquement via l'API BGG, éditable à la main, affiché sur la fiche (👍 meilleur à
  N joueurs), filtre « 👍 meilleur à N » dans la recherche, et embarqué dans les codes partagés
  (rectifié à l'import si erroné)

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
- **Jeux** : recherche BGG (nom, année, poids, joueurs min/max, durée, catégories/mécanismes
  en tags, image) ou saisie manuelle ; fiche par jeu avec classement dédié, **top 10 des
  meilleurs scores tous joueurs confondus** et historique des parties
- **Classement** : **4 catégories distinctes** via le sélecteur « Catégorie » — ⚔️ Compétitif
  (défaut, 3+ joueurs) / 🏓 **Duel 1v1** (jeux strictement à 2) / 🤝 Coopératif / 👥 **Duo**
  (coop à 2) / 📊 Tout. Chaque jeu a un **mode** (versus/duel/coop/duo), auto-détecté à l'ajout
  (min=max=2 → duel/duo, catégorie BGG « Cooperative » → coop/duo) ; les parties duel/duo sont
  limitées à exactement 2 participants. Deux formules d'affichage au choix — **complète** (rang +
  perf score × poids BGG) ou **podium seul** (rang × poids BGG, sans le bonus de score de partie) ;
  filtrable par période. Coches les joueurs pour les **comparer** : la comparaison ne porte que sur les
  **parties communes à tous les joueurs cochés** (équitable — les parties avec d'autres joueurs
  en plus comptent tant que tous les cochés y sont) ; barres de points, tableau de stats
  (rang moyen, meilleur score, série en cours…), courbes d'évolution superposées ; à **2 joueurs
  cochés**, un panneau **⚔️ face-à-face** détaille leurs duels (victoires, scores moyens, points
  gagnés, historique des confrontations)
- **Jeux coopératifs** : case « 🤝 coopératif » (auto-détectée via la catégorie BGG
  « Cooperative Game »). À l'enregistrement : résultat commun **Victoire/Défaite** (+ score
  d'équipe optionnel pour le top 10) au lieu des scores individuels → victoire = 1er pour tous,
  défaite = dernier ex-aequo, **perf désactivée** ; top 10 du jeu = meilleurs scores d'équipe.
  Les parties coop/duo ont leur **propre classement** et n'entrent pas dans le classement
  compétitif ; la page joueur affiche des blocs séparés (points compétitifs, 🤝 coop V/D, 🏓 à 2 joueurs)
- **Nouvelle partie** : sélection du jeu, date, participants + scores bruts, aperçu en direct
  du rang et des points calculés avant enregistrement
- **🏆 Tournoi** : choisis le jeu et les participants, le nombre de poules et les qualifiés par
  poule. Deux modes de tirage : **têtes de série selon le classement** (style FIFA — chapeaux
  n°1 / n°2-3 / n°4-7… tirés dans des poules libres, pour que les forts ne se retrouvent
  qu'en phase finale) ou **100 % aléatoire**. Historique des tournois enregistrés
- **Paramètres** : formule de points, export JSON / CSV des parties, import JSON,
  **réinitialisation de toutes les parties protégée par mot de passe** (hash SHA-256 côté
  client — protège des clics accidentels, pas d'un initié qui lit le code), reset complet

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
