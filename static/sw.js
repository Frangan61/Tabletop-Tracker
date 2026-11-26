/* TableTop Tracker — service worker PWA.
   - Pages/JS/CSS/manifest : network-first (toujours la version la plus récente
     quand le serveur tourne, cache en secours hors-ligne).
   - Icônes/images : cache-first.
   - /api/* (proxy BGG) : réseau uniquement, jamais en cache. */
"use strict";

const CACHE = "ttt-v5";
const SHELL = [
  "./",
  "index.html",
  "players.html",
  "player.html",
  "games.html",
  "game.html",
  "finder.html",
  "tournament.html",
  "new-match.html",
  "settings.html",
  "styles.css",
  "manifest.webmanifest",
  "js/scoring.js",
  "js/store.js",
  "js/stats.js",
  "js/charts.js",
  "js/bgg.js",
  "js/tournament.js",
  "js/app.js",
  "js/page-index.js",
  "js/page-players.js",
  "js/page-player.js",
  "js/page-games.js",
  "js/page-game.js",
  "js/page-finder.js",
  "js/page-tournament.js",
  "js/page-new-match.js",
  "js/page-settings.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(request, resp) {
  if (resp && resp.ok) {
    const copy = resp.clone();
    caches.open(CACHE).then((c) => c.put(request, copy));
  }
  return resp;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // BGG : réseau uniquement

  const isDoc = url.pathname === "/" || /\.(html|js|css|webmanifest)$/.test(url.pathname);
  if (isDoc) {
    // network-first : fraîcheur garantie quand le serveur répond
    event.respondWith(
      fetch(event.request)
        .then((resp) => putInCache(event.request, resp))
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match("index.html")))
    );
  } else {
    // assets (icônes, images) : cache-first
    event.respondWith(
      caches.match(event.request).then(
        (hit) => hit || fetch(event.request).then((resp) => putInCache(event.request, resp))
      )
    );
  }
});
