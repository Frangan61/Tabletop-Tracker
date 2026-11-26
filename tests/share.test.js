"use strict";
// Partage de parties via code TTT1:... : encode chez Paul, import chez Henri.
const assert = require("assert");

let mem = {};
globalThis.__tttMockStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
globalThis.TTT = {};
const scoring = require("../static/js/scoring.js");
const store = require("../static/js/store.js");
const share = require("../static/js/share.js");

// --- appareil de Paul ---
let sA = store.defaultState();
const paul = store.addPlayer(sA, "Paul");
const henri = store.addPlayer(sA, "Henri");
const duel = store.addGame(sA, { name: "7 Wonders Duel", bggId: "148531", complexity: 2.2, mode: "duel", minPlayers: 2, maxPlayers: 2, tags: ["Duel", "Civilisation"] });
const mA = store.addMatch(sA, {
  gameId: duel.id,
  date: "2025-02-01",
  notes: "soirée jeux",
  entries: [{ playerId: paul.id, score: 60 }, { playerId: henri.id, score: 55 }],
});
assert.strictEqual(mA.entries[0].rank, 1);
assert.strictEqual(mA.entries[0].points, 22, "10 x 2.2");

// --- encode -> code ---
const code = share.encodeMatch(store.load(), mA.id);
assert.ok(code.startsWith("TTT1:"), "préfixe TTT1");
assert.ok(code.length < 700, "code compact (" + code.length + " caractères)");
console.log("exemple de code :", code.slice(0, 60) + "…");

// --- decode roundtrip ---
const decoded = share.decodeMatch(code);
assert.strictEqual(decoded.game.name, "7 Wonders Duel");
assert.strictEqual(decoded.game.bggId, "148531");
assert.strictEqual(decoded.game.complexity, 2.2);
assert.strictEqual(decoded.date, "2025-02-01");
assert.strictEqual(decoded.notes, "soirée jeux");
assert.deepStrictEqual(decoded.entries.map((e) => e.player).sort(), ["Henri", "Paul"]);

// --- appareil d'Henri (nouveau stockage vide) ---
mem = {};
let sB = store.defaultState();
const r = share.importMatchCode(sB, code, store);
assert.strictEqual(r.duplicate, false);
assert.strictEqual(r.createdGame, true, "jeu créé chez Henri");
assert.deepStrictEqual(r.createdPlayers.sort(), ["Henri", "Paul"], "joueurs créés chez Henri");
const stB = store.load();
assert.strictEqual(stB.matches.length, 1);
assert.strictEqual(stB.games.length, 1);
assert.strictEqual(stB.games[0].bggId, "148531");
assert.strictEqual(stB.players.length, 2);
// points recalculés côté Henri (même formule) : Paul 60 rang 1 -> 10 x 2.2 = 22
const imported = stB.matches[0];
assert.strictEqual(imported.entries.find((e) => e.score === 60).points, 22);
assert.strictEqual(imported.entries.find((e) => e.score === 60).rank, 1);

// --- réimport = doublon détecté ---
const r2 = share.importMatchCode(store.load(), code, store);
assert.strictEqual(r2.duplicate, true, "anti-doublon");
assert.strictEqual(store.load().matches.length, 1, "pas de doublon ajouté");

// --- Henri importe une 2e partie du même jeu : le jeu est réutilisé (pas recréé) ---
mem = {}; // on repart de l'état d'Henri précédent ? non : on recharge depuis mem actuel
// (mem contient déjà l'état d'Henri) -> on re-encode une 2e partie chez Paul
const mA2 = store.addMatch(store.load(), { gameId: duel.id, date: "2025-02-02", entries: [{ playerId: henri.id, score: 70 }, { playerId: paul.id, score: 65 }] });
// attendons : on est sur l'état d'Henri (mem) ; recréons proprement :
mem = {};
sA = store.defaultState();
const paul2 = store.addPlayer(sA, "Paul");
const henri2 = store.addPlayer(sA, "Henri");
const duel2 = store.addGame(sA, { name: "7 Wonders Duel", bggId: "148531", complexity: 2.2, mode: "duel" });
const m1 = store.addMatch(sA, { gameId: duel2.id, date: "2025-02-01", entries: [{ playerId: paul2.id, score: 60 }, { playerId: henri2.id, score: 55 }] });
const m2 = store.addMatch(sA, { gameId: duel2.id, date: "2025-02-02", entries: [{ playerId: henri2.id, score: 70 }, { playerId: paul2.id, score: 65 }] });
const code1 = share.encodeMatch(store.load(), m1.id);
const code2 = share.encodeMatch(store.load(), m2.id);
mem = {};
let sH = store.defaultState();
share.importMatchCode(sH, code1, store);
const r3 = share.importMatchCode(store.load(), code2, store);
assert.strictEqual(r3.createdGame, false, "jeu réutilisé (même bggId)");
assert.deepStrictEqual(r3.createdPlayers, [], "joueurs réutilisés (même nom)");
assert.strictEqual(store.load().matches.length, 2);
// 2e partie : Henri 70 bat 60 -> rang 1 ; histo [60,55] -> p=1 -> perf 10 -> (10+10)*2.2 = 44
const imp2 = store.load().matches.find((m) => m.date === "2025-02-02");
assert.strictEqual(imp2.entries.find((e) => e.score === 70).points, 44, "points recalculés avec l'historique local");

// --- codes invalides ---
assert.throws(() => share.decodeMatch("hello"), /TTT1/);
assert.throws(() => share.decodeMatch("TTT1:!!!notbase64!!!"), /illisible|invalide/i);
assert.throws(() => share.decodeMatch("TTT1:" + share.b64urlEncode(JSON.stringify({ v: 1 }))), /invalide/i);

