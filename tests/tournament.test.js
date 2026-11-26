"use strict";
const assert = require("assert");
const tour = require("../static/js/tournament.js");

const mem = {};
globalThis.__tttMockStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
globalThis.TTT = {};
const scoring = require("../static/js/scoring.js");
const store = require("../static/js/store.js");

// --- tirage aléatoire : tout le monde est placé exactement une fois, poules équilibrées ---
const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const pools = tour.makePools(ids, 3, false, null);
assert.strictEqual(pools.length, 3);
assert.deepStrictEqual(pools.flat().sort(), ids.slice().sort(), "chaque joueur exactement une fois");
assert.deepStrictEqual(pools.map((p) => p.length).sort(), [3, 3, 3], "poules équilibrées 3/3/3");

// --- nPools clampé ---
assert.strictEqual(tour.makePools(["a", "b", "c"], 99, false, null).length, 3, "nPools min(n, ids)");

// --- seeding : le top 2 du classement est dans des poules différentes ---
const board = ids.map((id, i) => ({ playerId: id, points: 100 - i * 10 })); // a=100, b=90, c=80...
const seeded = tour.makePools(ids, 3, true, board);
assert.deepStrictEqual(seeded.flat().sort(), ids.slice().sort());
const poolOf = (id) => seeded.findIndex((p) => p.includes(id));
assert.notStrictEqual(poolOf("a"), poolOf("b"), "n°1 et n°2 pas dans la même poule");
assert.notStrictEqual(poolOf("a"), poolOf("c"), "n°1 et n°3 pas dans la même poule");
assert.strictEqual(new Set(["a", "b", "c"].map(poolOf)).size, 3, "top 3 dans 3 poules distinctes");

// --- seeding avec 8 joueurs / 4 poules : top 4 dans 4 poules différentes ---
const ids8 = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
const board8 = ids8.map((id, i) => ({ playerId: id, points: 80 - i * 10 }));
const seeded8 = tour.makePools(ids8, 4, true, board8);
const top3pools = ["p1", "p2", "p3"].map((id) => seeded8.findIndex((p) => p.includes(id)));
assert.strictEqual(new Set(top3pools).size, 3, "top 3 répartis dans 3 poules distinctes (têtes de série protégées)");
assert.notStrictEqual(seeded8.findIndex((p) => p.includes("p1")), seeded8.findIndex((p) => p.includes("p2")), "n°1 et n°2 toujours séparés");
assert.deepStrictEqual(seeded8.map((p) => p.length).sort((a, b) => a - b), [2, 2, 2, 2], "8 joueurs / 4 poules = 2 par poule");

// --- persistance des tournois ---
let s = store.defaultState();
const pl = ["x", "y", "z", "w"].map((n) => store.addPlayer(s, n));
const g = store.addGame(s, { name: "Catan", complexity: 2.3 });
const t = store.addTournament(s, { gameId: g.id, seeding: true, nPools: 2, qualifiedPerPool: 2, pools: [[pl[0].id, pl[1].id], [pl[2].id, pl[3].id]] });
let re = store.load();
assert.strictEqual(re.tournaments.length, 1);
assert.strictEqual(re.tournaments[0].pools.length, 2);
// recalculateAll conserve les tournois
store.addMatch(re, { gameId: g.id, date: "2025-01-01", entries: [{ playerId: pl[0].id, score: 5 }, { playerId: pl[1].id, score: 3 }] });
store.recalculateAll(store.load());
re = store.load();
assert.strictEqual(re.tournaments.length, 1, "recalcul conserve les tournois");
store.deleteTournament(re, t.id);
assert.strictEqual(store.load().tournaments.length, 0);

console.log("tournament.test.js : OK (aleatoire, seeding FIFA, persistance)");
