// Liste de référence : 50 jeux populaires avec id BGG + poids (averageweight) connus.
// Valeurs de départ : l'import BGG (avec clé) ou un code partagé les corrige automatiquement.
(function (root) {
  "use strict";
  root.TTT = root.TTT || {};
  root.TTT.SEED_GAMES = [
  {
    "name": "Catan",
    "bggId": "13",
    "complexity": 2.3,
    "year": 1995,
    "minPlayers": 3,
    "maxPlayers": 4,
    "duration": 90,
    "coop": false,
    "duel": false,
    "tags": [
      "Commerce",
      "Négociation",
      "Dé",
      "Stratégie"
    ]
  },
  {
    "name": "Carcassonne",
    "bggId": "822",
    "complexity": 1.9,
    "year": 2000,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 45,
    "coop": false,
    "duel": false,
    "tags": [
      "Tuiles",
      "Pose de tuiles",
      "Familial"
    ]
  },
  {
    "name": "Ticket to Ride",
    "bggId": "9209",
    "complexity": 1.8,
    "year": 2004,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 60,
    "coop": false,
    "duel": false,
    "tags": [
      "Trains",
      "Routes",
      "Familial"
    ]
  },
  {
    "name": "Pandemic",
    "bggId": "30549",
    "complexity": 2.4,
    "year": 2008,
    "minPlayers": 2,
    "maxPlayers": 4,
    "duration": 45,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Sauver le monde",
      "Cartes"
    ]
  },
  {
    "name": "Wingspan",
    "bggId": "266192",
    "complexity": 2.4,
    "year": 2019,
    "minPlayers": 1,
    "maxPlayers": 5,
    "duration": 55,
    "coop": false,
    "duel": false,
    "tags": [
      "Oiseaux",
      "Moteur de combos",
      "Cartes"
    ]
  },
  {
    "name": "7 Wonders",
    "bggId": "68448",
    "complexity": 2.3,
    "year": 2010,
    "minPlayers": 3,
    "maxPlayers": 7,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Draft de cartes",
      "Civilisation",
      "Stratégie"
    ]
  },
  {
    "name": "Azul",
    "bggId": "230802",
    "complexity": 1.9,
    "year": 2017,
    "minPlayers": 2,
    "maxPlayers": 4,
    "duration": 40,
    "coop": false,
    "duel": false,
    "tags": [
      "Tuiles",
      "Abstrait",
      "Pose de tuiles"
    ]
  },
  {
    "name": "Splendor",
    "bggId": "148228",
    "complexity": 1.8,
    "year": 2014,
    "minPlayers": 2,
    "maxPlayers": 4,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Gemmes",
      "Moteur de combos",
      "Économie"
    ]
  },
  {
    "name": "Dixit",
    "bggId": "39856",
    "complexity": 1.3,
    "year": 2008,
    "minPlayers": 3,
    "maxPlayers": 6,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Créatif",
      "Party",
      "Cartes illustrées"
    ]
  },
  {
    "name": "Codenames",
    "bggId": "178900",
    "complexity": 1.3,
    "year": 2015,
    "minPlayers": 2,
    "maxPlayers": 8,
    "duration": 15,
    "coop": false,
    "duel": false,
    "tags": [
      "Mots",
      "Équipes",
      "Party",
      "Déduction"
    ]
  },
  {
    "name": "Terraforming Mars",
    "bggId": "167791",
    "complexity": 3.2,
    "year": 2016,
    "minPlayers": 1,
    "maxPlayers": 5,
    "duration": 120,
    "coop": false,
    "duel": false,
    "tags": [
      "Science-fiction",
      "Moteur de combos",
      "Gestion de ressources"
    ]
  },
  {
    "name": "Gloomhaven",
    "bggId": "174430",
    "complexity": 3.8,
    "year": 2017,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 90,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Campagne",
      "Combat tactique",
      "Scénarios"
    ]
  },
  {
    "name": "Brass: Birmingham",
    "bggId": "224517",
    "complexity": 3.9,
    "year": 2018,
    "minPlayers": 2,
    "maxPlayers": 7,
    "duration": 90,
    "coop": false,
    "duel": false,
    "tags": [
      "Économie",
      "Industriel",
      "Réseaux"
    ]
  },
  {
    "name": "Arkham Horror: The Card Game",
    "bggId": "205637",
    "complexity": 3.3,
    "year": 2016,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 75,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Horreur",
      "Cartes",
      "Campagne"
    ]
  },
  {
    "name": "7 Wonders Duel",
    "bggId": "173346",
    "complexity": 2.2,
    "year": 2015,
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": 30,
    "coop": false,
    "duel": true,
    "tags": [
      "Duel",
      "Draft",
      "Civilisation"
    ]
  },
  {
    "name": "Hanabi",
    "bggId": "98778",
    "complexity": 1.7,
    "year": 2010,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 25,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Cartes",
      "Communication limitée"
    ]
  },
  {
    "name": "The Crew",
    "bggId": "188992",
    "complexity": 1.9,
    "year": 2019,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 30,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Astronautes",
      "Levées",
      "Missions"
    ]
  },
  {
    "name": "Spirit Island",
    "bggId": "162886",
    "complexity": 4.0,
    "year": 2017,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 105,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Anti-colonial",
      "Éléments",
      "Stratégie"
    ]
  },
  {
    "name": "Root",
    "bggId": "237182",
    "complexity": 2.9,
    "year": 2018,
    "minPlayers": 2,
    "maxPlayers": 4,
    "duration": 75,
    "coop": false,
    "duel": false,
    "tags": [
      "Asymétrique",
      "Contrôle de zone",
      "Animaux",
      "Stratégie"
    ]
  },
  {
    "name": "Scythe",
    "bggId": "169786",
    "complexity": 3.4,
    "year": 2016,
    "minPlayers": 1,
    "maxPlayers": 5,
    "duration": 100,
    "coop": false,
    "duel": false,
    "tags": [
      "Science-fiction",
      "Contrôle de zone",
      "Moteur de combos",
      "1920s"
    ]
  },
  {
    "name": "Blood Rage",
    "bggId": "96561",
    "complexity": 2.6,
    "year": 2015,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 75,
    "coop": false,
    "duel": false,
    "tags": [
      "Vikings",
      "Draft",
      "Combat",
      "Contrôle de zone"
    ]
  },
  {
    "name": "Viticulture",
    "bggId": "183394",
    "complexity": 2.5,
    "year": 2015,
    "minPlayers": 1,
    "maxPlayers": 6,
    "duration": 75,
    "coop": false,
    "duel": false,
    "tags": [
      "Placement d'ouvriers",
      "Vin",
      "Stratégie"
    ]
  },
  {
    "name": "Agricola",
    "bggId": "31260",
    "complexity": 3.6,
    "year": 2007,
    "minPlayers": 1,
    "maxPlayers": 5,
    "duration": 90,
    "coop": false,
    "duel": false,
    "tags": [
      "Placement d'ouvriers",
      "Agriculture",
      "Stratégie"
    ]
  },
  {
    "name": "Puerto Rico",
    "bggId": "3076",
    "complexity": 3.3,
    "year": 2002,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 120,
    "coop": false,
    "duel": false,
    "tags": [
      "Rôles",
      "Colonies",
      "Économie",
      "Stratégie"
    ]
  },
  {
    "name": "Power Grid",
    "bggId": "2651",
    "complexity": 3.3,
    "year": 2004,
    "minPlayers": 2,
    "maxPlayers": 6,
    "duration": 120,
    "coop": false,
    "duel": false,
    "tags": [
      "Enchères",
      "Réseaux électriques",
      "Économie"
    ]
  },
  {
    "name": "Ticket to Ride: Europe",
    "bggId": "14996",
    "complexity": 1.9,
    "year": 2005,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 60,
    "coop": false,
    "duel": false,
    "tags": [
      "Trains",
      "Routes",
      "Familial"
    ]
  },
  {
    "name": "Love Letter",
    "bggId": "129622",
    "complexity": 1.2,
    "year": 2012,
    "minPlayers": 2,
    "maxPlayers": 6,
    "duration": 20,
    "coop": false,
    "duel": false,
    "tags": [
      "Cartes",
      "Déduction",
      "Party",
      "Royauté"
    ]
  },
  {
    "name": "Jaipur",
    "bggId": "54043",
    "complexity": 2.0,
    "year": 2009,
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": 30,
    "coop": false,
    "duel": true,
    "tags": [
      "Duel",
      "Commerce",
      "Cartes",
      "Échange"
    ]
  },
  {
    "name": "Patchwork",
    "bggId": "163412",
    "complexity": 1.7,
    "year": 2014,
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": 20,
    "coop": false,
    "duel": true,
    "tags": [
      "Duel",
      "Tuiles",
      "Abstrait",
      "2 joueurs"
    ]
  },
  {
    "name": "King of Tokyo",
    "bggId": "70135",
    "complexity": 2.0,
    "year": 2011,
    "minPlayers": 2,
    "maxPlayers": 6,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Monstres",
      "Dés",
      "Combat",
      "Hasard"
    ]
  },
  {
    "name": "Exploding Kittens",
    "bggId": "172225",
    "complexity": 1.2,
    "year": 2015,
    "minPlayers": 2,
    "maxPlayers": 5,
    "duration": 15,
    "coop": false,
    "duel": false,
    "tags": [
      "Party",
      "Chatons",
      "Hasard",
      "Humour"
    ]
  },
  {
    "name": "Munchkin",
    "bggId": "6592",
    "complexity": 1.4,
    "year": 2001,
    "minPlayers": 3,
    "maxPlayers": 6,
    "duration": 90,
    "coop": false,
    "duel": false,
    "tags": [
      "Donjons",
      "Humour",
      "Cartes",
      "Party"
    ]
  },
  {
    "name": "Uno",
    "bggId": "2948",
    "complexity": 1.1,
    "year": 1971,
    "minPlayers": 2,
    "maxPlayers": 10,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Cartes",
      "Party",
      "Familial",
      "Uno"
    ]
  },
  {
    "name": "Dobble (Spot it)",
    "bggId": "63268",
    "complexity": 1.0,
    "year": 2011,
    "minPlayers": 2,
    "maxPlayers": 8,
    "duration": 15,
    "coop": false,
    "duel": false,
    "tags": [
      "Party",
      "Réflexes",
      "Observation",
      "Rapide"
    ]
  },
  {
    "name": "The Resistance",
    "bggId": "41114",
    "complexity": 2.2,
    "year": 2009,
    "minPlayers": 5,
    "maxPlayers": 10,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Bluff",
      "Espionnage",
      "Équipes",
      "Social"
    ]
  },
  {
    "name": "The Resistance: Avalon",
    "bggId": "68801",
    "complexity": 1.9,
    "year": 2012,
    "minPlayers": 5,
    "maxPlayers": 10,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Bluff",
      "Médiéval",
      "Équipes",
      "Social"
    ]
  },
  {
    "name": "Secret Hitler",
    "bggId": "188834",
    "complexity": 1.8,
    "year": 2016,
    "minPlayers": 4,
    "maxPlayers": 10,
    "duration": 35,
    "coop": false,
    "duel": false,
    "tags": [
      "Bluff",
      "Équipes",
      "Social",
      "Party",
      "Politique"
    ]
  },
  {
    "name": "Betrayal at House on the Hill",
    "bggId": "10547",
    "complexity": 2.3,
    "year": 2004,
    "minPlayers": 3,
    "maxPlayers": 6,
    "duration": 60,
    "coop": false,
    "duel": false,
    "tags": [
      "Horreur",
      "Tuiles",
      "Exploration",
      "Asymétrique"
    ]
  },
  {
    "name": "Mansions of Madness 2e",
    "bggId": "124438",
    "complexity": 4.4,
    "year": 2016,
    "minPlayers": 1,
    "maxPlayers": 5,
    "duration": 150,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Horreur",
      "Appli",
      "Scénarios",
      "Enquête"
    ]
  },
  {
    "name": "Gloomhaven: Jaws of the Lion",
    "bggId": "291453",
    "complexity": 2.9,
    "year": 2020,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 90,
    "coop": true,
    "duel": false,
    "tags": [
      "Coopératif",
      "Campagne",
      "Combat",
      "Scénarios"
    ]
  },
  {
    "name": "Cascadia",
    "bggId": "295947",
    "complexity": 2.0,
    "year": 2021,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 40,
    "coop": false,
    "duel": false,
    "tags": [
      "Tuiles",
      "Animaux",
      "Pose de tuiles",
      "Familial"
    ]
  },
  {
    "name": "Calico",
    "bggId": "283155",
    "complexity": 1.9,
    "year": 2020,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 40,
    "coop": false,
    "duel": false,
    "tags": [
      "Tuiles",
      "Chatons",
      "Motifs",
      "Familial"
    ]
  },
  {
    "name": "Parks",
    "bggId": "266513",
    "complexity": 2.0,
    "year": 2021,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 60,
    "coop": false,
    "duel": false,
    "tags": [
      "Conversion",
      "Voyage",
      "Ressources",
      "Photo"
    ]
  },
  {
    "name": "Everdell",
    "bggId": "199792",
    "complexity": 2.8,
    "year": 2018,
    "minPlayers": 1,
    "maxPlayers": 4,
    "duration": 60,
    "coop": false,
    "duel": false,
    "tags": [
      "Moteur de combos",
      "Forêt",
      "Créatures",
      "Ressources"
    ]
  },
  {
    "name": "The Quacks of Quedlinburg",
    "bggId": "244521",
    "complexity": 2.1,
    "year": 2018,
    "minPlayers": 2,
    "maxPlayers": 4,
    "duration": 45,
    "coop": false,
    "duel": false,
    "tags": [
      "Stop ou encore",
      "Sacs",
      "Alchimie",
      "Familial"
    ]
  },
  {
    "name": "Star Realms",
    "bggId": "147020",
    "complexity": 2.0,
    "year": 2014,
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": 20,
    "coop": false,
    "duel": true,
    "tags": [
      "Deck-building",
      "Science-fiction",
      "Combat",
      "2 joueurs"
    ]
  },
  {
    "name": "Dominion",
    "bggId": "36218",
    "complexity": 2.3,
    "year": 2008,
    "minPlayers": 2,
    "maxPlayers": 4,
    "duration": 30,
    "coop": false,
    "duel": false,
    "tags": [
      "Deck-building",
      "Stratégie",
      "Cartes"
    ]
  },
  {
    "name": "Chess (Échecs)",
    "bggId": "171",
    "complexity": 3.7,
    "year": 1475,
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": 30,
    "coop": false,
    "duel": true,
    "tags": [
      "Abstrait",
      "Duel",
      "Classique",
      "Stratégie"
    ]
  },
  {
    "name": "Monopoly",
    "bggId": "220",
    "complexity": 1.6,
    "year": 1935,
    "minPlayers": 2,
    "maxPlayers": 8,
    "duration": 120,
    "coop": false,
    "duel": false,
    "tags": [
      "Enchères",
      "Immobilier",
      "Familial",
      "Hasard"
    ]
  },
  {
    "name": "Risk",
    "bggId": "10383",
    "complexity": 2.1,
    "year": 1957,
    "minPlayers": 2,
    "maxPlayers": 6,
    "duration": 120,
    "coop": false,
    "duel": false,
    "tags": [
      "Guerre",
      "Dés",
      "Contrôle de zone",
      "Hasard"
    ]
  }
];
  if (typeof module !== "undefined" && module.exports) module.exports = root.TTT.SEED_GAMES;
})(typeof window !== "undefined" ? window : globalThis);
