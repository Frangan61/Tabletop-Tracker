"use strict";
// Smoke test : chaque page-*.js doit s'exécuter sans exception,
// d'abord avec un stockage vide, puis avec des données exemple.
const assert = require("assert");
const path = require("path");

function makeEl(tag) {
  const el = {
    tag,
    children: [],
    attrs: {},
    style: {},
    dataset: {},
    _v: "",
    classList: { add() {}, remove() {}, contains() { return false; } },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); },
    addEventListener() {},
    remove() {},
    click() {},
    querySelector() { return makeEl("div"); },
    querySelectorAll() { return []; },
    getContext() {
      return new Proxy({}, {
        get: (t, k) => {
          if (k === "measureText") return () => ({ width: 20 });
          return k in t ? t[k] : () => {};
        },
      });
    },
    scrollIntoView() {},
    focus() {},
    clientWidth: 600,
    clientHeight: 240,
    width: 0,
    height: 0,
  };
  Object.defineProperty(el, "textContent", { get() { return this._t || ""; }, set(v) { this._t = String(v); } });
  Object.defineProperty(el, "value", { get() { return this._v; }, set(v) { this._v = v; } });
  Object.defineProperty(el, "innerHTML", { get() { return ""; }, set() {} });
  Object.defineProperty(el, "className", { get() { return ""; }, set() {} });
  Object.defineProperty(el, "options", { get() { return this.children; } });
  Object.defineProperty(el, "checked", { get() { return !!this._c; }, set(v) { this._c = v; } });
  Object.defineProperty(el, "disabled", { get() { return !!this._d; }, set(v) { this._d = v; } });
  Object.defineProperty(el, "firstChild", { get() { return this.children[0]; } });
  return el;
}

const mem = {};
global.window = globalThis;
global.addEventListener = () => {};
global.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
global.document = {
  getElementById: () => makeEl("div"),
  createElement: (t) => makeEl(t),
  createTextNode: (t) => ({ text: String(t) }),
  querySelectorAll: () => [],
  body: makeEl("body"),
};
global.location = { search: "?id=P1", href: "", reload() {} };
global.requestAnimationFrame = (f) => f();
global.window.devicePixelRatio = 1;
global.alert = () => {};
global.confirm = () => true;
global.URL.createObjectURL = () => "blob:x";
global.URL.revokeObjectURL = () => {};

require("../static/js/scoring.js");
require("../static/js/store.js");
require("../static/js/stats.js");
require("../static/js/charts.js");
require("../static/js/bgg.js");
require("../static/js/app.js");

const PAGES = ["index", "players", "player", "games", "game", "finder", "new-match", "settings"];

function loadPage(page) {
  const p = path.join(__dirname, "..", "static", "js", "page-" + page + ".js");
  delete require.cache[require.resolve(p)];
  require(p);
}

// 1) stockage vide
for (const page of PAGES) loadPage(page);
console.log("smoke (vide) : OK");

// 2) données exemple : 3 joueurs, 2 jeux, 3 parties
delete mem["ttt:v1"];
const store = global.TTT.store;
const scoring = global.TTT.scoring;
let s = store.defaultState();
const alice = store.addPlayer(s, "Alice");
const bob = store.addPlayer(s, "Bob");
const chloe = store.addPlayer(s, "Chloe");
const catan = store.addGame(s, { name: "Catan", bggId: "13", complexity: 2.3, year: 1995, minPlayers: 3, maxPlayers: 4, duration: 60, tags: "Stratégie, Commerce, Négociation" });
const wingspan = store.addGame(s, { name: "Wingspan", bggId: "266192", complexity: 2.4, year: 2019, minPlayers: 1, maxPlayers: 5, duration: 50, tags: ["Animaux", "Moteur de combos", "Cartes"] });
store.addMatch(s, { gameId: catan.id, date: "2025-01-05", entries: [{ playerId: alice.id, score: 10 }, { playerId: bob.id, score: 8 }, { playerId: chloe.id, score: 6 }] });
store.addMatch(s, { gameId: catan.id, date: "2025-01-12", entries: [{ playerId: bob.id, score: 12 }, { playerId: alice.id, score: 9 }, { playerId: chloe.id, score: 9 }] });
store.addMatch(s, { gameId: wingspan.id, date: "2025-01-20", entries: [{ playerId: chloe.id, score: 87 }, { playerId: alice.id, score: 80 }, { playerId: bob.id, score: 75 }] });

for (const page of PAGES) {
  global.location.search = page === "player" ? "?id=" + alice.id : page === "game" ? "?id=" + catan.id : "";
  loadPage(page);
}
console.log("smoke (données) : OK");

// vérif rapide des stats
const st = store.load();
const stats = global.TTT.stats.playerStats(st, alice.id);
assert.strictEqual(stats.matches, 3);
assert.strictEqual(stats.wins, 1);
assert.strictEqual(stats.evolution.length, 3);
assert.ok(stats.last5 && stats.last5.avgPoints > 0);
assert.ok(stats.bestScore && stats.bestScore.score === 80);
console.log("stats Alice :", JSON.stringify({ matches: stats.matches, wins: stats.wins, total: stats.totalPoints, best: stats.bestScore }));
console.log("smoke-pages.test.js : OK (tous les tests passent)");
