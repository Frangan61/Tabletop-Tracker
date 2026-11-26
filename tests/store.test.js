"use strict";
const assert = require("assert");

// mock localStorage pour Node
const mem = {};
globalThis.__tttMockStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};

globalThis.TTT = {};
require("../static/js/scoring.js");
const store = require("../static/js/store.js");

let state = store.defaultState();
assert.deepStrictEqual(state.players, []);
assert.deepStrictEqual(state.scoring.rankPoints, [10, 7, 5, 3, 2, 1]);

const p1 = store.addPlayer(state, "Alice");
const p2 = store.addPlayer(state, "Bob");
const p3 = store.addPlayer(state, "Chloe");
assert.strictEqual(state.players.length, 3);
assert.ok(p1.id && p1.color);

const g = store.addGame(state, { name: "Catan", bggId: "13", complexity: 2.3, year: 1995, minPlayers: 3, maxPlayers: 4 });
assert.strictEqual(g.complexity, 2.3);

const m = store.addMatch(state, {
  gameId: g.id,
  date: "2025-03-01",
  entries: [
    { playerId: p1.id, score: 10 },
    { playerId: p2.id, score: 8 },
    { playerId: p3.id, score: 6 },
  ],
});
assert.strictEqual(m.entries.length, 3);
assert.strictEqual(m.entries[0].rank, 1);
assert.strictEqual(m.entries[0].points, 23, "10 * 2.3 = 23");
assert.strictEqual(m.entries[1].points, 16.1, "7 * 2.3 = 16.1");

// persistance : recharger depuis le "stockage"
const reloaded = store.load();
assert.strictEqual(reloaded.matches.length, 1);
assert.strictEqual(reloaded.players.length, 3);

// addMatch refuse < 2 joueurs
assert.throws(() => store.addMatch(reloaded, { gameId: g.id, entries: [{ playerId: p1.id, score: 1 }] }), /au moins 2 joueurs/);

// suppression joueur utilisé -> interdit
assert.throws(() => store.deletePlayer(reloaded, p1.id), /suppression impossible/);
store.deleteMatch(reloaded, m.id);
store.deletePlayer(reloaded, p1.id);
assert.strictEqual(store.load().players.length, 2);

// recalcul après changement de config
const s = store.load();
s.scoring.rankPoints = [20, 10, 5];
const m2 = store.addMatch(s, { gameId: g.id, date: "2025-03-02", entries: [{ playerId: p2.id, score: 9 }, { playerId: p3.id, score: 4 }] });
assert.strictEqual(m2.entries[0].points, 46, "20 * 2.3 = 46");
s.scoring.rankPoints = [10, 7, 5, 3, 2, 1];
store.recalculateAll(s);
const after = store.load();
assert.strictEqual(after.matches[0].entries[0].points, 23, "recalcul restaure 10 * 2.3");

// export / import
const json = store.exportJSON(after);
const imported = store.importJSON(json);
assert.strictEqual(imported.matches.length, after.matches.length);
assert.throws(() => store.importJSON('{"foo": 1}'), /invalide/);

const csv = store.exportCSV(after);
assert.ok(csv.startsWith("date;jeu;joueur;score;rang;points"));
assert.ok(csv.includes("Catan;Bob;9;1;23;non"), "csv: " + csv);

console.log("store.test.js : OK (tous les tests passent)");
