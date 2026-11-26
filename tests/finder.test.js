"use strict";
// Régression : la page "Trouver un jeu" doit rendre la liste des jeux (pas seulement le compteur).
const assert = require("assert");

function makeEl(tag) {
  const el = {
    tag, children: [], attrs: {}, style: {}, dataset: {}, _v: "",
    classList: { add() {}, remove() {}, contains() { return false; } },
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { if (Array.isArray(c) || (c && typeof c === "object" && !c.tag && !("text" in c))) throw new TypeError("appendChild: not a Node (comme un vrai navigateur)"); this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); },
    addEventListener() {}, remove() {}, click() {},
    querySelector() { return makeEl("div"); }, querySelectorAll() { return []; },
    getContext() { return new Proxy({}, { get: (t, k) => (k === "measureText" ? () => ({ width: 20 }) : (k in t ? t[k] : () => {})) }); },
    scrollIntoView() {}, focus() {}, clientWidth: 600, clientHeight: 240,
  };
  Object.defineProperty(el, "textContent", { get() { return this._t || ""; }, set(v) { this._t = String(v); } });
  Object.defineProperty(el, "value", { get() { return this._v; }, set(v) { this._v = v; } });
  Object.defineProperty(el, "innerHTML", { get() { return ""; }, set() {} });
  Object.defineProperty(el, "className", { get() { return this.attrs.class || ""; }, set(v) { this.attrs.class = v; } });
  Object.defineProperty(el, "options", { get() { return this.children; } });
  Object.defineProperty(el, "checked", { get() { return !!this._c; }, set(v) { this._c = v; } });
  Object.defineProperty(el, "disabled", { get() { return !!this._d; }, set(v) { this._d = v; } });
  Object.defineProperty(el, "firstChild", { get() { return this.children[0]; } });
  return el;
}
let lastRoot = null;
global.window = globalThis;
global.addEventListener = () => {};
global.localStorage = { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
global.document = {
  getElementById: () => (lastRoot = makeEl("div")),
  createElement: (t) => makeEl(t),
  createTextNode: (t) => ({ text: String(t), tag: "#text" }),
  querySelectorAll: () => [],
  body: makeEl("body"),
};
global.location = { search: "", href: "", reload() {} };
global.requestAnimationFrame = (f) => f();
global.alert = () => {};
global.confirm = () => true;

require("../static/js/seed-games.js");
require("../static/js/scoring.js");
require("../static/js/store.js");
require("../static/js/stats.js");
require("../static/js/charts.js");
require("../static/js/bgg.js");
require("../static/js/share.js");
require("../static/js/app.js");

const store = globalThis.TTT.store;
let s = store.load();
assert.strictEqual(s.games.length, 50, "50 jeux seedés");
store.addPlayer(s, "Paul");
store.addPlayer(s, "Henri");

require("../static/js/page-finder.js");

const main = lastRoot.children.find((c) => c.tag === "main");
const counter = main.children.find((c) => c.tag === "p" && /trouv/.test(c._t || ""));
assert.ok(counter, "compteur présent");
assert.strictEqual(counter._t, "50 jeux trouvés sur 50", "compteur: " + counter._t);
const grid = main.children.find((c) => c.attrs.class === "grid cols-2");
assert.ok(grid, "grille de résultats présente");
assert.strictEqual(grid.children.length, 50, "50 cartes de jeux rendues (pas seulement le compteur)");
const firstCard = grid.children[0];
assert.ok(firstCard.attrs.class.includes("match-card"), "ce sont des cartes");

console.log("finder.test.js : OK (compteur + 50 cartes rendues)");
