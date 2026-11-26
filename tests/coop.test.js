"use strict";
// Jeux coopératifs (victoire/défaite commune, perf désactivée) + comparaison sur parties communes.
const assert = require("assert");

const mem = {};
globalThis.__tttMockStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
globalThis.TTT = {};
const scoring = require("../static/js/scoring.js");
const store = require("../static/js/store.js");
const stats = require("../static/js/stats.js");

let s = store.defaultState();
const paul = store.addPlayer(s, "Paul");
const alexis = store.addPlayer(s, "Alexis");
const theo = store.addPlayer(s, "Theo");
const solo = store.addPlayer(s, "Solo");
const coopGame = store.addGame(s, { name: "Pandemic", complexity: 2.5, coop: true, tags: "Cooperative Game" });
const vsGame = store.addGame(s, { name: "Catan", complexity: 2.3 });
assert.strictEqual(coopGame.coop, true);

// --- partie coop gagnée : tout le monde rang 1, perf 0, points = 10 x poids ---
const mWin = store.addMatch(s, {
  gameId: coopGame.id,
  date: "2025-01-01",
  coopResult: "win",
  teamScore: 42,
  entries: [
    { playerId: paul.id, score: 1 },
    { playerId: alexis.id, score: 1 },
    { playerId: theo.id, score: 1 },
  ],
});
assert.strictEqual(mWin.coopResult, "win");
assert.strictEqual(mWin.teamScore, 42);
mWin.entries.forEach((e) => {
  assert.strictEqual(e.rank, 1, "victoire coop -> rang 1 pour tous");
  assert.strictEqual(e.perf, 0, "pas de perf en coop");
  assert.strictEqual(e.points, 25, "10 x 2.5");
});

// --- partie coop perdue : tout le monde dernier rang ex-aequo ---
const mLoss = store.addMatch(s, {
  gameId: coopGame.id,
  date: "2025-01-02",
  coopResult: "loss",
  entries: [
    { playerId: paul.id, score: 0 },
    { playerId: alexis.id, score: 0 },
    { playerId: theo.id, score: 0 },
  ],
});
mLoss.entries.forEach((e) => {
  assert.strictEqual(e.rank, 3, "défaite coop avec 3 joueurs -> rang 3 pour tous");
  assert.strictEqual(e.points, 12.5, "5 x 2.5 (3e rang)");
});

// --- comparaison uniquement sur les parties communes aux 3 joueurs ---
// m1: paul+alexis+theo (Catan) ; m2: paul+alexis ; m3: paul+theo ; m4: alexis+theo+solo
store.addMatch(s, { gameId: vsGame.id, date: "2025-01-03", entries: [{ playerId: paul.id, score: 10 }, { playerId: alexis.id, score: 8 }, { playerId: theo.id, score: 6 }] });
store.addMatch(s, { gameId: vsGame.id, date: "2025-01-04", entries: [{ playerId: paul.id, score: 12 }, { playerId: alexis.id, score: 5 }] });
store.addMatch(s, { gameId: vsGame.id, date: "2025-01-05", entries: [{ playerId: paul.id, score: 9 }, { playerId: theo.id, score: 7 }] });
store.addMatch(s, { gameId: vsGame.id, date: "2025-01-06", entries: [{ playerId: alexis.id, score: 11 }, { playerId: theo.id, score: 4 }, { playerId: solo.id, score: 3 }] });

const st = store.load();
const ids3 = [paul.id, alexis.id, theo.id];
const cmpAll = stats.comparePlayers(st, ids3, null, "full", false);
const cmpCommon = stats.comparePlayers(st, ids3, null, "full", true);
assert.strictEqual(cmpAll[0].matches, 5, "Paul a joué 5 parties au total (2 coop + 3 Catan)");
// communes aux 3 : mWin (coop), mLoss (coop), m1 (Catan 03-01) -> 3 parties, PAS m2/m3/m4
assert.strictEqual(cmpCommon[0].matches, 3, "3 parties communes aux 3 joueurs");
assert.strictEqual(cmpCommon[1].matches, 3);
assert.strictEqual(cmpCommon[2].matches, 3);
// points communs de Paul = 25 (coop win) + 12.5 (coop loss) + 23 (Catan 03-01, rang 1, perf 0)
assert.strictEqual(cmpCommon[0].points, 60.5, "points uniquement des parties communes");
// commonFilter : la partie avec solo en plus ne compte que si les 4 sont présents
const withExtra = stats.comparePlayers(st, [paul.id, alexis.id, theo.id, solo.id], null, "full", true);
assert.strictEqual(withExtra[0].matches, 0, "aucune partie avec les 4 joueurs");
const f3 = stats.commonFilter(ids3);
assert.strictEqual(st.matches.filter(f3).length, 3, "3 parties communes aux 3 (2 coop + Catan 03-01)");

console.log("coop.test.js : OK (coop win/loss, perf off, comparaison parties communes)");
