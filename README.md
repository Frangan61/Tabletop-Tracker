# 🎲 TableTop Tracker

Application web **locale** pour consigner vos parties de jeux de société :
joueurs, jeux, scores bruts et classement, avec **pondération par la complexité
BGG (poids 1–5)** du jeu joué.

- 100 % local : les données restent sur votre machine (`localStorage` du navigateur)
- Zéro dépendance lourde : Python 3 (stdlib uniquement) + navigateur + (optionnel) Git
- Recherche de jeux via l'API BoardGameGeek (optionnelle, avec repli en saisie manuelle)

## 🚀 Lancement rapide

Ouvrir un terminal dans le dossier du projet, puis selon votre système :

| Système | Commandes |
|---|---|
| **Windows (PowerShell)** | `py server.py` |
| **Windows (CMD)** | `python server.py` |
| **macOS / Linux** | `python3 server.py` |
| **Android (Termux)** | `python3 server.py` |

Puis ouvrir **http://127.0.0.1:8787** dans le navigateur.

⚠️ Sous Windows, la commande Python s'appelle `py` ou `python` (**pas `python3`**),
et on sépare les commandes par `;` ou des sauts de ligne (**pas `&&`**).

```powershell
# Windows PowerShell — exemple complet
cd C:\Users\Paul\Tabletop-Tracker
py server.py
```

```bash
# macOS / Linux / Termux
cd Tabletop-Tracker
python3 server.py
```

**Sans serveur** (zéro install, recherche BGG désactivée) : ouvrir directement
`static/index.html` dans le navigateur (double-clic sur Windows).

Le serveur n'écoute que sur `127.0.0.1` (votre machine uniquement). Voir plus bas pour
les variables d'environnement `PORT`, `HOST`, `BGG_API_KEY` selon l'OS.

## 📋 Commandes selon l'OS (référence)

| Action | Windows PowerShell | Windows CMD | macOS/Linux/Termux |
|---|---|---|---|
| Lancer le serveur | `py server.py` | `python server.py` | `python3 server.py` |
| Vérifier Python | `py --version` | `python --version` | `python3 --version` |
| Port perso | `$env:PORT="9000"; py server.py` | `set PORT=9000` puis `python server.py` | `PORT=9000 python3 server.py` |
| Servir sur le Wi-Fi | `$env:HOST="0.0.0.0"; py server.py` | `set HOST=0.0.0.0` puis `python server.py` | `HOST=0.0.0.0 python3 server.py` |
| Clé BGG | `$env:BGG_API_KEY="votre_cle"; py server.py` | `set BGG_API_KEY=votre_cle` puis `python server.py` | `BGG_API_KEY=votre_cle python3 server.py` |
| Arrêter le serveur | fermer la fenêtre (ou `Ctrl+C`) | `Ctrl+C` | `Ctrl+C` ou `pkill -f server.py` |
| Plusieurs commandes | `a; b; c` | `a & b & c` | `a && b && c` |
| Voir l'IP du PC (pour le Wi-Fi) | `ipconfig` | `ipconfig` | `ip addr` ou `hostname -I` |
| Lancer les tests | `node tests/scoring.test.js` (idem partout) | idem | idem |
| Bump cache PWA | `py tools/bump_cache.py` | `python tools/bump_cache.py` | `python3 tools/bump_cache.py` |

## 📲 Installer l'app sur un nouvel appareil (step by step)

Le dépôt est public : chacun peut avoir **sa propre copie** de l'app (ses propres données).

### Sur un ordinateur (Windows / macOS / Linux)

1. **Installer Python 3** : https://www.python.org/downloads/ — sur Windows, **cocher
   « Add Python to PATH »**. Vérifier : `py --version` (Windows) ou `python3 --version`.
2. **Installer Git** : https://git-scm.com/downloads — choisir « Git from the command line… ».
3. Terminal :
   ```powershell
   # Windows PowerShell
   cd C:\Users\Paul
   git clone https://github.com/Frangan61/Tabletop-Tracker.git
   cd Tabletop-Tracker
   py server.py
   ```
   ```bash
   # macOS / Linux
   git clone https://github.com/Frangan61/Tabletop-Tracker.git
   cd Tabletop-Tracker
   python3 server.py
   ```
