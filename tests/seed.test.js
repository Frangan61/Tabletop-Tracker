"use strict";
// Liste de base : 50 jeux populaires pré-chargés à la première ouverture.
const assert = require("assert");

let mem = {};
globalThis.__tttMockStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
globalThis.TTT = {};
require("../static/js/seed-games.js");
const scoring = require("../static/js/scoring.js");
const store = require("../static/js/store.js");
require("../static/js/share.js"); // pour namesSimilar

// --- première ouverture (stockage vide) : les 50 jeux sont pré-chargés ---
let st = store.load();
assert.strictEqual(st.games.length, 50, "50 jeux de base");
assert.strictEqual(st.seeded, true);
const catan = st.games.find((g) => g.bggId === "13");
assert.ok(catan, "Catan présent");
assert.strictEqual(catan.name, "Catan");
assert.strictEqual(catan.complexity, 2.3, "poids BGG de Catan = 2.3");
assert.strictEqual(catan.minPlayers, 3);
assert.strictEqual(catan.maxPlayers, 4);
assert.strictEqual(catan.duration, 90);
assert.deepStrictEqual(catan.tags, ["Commerce", "Négociation", "Dé", "Stratégie"]);
// modes bien répartis
const modes = { versus: 0, duel: 0, coop: 0 };
for (const g of st.games) {
  const c = scoring.catOf(g);
  modes[c === "duo" ? "duo" : c] = (modes[c === "duo" ? "duo" : c] || 0) + 1;
}
assert.ok(modes.coop >= 5 && modes.duel >= 4, "coop et duel présents: " + JSON.stringify(modes));

// --- rechargement : pas de doublon ---
st = store.load();
assert.strictEqual(st.games.length, 50, "re-load sans doublon");
assert.strictEqual(new Set(st.games.map((g) => g.bggId)).size, 50, "bggId uniques");

// --- gameExists tolère les noms proches ---
assert.ok(store.gameExists(st, { name: "Katan", bggId: "13" }), "Katan == Catan (bggId)");
assert.ok(store.gameExists(st, { name: "Katan", bggId: null }), "Katan == Catan (nom similaire)");
assert.ok(!store.gameExists(st, { name: "Wingspan Deluxe", bggId: null }), "Wingspan Deluxe != Wingspan");
assert.ok(!store.gameExists(st, { name: "Ticket to Ride: Nordic Countries", bggId: null }), "variante longue != jeu de base");

// --- seed manuel : n'ajoute que les manquants ---
mem = {};
st = store.defaultState();
store.addGame(st, { name: "Mon jeu perso", complexity: 2 });
const added = store.seedDefaultGames(st);
assert.strictEqual(added, 50, "50 ajoutés (le jeu perso n'est pas dans la liste)");
assert.strictEqual(store.load().games.length, 51);
const added2 = store.seedDefaultGames(store.load());
assert.strictEqual(added2, 0, "rien à ajouter la 2e fois");
assert.strictEqual(store.load().games.length, 51, "pas de doublon");

console.log("seed.test.js : OK (50 jeux de base, poids Catan=2.3, pas de doublon, seed manuel)");