// --- Henri a déjà le jeu mais avec des infos erronées/incomplètes ("Katan", poids 1) ---
assert.strictEqual(share.namesSimilar("Catan", "Katan"), true, "noms similaires detectes");
assert.strictEqual(share.namesSimilar("Catan", "Wingspan"), false);
// Paul : Catan complet (bggId, poids 2.3, tags, duree, image)
mem = {};
sA = store.defaultState();
const pA = store.addPlayer(sA, "Paul");
const hA = store.addPlayer(sA, "Henri");
const catA = store.addGame(sA, { name: "Catan", bggId: "13", complexity: 2.3, year: 1995, minPlayers: 3, maxPlayers: 4, duration: 60, bestPlayers: 4, favorite: true, tags: ["Commerce", "Négociation"], image: "https://cf.geekdo-images.com/img.png" });
const mCat = store.addMatch(sA, { gameId: catA.id, date: "2025-03-01", entries: [{ playerId: pA.id, score: 10 }, { playerId: hA.id, score: 8 }] });
const codeCat = share.encodeMatch(store.load(), mCat.id);
const decCat = share.decodeMatch(codeCat);
assert.strictEqual(decCat.game.image, "https://cf.geekdo-images.com/img.png", "l'image est embarquée dans le code");

// Henri : jeu "Katan" existant, poids erroné (1), pas de bggId/tags/durée
mem = {};
let sH2 = store.defaultState();
store.addPlayer(sH2, "Henri");
store.addPlayer(sH2, "Paul");
const katanLocal = store.addGame(sH2, { name: "Katan", complexity: 1, minPlayers: 2, maxPlayers: 4 });
const rCat = share.importMatchCode(sH2, codeCat, store);
const stH2 = store.load();
assert.strictEqual(rCat.createdGame, false, "pas de doublon de jeu créé");
assert.strictEqual(rCat.updatedGame, true, "infos rectifiées");
assert.strictEqual(stH2.games.length, 1, "toujours 1 seul jeu");
const gFixed = stH2.games[0];
assert.strictEqual(gFixed.name, "Katan", "nom local conservé");
assert.strictEqual(gFixed.bggId, "13", "bggId ajouté");
assert.strictEqual(gFixed.complexity, 2.3, "poids erroné rectifié (1 -> 2.3)");
assert.strictEqual(gFixed.duration, 60, "durée ajoutée");
assert.strictEqual(gFixed.year, 1995);
assert.deepStrictEqual(gFixed.tags, ["Commerce", "Négociation"], "tags ajoutés");
assert.strictEqual(gFixed.image, "https://cf.geekdo-images.com/img.png", "image ajoutée");
assert.strictEqual(gFixed.bestPlayers, 4, "bestPlayers rectifié (null -> 4)");
assert.strictEqual(gFixed.favorite, true, "favori repris du code");
assert.strictEqual(stH2.matches.length, 1, "partie importée");
// les points de la partie importée utilisent le poids rectifié : Paul rang 1 -> 10 x 2.3 = 23
assert.strictEqual(stH2.matches[0].entries.find((e) => e.score === 10).points, 23, "points recalcules avec le poids rectifie");

// --- bestPlayers + favorite embarqués dans le code ---
const dec2 = share.decodeMatch(codeCat);
assert.strictEqual(dec2.game.bestPlayers, 4, "Catan bestPlayers=4 embarqué");
assert.strictEqual(typeof dec2.game.favorite, "boolean");

// --- lowestScoreWins embarqué dans le code et appliqué à l'import ---
mem = {};
let sG = store.defaultState();
const pg = store.addPlayer(sG, "Paul");
const hg = store.addPlayer(sG, "Henri");
const golf = store.addGame(sG, { name: "Mini Golf", complexity: 1.5, lowestScoreWins: true });
const mg = store.addMatch(sG, { gameId: golf.id, date: "2025-04-01", entries: [{ playerId: pg.id, score: 12 }, { playerId: hg.id, score: 20 }] });
assert.strictEqual(mg.entries[0].rank, 1, "le plus petit score (12) gagne");
const codeG = share.encodeMatch(store.load(), mg.id);
const decG = share.decodeMatch(codeG);
assert.strictEqual(decG.game.lowestScoreWins, true, "flag embarqué dans le code");
mem = {};
let sG2 = store.defaultState();
store.addPlayer(sG2, "Paul");
store.addPlayer(sG2, "Henri");
const rG = share.importMatchCode(sG2, codeG, store);
assert.strictEqual(rG.createdGame, true);
const stG = store.load();
assert.strictEqual(stG.games[0].lowestScoreWins, true, "flag appliqué à l'import (jeu créé)");
assert.strictEqual(stG.matches[0].entries.find((e) => e.score === 12).rank, 1, "rang recalculé avec invert");
assert.strictEqual(stG.matches[0].entries.find((e) => e.score === 12).points, 15, "rang 1, pas d'historique -> 10 x 1.5");

// --- rectification : le code porte lowestScoreWins, le jeu local ne l'avait pas ---
mem = {};
let sG3 = store.defaultState();
store.addPlayer(sG3, "Paul");
store.addPlayer(sG3, "Henri");
store.addGame(sG3, { name: "Mini Golf", complexity: 1.5 }); // sans le flag
const rG2 = share.importMatchCode(sG3, codeG, store);
assert.strictEqual(rG2.createdGame, false);
assert.strictEqual(rG2.updatedGame, true, "infos rectifiées");
assert.strictEqual(store.load().games[0].lowestScoreWins, true, "flag rectifié sur le jeu existant");

console.log("share.test.js : OK (encode/decode, import multi-appareils, anti-doublon, rectification du jeu existant, bestPlayers, lowestScoreWins, recalcul, codes invalides)");