4. Ouvrir **http://127.0.0.1:8787** → l'app est prête.
5. **Installer comme une app de bureau** (optionnel) : menu ⋮ du navigateur →
   « Installer TableTop Tracker ».
6. **Mises à jour** : `git checkout main; git pull` (Windows) / `git checkout main && git pull`,
   puis relancer le serveur.

### Sur un smartphone Android (Termux)

```bash
pkg update && pkg install -y python git
git clone https://github.com/Frangan61/Tabletop-Tracker.git
cd Tabletop-Tracker
python3 server.py
```
Puis Chrome sur le téléphone : `http://127.0.0.1:8787`, menu ⋮ →
**« Ajouter à l'écran d'accueil »** (icône 🎲, fonctionne hors-ligne).
Laisser Termux tourner en arrière-plan (ne pas le swiper ; optionnel : `pkg install termux-api`
puis `termux-wake-lock`, et `termux-boot` pour lancer au démarrage du téléphone).

Mises à jour : `git checkout main && git pull` puis `pkill -f server.py; python3 server.py`,
puis **recharger la page 2 fois** dans Chrome.

### Sur iPhone

Pas de serveur local simple sur iOS : lancer le PC sur le même Wi-Fi avec
`$env:HOST="0.0.0.0"; py server.py` (Windows) ou `HOST=0.0.0.0 python3 server.py`,
puis sur l'iPhone Safari → `http://<IP-du-PC>:8787` (IP du PC : `ipconfig` / `ip addr`),
Partager → « Sur l'écran d'accueil ».

### 📤 Partager une seule partie avec un ami (code)

Bouton **🔗 Partager** sur chaque partie (accueil, fiche jeu, historique joueur) →
génère un **code texte** (`TTT1:…`, ~500 caractères, copiable par SMS/WhatsApp/mail) :

1. Paul enregistre la partie, clique **🔗 Partager**, copie le code, l'envoie à Henri
2. Henri : ⚙ Paramètres → **« Importer une partie partagée »** → colle le code → **Importer**
3. La partie s'ajoute chez Henri : **jeu et joueurs créés automatiquement** s'il ne les a pas
   (reconnus par id BGG / nom, même « Katan » = « Catan »), leurs **infos erronées sont
   rectifiées** (poids, tags, durée, image, Best, favori…), les **points sont recalculés avec
   son historique**, et un **anti-doublon** bloque les réimports.

### Transférer toute une base (sauvegarde)

⚙ Paramètres → **Exporter en JSON** → envoyer le fichier → ⚙ Paramètres → **Importer un JSON**
sur l'autre appareil. ⚠️ Les données (`localStorage`) sont propres à chaque navigateur/appareil :
en Wi-Fi partagé (`HOST=0.0.0.0`), chacun écrit dans son propre navigateur — une seule personne
enregistre les parties, puis partage le JSON export. ⚠️ `HOST=0.0.0.0` = aucune authentification,
à n'utiliser que sur un Wi-Fi de confiance.

## 🔑 Clé API BoardGameGeek (optionnel)

L'API XML2 de BGG exige une clé d'application (gratuite, profil BGG → *Developer*). Lancez avec :
- Windows PowerShell : `$env:BGG_API_KEY="votre_cle"; py server.py`
- macOS/Linux/Termux : `BGG_API_KEY=votre_cle python3 server.py`

Sans clé, la page **Jeux** retombe en saisie manuelle (nom + poids 1–5).

## 📊 Formule de points dynamique (⚙ Paramètres)

```
points du joueur = (points_de_rang(rang) + perf) × poids_BGG(jeu)   (si multiplicateur activé)
```

