"use strict";
const assert = require("assert");
const scoring = require("../static/js/scoring.js");

// --- computeRanks ---
assert.deepStrictEqual(scoring.computeRanks([10, 20, 20, 5]), [3, 1, 1, 4], "ex-aequo en tete -> rangs 1,1,3,4");
assert.deepStrictEqual(scoring.computeRanks([50, 40, 30]), [1, 2, 3]);

// --- rankPointsFor ---
const cfg = scoring.DEFAULT_SCORING;
assert.strictEqual(cfg.perfMode, "percentile");
assert.strictEqual(cfg.perfCoef, 10);
assert.strictEqual(scoring.rankPointsFor(1, cfg), 10);
assert.strictEqual(scoring.rankPointsFor(6, cfg), 1);
assert.strictEqual(scoring.rankPointsFor(9, cfg), 1, "au-dela du tableau -> dernier element");

// --- historyScores : uniquement les parties precedentes du meme jeu ---
const state = {
  scoring: cfg,
  players: [{ id: "a" }, { id: "b" }, { id: "c" }],
  games: [{ id: "g1", complexity: 3 }, { id: "g2", complexity: 1 }],
  matches: [
    { id: "m0", gameId: "g1", date: "2025-01-01", createdAt: "t0", entries: [{ playerId: "a", score: 40, points: 30 }, { playerId: "b", score: 20, points: 21 }] },
    { id: "mX", gameId: "g2", date: "2025-01-02", createdAt: "t1", entries: [{ playerId: "a", score: 999 }] },
  ],
};
assert.deepStrictEqual(scoring.historyScores(state, "g1", "2025-01-10").sort((a, b) => a - b), [20, 40]);
assert.deepStrictEqual(scoring.historyScores(state, "g1", "2025-01-01"), [], "partie du meme jour exclue");
assert.deepStrictEqual(scoring.historyScores(state, "g2", "2025-01-10"), [999]);

// --- perfPoints : mode percentile (defaut) ---
const h = [20, 40];
assert.strictEqual(scoring.perfPoints(h, 50, cfg), 10, "bat 100% -> coef");
assert.strictEqual(scoring.perfPoints(h, 30, cfg), 5, "bat 50% -> coef/2");
assert.strictEqual(scoring.perfPoints(h, 40, cfg), 5, "egal au max -> p sur strictement inferieurs");
assert.strictEqual(scoring.perfPoints(h, 10, cfg), 0, "sous tout l'historique -> 0");
assert.strictEqual(scoring.perfPoints([], 50, cfg), 0, "pas d'historique -> 0");
assert.strictEqual(scoring.perfPoints(h, 50, { perfMode: "percentile", perfCoef: 4 }), 4, "coef configurable");

// --- perfPoints : mode zscore ---
const hz = [10, 20, 30]; // mu=20, sigma=sqrt(200/3)≈8.165
const cfgZ = { perfMode: "zscore", perfCoef: 10 };
assert.ok(Math.abs(scoring.perfPoints(hz, 30, cfgZ) - 10 * (10 / 8.1649658) / 3) < 1e-6, "z≈1.22 -> coef*z/3");
assert.strictEqual(scoring.perfPoints(hz, 10, cfgZ), 0, "sous la moyenne -> 0");
assert.ok(Math.abs(scoring.perfPoints([20, 20], 25, cfgZ) - 10) < 1e-9, "sigma=0 et au-dessus -> coef");
assert.strictEqual(scoring.perfPoints([20, 20], 20, cfgZ), 0, "sigma=0 et egal -> 0");
assert.ok(scoring.perfPoints([0, 10, 20, 30, 1000], 30, cfgZ) <= 10, "z clampe a 3 -> max coef");

// --- computeMatchResults : points = (rang + perf) x poids, record = info seule ---
const res = scoring.computeMatchResults(state, {
  gameId: "g1",
  date: "2025-01-10",
  entries: [
    { playerId: "a", score: 50 }, // record, p=1 -> perf 10
    { playerId: "b", score: 30 }, // p=0.5 -> perf 5
    { playerId: "c", score: 10 }, // p=0 -> perf 0
  ],
});
// poids 3 : a rang1 (10+10)*3=60 ; b rang2 (7+5)*3=36 ; c rang3 (5+0)*3=15
assert.strictEqual(res[0].rank, 1);
assert.strictEqual(res[0].points, 60);
assert.strictEqual(res[0].isRecord, true);
assert.strictEqual(res[0].perf, 10);
assert.strictEqual(res[1].rank, 2);
assert.strictEqual(res[1].points, 36);
assert.strictEqual(res[1].isRecord, false);
assert.strictEqual(res[2].rank, 3);
assert.strictEqual(res[2].points, 15);

// --- sans historique : perf = 0, points = rang x poids ---
const res0 = scoring.computeMatchResults(state, {
  gameId: "g2",
  date: "2025-01-01", // partie anterieure exclue (meme date) -> en fait mX a date 2025-01-02 >= date -> exclue
  entries: [
    { playerId: "a", score: 5 },
    { playerId: "b", score: 3 },
  ],
});
assert.strictEqual(res0[0].perf, 0);
assert.strictEqual(res0[0].points, 10, "poids g2 = 1");

