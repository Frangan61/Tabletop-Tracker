"use strict";
// h() doit aplatir les tableaux passés en enfants (sinon appendChild(tableau) -> TypeError en navigateur)
const assert = require("assert");

function makeEl(tag) {
  const el = {
    tag, children: [], attrs: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) {
      if (Array.isArray(c) || (c !== null && typeof c === "object" && !("tag" in c) && !(c instanceof String))) {
        throw new TypeError("appendChild: parameter 1 is not of type 'Node'");
      }
      this.children.push(c);
      return c;
    },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); },
    addEventListener() {},
  };
  Object.defineProperty(el, "textContent", { get() { return this._t || ""; }, set(v) { this._t = String(v); } });
  Object.defineProperty(el, "className", { get() { return this.attrs.class || ""; }, set(v) { this.attrs.class = v; } });
  Object.defineProperty(el, "firstChild", { get() { return this.children[0]; } });
  return el;
}
global.window = globalThis;
global.document = {
  createElement: (t) => makeEl(t),
  createTextNode: (t) => ({ text: String(t), tag: "#text" }),
  getElementById: () => makeEl("div"),
  querySelectorAll: () => [],
  body: makeEl("body"),
};
global.location = { search: "", href: "", protocol: "http:", reload() {} };
global.requestAnimationFrame = (f) => f();

require("../static/js/scoring.js");
require("../static/js/seed-games.js");
require("../static/js/store.js");
require("../static/js/app.js");

const { h } = TTT.dom;

// tableau d'enfants (le cas qui plantait en prod)
const ul = h("ul", null, ["a", "b"].map((x) => h("li", { text: x })));
assert.strictEqual(ul.children.length, 2, "h() aplatie les tableaux");
assert.strictEqual(ul.children[0].tag, "li");

// tableau vide, null, false, string, élément
const div = h("div", null, [], null, false, "texte", h("b", { text: "gras" }));
assert.strictEqual(div.children.length, 2, "null/false/[] ignorés, string -> text node, élément OK");
assert.strictEqual(div.children[0].tag, "#text");
assert.strictEqual(div.children[1].tag, "b");

// attributs divers
const btn = h("button", { class: "cta", text: "Go", onclick: () => {}, "data-x": "1", disabled: false });
assert.strictEqual(btn.attrs.class, "cta");
assert.strictEqual(btn.attrs["data-x"], "1");
assert.strictEqual(btn._t, "Go");

// cas réel : select rempli par map (50 jeux seedés)
global.localStorage = { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
const s = TTT.store.load();
const sel = h("select", null, h("option", { value: "", text: "choisir" }), s.games.map((g) => h("option", { value: g.id, text: g.name })));
assert.strictEqual(sel.children.length, 51, "select avec 50 jeux + placeholder");

// --- filterItems : recherche "contient", insensible casse/accents ---
const { filterItems } = TTT.dom;
const items = [{ label: "Catan" }, { label: "Carcassonne" }, { label: "Wingspan" }, { label: "Échecs" }];
assert.strictEqual(filterItems(items, "c").length, 3, "'c' -> Catan, Carcassonne, Échecs (echecs contient c)");
assert.strictEqual(filterItems(items, "CAT").length, 1, "'CAT' -> Catan seul");
assert.strictEqual(filterItems(items, "cat")[0].label, "Catan");
assert.strictEqual(filterItems(items, "ÉCH").length, 1, "accents ignorés: 'ÉCH' -> Échecs");
assert.strictEqual(filterItems(items, "").length, 4, "vide -> tout");
assert.strictEqual(filterItems(items, "zzz").length, 0);
assert.ok(typeof TTT.dom.autocomplete === "function", "autocomplete exposé");

console.log("app.test.js : OK (h(), attributs, select map, filterItems/autocomplete)");