- Points de rang par défaut : 1er = 10, 2e = 7, 3e = 5, 4e = 3, 5e = 2, 6e+ = 1
- **perf dynamique** : compare le score brut à **tous les scores des parties précédentes du même
  jeu** — mode **percentile** (défaut : `perf = coef × % de scores historiques battus`) ou
  **zscore** (`coef × clamp(z,0,3)/3`) ; `perf = 0` sans historique ; ex-aequo = même rang
- Exemple : victoire (10) avec un score à 90 % de l'historique, poids 2.3 → (10+9)×2.3 ≈ 43,7 pts

Les points sont stockés avec la partie ; bouton « Recalculer toutes les parties » dans ⚙ Paramètres.

## 🎮 Fonctionnalités

- **50 jeux populaires pré-chargés** à la 1ʳᵉ ouverture (id BGG, poids, 👍 Best, durée, mode,
  tags) + bouton « ✨ Ajouter les 50 jeux populaires manquants » (sans doublon)
- **Autocomplétion** (filtrage « contient », insensible casse/accents) pour choisir le jeu dans
  « Nouvelle partie » et les tags dans « Trouver un jeu »
- **Fiche jeu éditable** : tags ajoutables/supprimables, ⭐ favori, 👍 meilleur à N joueurs (BGG Best)
- **Recherche de jeu** 🎯 : filtres nombre de joueurs, 👍 Best, durée max, tags, nom, ⭐ favoris
- **Classement** : 4 catégories (⚔️ Compétitif / 🏓 Duel 1v1 / 🤝 Coopératif / 👥 Duo / 📊 Tout),
  2 formules (complète rang+perf × poids / podium seul), filtres de période, **comparaison de
  joueurs cochés sur les parties communes uniquement** + **⚔️ face-à-face** à 2 joueurs
- **Page perso par joueur** : historique, records, stats 5/10 dernières parties, courbes d'évolution
- **Nouvelle partie** : autocomplétion du jeu, aperçu des rangs/points en direct, mode coop
  (🏆/💀) pour les jeux coopératifs
- **🏆 Tournoi** : poules aléatoires ou **têtes de série façon FIFA** (les forts séparés jusqu'en finale)
- **Top 10 des scores par jeu** (ou scores d'équipe en coop)
- **Partage de parties par code** `TTT1:…` entre appareils
- **PWA** installable (hors-ligne), ⚙ export/import JSON + CSV, reset des parties protégé par
  mot de passe (hash SHA-256 côté client)

## 🗂 Structure

```
Tabletop-Tracker/
├── server.py               # serveur local (loopback) : statiques + proxy API BGG
├── tools/bump_cache.py     # bump de version du cache PWA (?v=N) à chaque déploiement
├── static/
│   ├── *.html              # 9 pages
│   ├── styles.css
│   ├── manifest.webmanifest / sw.js / icons/
│   └── js/                 # scoring, store, stats, charts, bgg, share, tournament,
│                           # seed-games, app + page-*.js (une page par fichier)
└── tests/                  # 11 suites de tests Node (aucun framework requis)
```

## 🧪 Tests

```bash
node tests/app.test.js          # h(), autocomplétion/filtrage
node tests/scoring.test.js      # rangs, pondération BGG, perf dynamique
node tests/store.test.js        # CRUD, persistance, recalcul, export/import
node tests/features.test.js     # mdp hashé, reset, comparaison, podium, face-à-face
node tests/coop.test.js         # coop/duo, catégories, parties communes
node tests/share.test.js        # codes TTT1: encode/decode/import, anti-doublon, rectif jeu
node tests/seed.test.js         # 50 jeux de base
node tests/tournament.test.js   # tirage de poules (aléatoire + têtes de série)
node tests/finder.test.js       # page recherche : liste rendue
node tests/smoke-pages.test.js  # les 9 pages s'exécutent (DOM mocké strict)
node tests/pwa.test.js          # manifest, service worker, cache-busting ?v=N
```
(les chemins avec `/` fonctionnent aussi sous Windows avec Node.)

## 💾 Données

`localStorage` du navigateur, clé `ttt:v1`. Sauvegarde/transfert : ⚙ Paramètres → Exporter JSON.
