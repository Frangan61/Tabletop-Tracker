/* TableTop Tracker — service worker PWA.
   Stratégie : cache-first pour l'app shell (fonctionne hors-ligne),
   réseau uniquement pour /api/* (proxy BGG ; l'UI gère déjà l'erreur offline). */
"use strict";

const CACHE = "ttt-v1";
const SHELL = [
  "./",
  "index.html",
  "players.html",
  "player.html",
  "games.html",
  "game.html",
  "new-match.html",
  "settings.html",
  "styles.css",
  "manifest.webmanifest",
  "js/scoring.js",
  "js/store.js",
  "js/stats.js",
  "js/charts.js",
  "js/bgg.js",
  "js/app.js",
  "js/page-index.js",
  "js/page-players.js",
  "js/page-player.js",
  "js/page-games.js",
  "js/page-game.js",
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request)
        .then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => caches.match("index.html"));
    })
  );
});