// --- multiplicateur de complexite desactive ---
const cfg2 = Object.assign({}, scoring.DEFAULT_SCORING, { complexityMultiplier: false });
const state2 = { scoring: cfg2, players: [], games: [{ id: "g1", complexity: 4.8 }], matches: [] };
const res4 = scoring.computeMatchResults(state2, {
  gameId: "g1",
  date: "2025-02-01",
  entries: [{ playerId: "a", score: 5 }, { playerId: "b", score: 3 }],
});
assert.strictEqual(res4[0].points, 10, "poids ignore");

// --- leaderboard + filtre de periode ---
state.matches.push({
  id: "m1",
  gameId: "g1",
  date: "2025-01-10",
  createdAt: "t2",
  entries: res,
});
const lb = scoring.leaderboard(state);
assert.strictEqual(lb[0].playerId, "a");
assert.strictEqual(lb[0].points, 30 + 60, "cumul m0 (30) + m1 (60)");
assert.strictEqual(lb[0].rank, 1);
const onlyOld = (m) => m.date < "2025-01-05";
const lbOld = scoring.leaderboard(state, onlyOld);
assert.strictEqual(lbOld.find((r) => r.playerId === "a").points, 30, "filtre: seule l'ancienne partie compte");
assert.strictEqual(lbOld.find((r) => r.playerId === "c").points, 0);
// --- plus petit score gagne (invert=true, jeux type golf) ---
assert.deepStrictEqual(scoring.computeRanks([10, 20, 5], true), [2, 3, 1], "invert : le plus petit est rang 1");
assert.deepStrictEqual(scoring.computeRanks([7, 7, 9], true), [1, 1, 3], "invert : ex-aequo gere");

// perf invert : battre l'historique = score PLUS PETIT
assert.strictEqual(scoring.perfPoints([20, 40], 10, cfg, true), 10, "invert percentile : sous tout l'historique -> coef");
assert.strictEqual(scoring.perfPoints([20, 40], 30, cfg, true), 5, "invert percentile : bat 50% -> coef/2");
assert.strictEqual(scoring.perfPoints([20, 40], 50, cfg, true), 0, "invert percentile : au-dessus de tout -> 0");
assert.ok(scoring.perfPoints(hz, 5, cfgZ, true) > 0, "invert zscore : sous la moyenne -> bonus");
assert.strictEqual(scoring.perfPoints(hz, 50, cfgZ, true), 0, "invert zscore : au-dessus -> 0");

// match complet sur un jeu lowestScoreWins
const stateLow = {
  scoring: cfg,
  players: [{ id: "a" }, { id: "b" }],
  games: [{ id: "golf", complexity: 2, lowestScoreWins: true }],
  matches: [{ id: "m0", gameId: "golf", date: "2025-01-01", createdAt: "t0", entries: [{ playerId: "a", score: 80, points: 0 }, { playerId: "b", score: 90, points: 0 }] }],
};
const resLow = scoring.computeMatchResults(stateLow, {
  gameId: "golf",
  date: "2025-01-10",
  entries: [{ playerId: "a", score: 75 }, { playerId: "b", score: 95 }],
});
// histo [80,90] : a=75 bat les 2 -> perf 10, rang 1 -> (10+10)*2 = 40 ; b=95 rang 2, perf 0 -> 7*2 = 14
assert.strictEqual(resLow[0].rank, 1, "invert : 75 < 95 -> rang 1");
assert.strictEqual(resLow[0].points, 40);
assert.strictEqual(resLow[0].perf, 10);
assert.strictEqual(resLow[0].isRecord, true, "record = score < min histo quand invert");
assert.strictEqual(resLow[1].rank, 2);
assert.strictEqual(resLow[1].points, 14);
assert.strictEqual(resLow[1].isRecord, false);

// --- categoryFilter accepte une chaine, "all", un tableau, ou un tableau vide ---
const stateCats = {
  games: [
    { id: "gv", complexity: 1 },
    { id: "gd", complexity: 1, duel: true },
    { id: "gc", complexity: 1, coop: true },
    { id: "g2", complexity: 1, coop: true, duel: true },
  ],
  matches: [{ gameId: "gv" }, { gameId: "gd" }, { gameId: "gc" }, { gameId: "g2" }],
};
assert.deepStrictEqual(stateCats.matches.filter(scoring.categoryFilter(stateCats, ["versus", "duel"])).map((m) => m.gameId), ["gv", "gd"], "tableau de 2 categories");
assert.deepStrictEqual(stateCats.matches.filter(scoring.categoryFilter(stateCats, ["coop", "duo"])).map((m) => m.gameId), ["gc", "g2"]);
assert.strictEqual(scoring.categoryFilter(stateCats, []), null, "tableau vide = tout");
assert.strictEqual(scoring.categoryFilter(stateCats, "all"), null);
assert.deepStrictEqual(stateCats.matches.filter(scoring.categoryFilter(stateCats, "coop")).map((m) => m.gameId), ["gc"], "chaine simple toujours acceptee");

console.log("scoring.test.js : OK (tous les tests passent)");
