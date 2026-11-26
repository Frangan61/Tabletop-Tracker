"use strict";
// Vérifie la cohérence PWA : manifest valide, icônes présentes,
// app shell du service worker complet, manifest lié dans chaque page.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const STATIC = path.join(__dirname, "..", "static");

const manifest = JSON.parse(fs.readFileSync(path.join(STATIC, "manifest.webmanifest"), "utf8"));
assert.ok(manifest.name && manifest.short_name && manifest.start_url, "manifest: champs requis");
assert.strictEqual(manifest.display, "standalone");
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "manifest: au moins 2 icônes");
for (const icon of manifest.icons) {
  assert.ok(fs.existsSync(path.join(STATIC, icon.src)), "icône manquante: " + icon.src);
}

const sw = fs.readFileSync(path.join(STATIC, "sw.js"), "utf8");
assert.ok(/const CACHE = "ttt-v\d+"/.test(sw), "sw.js doit versionner son cache (ttt-vN)");
assert.ok(sw.includes("fetch(event.request)"), "sw.js doit faire du network-first pour les pages/scripts");
const shellMatch = sw.match(/const SHELL = \[([\s\S]*?)\];/);
assert.ok(shellMatch, "SHELL introuvable dans sw.js");
const shell = [...shellMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
assert.ok(shell.length >= 10, "app shell trop petit");
for (const f of shell) {
  assert.ok(fs.existsSync(path.join(STATIC, f)), "fichier du SHELL manquant: " + f);
}
assert.ok(sw.includes("/api/"), "sw.js doit laisser passer /api/");

for (const page of fs.readdirSync(STATIC).filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(STATIC, page), "utf8");
  assert.ok(html.includes('rel="manifest"'), page + " ne lie pas le manifest");
  assert.ok(html.includes('name="viewport"'), page + " sans viewport");
}

const appjs = fs.readFileSync(path.join(STATIC, "js", "app.js"), "utf8");
assert.ok(appjs.includes("serviceWorker.register"), "app.js n'enregistre pas le service worker");

// --- cache-busting cohérent : ?v=N identique partout, N = version du SW, fichiers existants ---
const swVersion = sw.match(/const CACHE = "ttt-v(\d+)"/)[1];
for (const page of fs.readdirSync(STATIC).filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(STATIC, page), "utf8");
  const vs = [...html.matchAll(/\?v=(\d+)"/g)].map((m) => m[1]);
  assert.ok(vs.length >= 10, page + " : assets versionnés (?v=)");
  assert.ok(vs.every((v) => v === swVersion), page + " : ?v=" + vs[0] + " == sw ttt-v" + swVersion);
  for (const m of html.matchAll(/src="(js\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(STATIC, m[1].split("?")[0])), page + " : " + m[1] + " existe");
  }
}

console.log("pwa.test.js : OK (" + shell.length + " fichiers dans l'app shell, " + manifest.icons.length + " icônes)");
