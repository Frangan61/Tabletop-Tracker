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

console.log("share.test.js : OK (encode/decode, import multi-appareils, anti-doublon, recalcul, codes invalides)");
