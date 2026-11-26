(function (root) {
  "use strict";

  async function search(query) {
    const r = await fetch("/api/bgg/search?q=" + encodeURIComponent(query));
    if (!r.ok) throw new Error("Recherche BGG indisponible (" + r.status + ")");
    return r.json();
  }

  async function thing(id) {
    const r = await fetch("/api/bgg/thing?id=" + encodeURIComponent(id));
    if (!r.ok) throw new Error("Fiche BGG indisponible (" + r.status + ")");
    return r.json();
  }

  root.TTT = root.TTT || {};
  root.TTT.bgg = { search, thing };
})(typeof window !== "undefined" ? window : globalThis);
