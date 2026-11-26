"use strict";
const assert = require("assert");
const scoring = require("../static/js/scoring.js");

// --- computeRanks ---
assert.deepStrictEqual(scoring.computeRanks([10, 20, 20, 5]), [3, 1, 1, 4], "ex-aequo en tete -> rangs 1,1,3,4");
assert.deepStrictEqual(scoring.computeRanks([50, 40, 30]), [1, 2, 3]);
assert.deepStrictEqual(scoring.computeRanks([1, 2, 3, 4, 5, 6, 7]), [7, 6, 5, 4, 3, 2, 1]);

// --- rankPointsFor ---
const cfg = scoring.DEFAULT_SCORING;
assert.strictEqual(scoring.rankPointsFor(1, cfg), 10);
assert.strictEqual(scoring.rankPointsFor(2, cfg), 7);
assert.strictEqual(scoring.rankPointsFor(3, cfg), 5);
assert.strictEqual(scoring.rankPointsFor(6, cfg), 1);
assert.strictEqual(scoring.rankPointsFor(9, cfg), 1, "au-delà du tableau -> dernier élément");

// --- computeMatchResults : pondération par le poids BGG ---
const state = {
  scoring: scoring.DEFAULT_SCORING,
  players: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
  games: [{ id: "g1", complexity: 3 }],
  matches: [],
};
const res = scoring.computeMatchResults(state, {
  gameId: "g1",
  date: "2025-01-10",
  entries: [
    { playerId: "a", score: 42 },
    { playerId: "b", score: 30 },
    { playerId: "c", score: 30 },
    { playerId: "d", score: 10 },
  ],
});
// poids 3 : 1er = 10*3=30, 2e ex-aequo = 7*3=21, 4e = 3*3=9
assert.strictEqual(res[0].rank, 1);
assert.strictEqual(res[0].points, 30);
assert.strictEqual(res[1].rank, 2);
assert.strictEqual(res[1].points, 21);
assert.strictEqual(res[2].rank, 2, "ex-aequo même rang");
assert.strictEqual(res[3].rank, 4);
assert.strictEqual(res[3].points, 9);
assert.ok(res.every((e) => !e.isRecord), "pas de bonus record à la première partie");

// --- bonus record perso sur le jeu ---
state.matches.push({
  id: "m0",
  gameId: "g1",
  date: "2025-01-01",
  createdAt: "2025-01-01T10:00:00Z",
  entries: [
    { playerId: "a", score: 40, rank: 1, points: 30, isRecord: false },
    { playerId: "b", score: 20, rank: 2, points: 21, isRecord: false },
  ],
});
const res2 = scoring.computeMatchResults(state, {
  gameId: "g1",
  date: "2025-01-10",
  entries: [
    { playerId: "a", score: 50 }, // > 40 -> record
    { playerId: "b", score: 45 }, // > 20 -> record
  ],
});
// poids 3 : 1er 10*3=30 + bonus 5*3=15 -> 45 ; 2e 7*3=21 + 15 = 36
assert.strictEqual(res2[0].points, 45);
assert.strictEqual(res2[0].isRecord, true);
assert.strictEqual(res2[1].points, 36);
assert.strictEqual(res2[1].isRecord, true);
state.matches.push({
  id: "m1",
  gameId: "g1",
  date: "2025-01-10",
  createdAt: "2025-01-10T10:00:00Z",
  entries: res2,
});

const res3 = scoring.computeMatchResults(state, {
  gameId: "g1",
  date: "2025-01-10",
  entries: [
    { playerId: "a", score: 41 }, // > 40 -> record (bat de peu)
    { playerId: "b", score: 10 }, // < 45 -> pas record
  ],
});
assert.strictEqual(res3[0].isRecord, true);
assert.strictEqual(res3[1].isRecord, false);
assert.strictEqual(res3[1].points, 21);

// --- sans multiplicateur de complexité ---
const cfg2 = Object.assign({}, scoring.DEFAULT_SCORING, { complexityMultiplier: false });
const state2 = { scoring: cfg2, players: [], games: [{ id: "g1", complexity: 4.8 }], matches: [] };
const res4 = scoring.computeMatchResults(state2, {
  gameId: "g1",
  date: "2025-02-01",
  entries: [
    { playerId: "a", score: 5 },
    { playerId: "b", score: 3 },
  ],
});
assert.strictEqual(res4[0].points, 10, "poids ignoré");
assert.strictEqual(res4[1].points, 7);

// --- leaderboard ---
const lb = scoring.leaderboard(state);
assert.strictEqual(lb[0].playerId, "a");
assert.strictEqual(lb[0].points, 30 + 45);
assert.strictEqual(lb[0].rank, 1);
assert.strictEqual(lb[1].playerId, "b");
assert.strictEqual(lb[1].rank, 2);

// --- filtre de période ---
const onlyOld = (m) => m.date < "2025-01-05";
const lbOld = scoring.leaderboard(state, onlyOld);
assert.strictEqual(lbOld.find((r) => r.playerId === "a").points, 30, "filtre 30 points de l'ancienne partie");
assert.strictEqual(lbOld.find((r) => r.playerId === "c").points, 0);

console.log("scoring.test.js : OK (" + "tous les tests passent)");
