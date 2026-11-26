"use strict";
// Nouvelles features : reset des parties, mot de passe (hash), comparaison de joueurs, top scores par jeu.
const assert = require("assert");
const crypto = require("crypto");

const mem = {};
globalThis.__tttMockStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
globalThis.TTT = {};
require("../static/js/scoring.js");
const store = require("../static/js/store.js");
const stats = require("../static/js/stats.js");

// --- mot de passe : le hash embarque dans page-settings.js doit etre sha256("2700") ---
const settingsSrc = require("fs").readFileSync(__dirname + "/../static/js/page-settings.js", "utf8");
const m = settingsSrc.match(/RESET_PASSWORD_SHA256 = "([0-9a-f]{64})"/);
assert.ok(m, "constante RESET_PASSWORD_SHA256 presente");
const expected = crypto.createHash("sha256").update("2700").digest("hex");
assert.strictEqual(m[1], expected, 'le hash embarque doit etre sha256("2700")');
assert.ok(!settingsSrc.includes('"2700"'), "le mot de passe en clair ne doit pas apparaitre dans le code");

// --- resetMatches : supprime les parties, garde joueurs/jeux ---
let s = store.defaultState();
const p1 = store.addPlayer(s, "Alice");
const p2 = store.addPlayer(s, "Bob");
const g = store.addGame(s, { name: "Catan", complexity: 2.3, tags: "Stratégie, Commerce", duration: 60 });
store.addMatch(s, { gameId: g.id, date: "2025-01-01", entries: [{ playerId: p1.id, score: 10 }, { playerId: p2.id, score: 8 }] });
store.addMatch(s, { gameId: g.id, date: "2025-01-02", entries: [{ playerId: p2.id, score: 12 }, { playerId: p1.id, score: 9 }] });
assert.strictEqual(store.load().matches.length, 2);
store.resetMatches(store.load());
const after = store.load();
assert.strictEqual(after.matches.length, 0, "toutes les parties supprimees");
assert.strictEqual(after.players.length, 2, "joueurs conserves");
assert.strictEqual(after.games.length, 1, "jeux conserves");
assert.deepStrictEqual(after.games[0].tags, ["Stratégie", "Commerce"], "tags normalises");
assert.strictEqual(after.games[0].duration, 60);

// --- comparePlayers ---
store.addMatch(after, { gameId: g.id, date: "2025-01-03", entries: [{ playerId: p1.id, score: 11 }, { playerId: p2.id, score: 7 }] });
store.addMatch(after, { gameId: g.id, date: "2025-01-04", entries: [{ playerId: p2.id, score: 13 }, { playerId: p1.id, score: 9 }] });
const cmp = stats.comparePlayers(store.load(), [p1.id, p2.id], null);
assert.strictEqual(cmp.length, 2);
assert.strictEqual(cmp[0].player.name, "Alice");
assert.strictEqual(cmp[0].matches, 2);
assert.strictEqual(cmp[0].wins, 1);
assert.ok(cmp[0].points > 0);
assert.strictEqual(cmp[0].evolution.length, 2, "courbe d'evolution");
assert.ok(cmp[0].evolution[1].y >= cmp[0].evolution[0].y, "cumul croissant");
const cmpFiltered = stats.comparePlayers(store.load(), [p1.id, p2.id], (m) => m.date >= "2025-01-04");
assert.strictEqual(cmpFiltered[0].matches, 1, "filtre de periode applique");

// --- top scores par jeu (meme agregation que page-game) ---
const all = [];
for (const mm of store.load().matches) for (const e of mm.entries) all.push({ score: e.score, playerId: e.playerId, date: mm.date });
all.sort((a, b) => b.score - a.score);
assert.deepStrictEqual(all.slice(0, 3).map((x) => x.score), [13, 11, 9], "top scores desc");

console.log("features.test.js : OK (hash mdp, resetMatches, comparePlayers, top scores)");
