(function (root) {
  "use strict";

  function h(tag, attrs) {
    const el = document.createElement(tag);
    attrs = attrs || {};
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c == null || c === false) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const p = iso.slice(0, 10).split("-");
    if (p.length !== 3) return iso;
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function fmt1(n) {
    return String(Math.round((n || 0) * 10) / 10);
  }

  function fmtPct(x) {
    return Math.round((x || 0) * 100) + " %";
  }

  function rankBadge(rank) {
    const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
    return h("span", { class: "rank r" + rank, text: (medals[rank] || "") + " " + rank + (rank === 1 ? "er" : "e") });
  }

  function playerDot(p) {
    return h("span", { class: "dot", style: "background:" + (p.color || "#888") });
  }

  function playerLink(state, playerId) {
    const p = state.players.find((x) => x.id === playerId);
    if (!p) return h("span", { text: "?" });
    const a = h("a", { href: "player.html?id=" + encodeURIComponent(p.id), class: "player-link" }, playerDot(p), " " + p.name);
    return a;
  }

  function gameLink(state, gameId) {
    const g = state.games.find((x) => x.id === gameId);
    if (!g) return h("span", { text: "jeu supprimé" });
    return h("a", { href: "game.html?id=" + encodeURIComponent(g.id), text: g.name });
  }

  function daysAgoFilter(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const cutoff = d.toISOString().slice(0, 10);
    return (m) => m.date >= cutoff;
  }

  function initNav(page) {
    document.querySelectorAll(".topnav a[data-nav]").forEach((a) => {
      if (a.dataset.nav === page) a.classList.add("active");
    });
    const params = new URLSearchParams(location.search);
    const msg = params.get("msg");
    if (msg) {
      const f = document.getElementById("flash");
      if (f) {
        f.textContent = msg;
        f.classList.add("show");
        setTimeout(() => f.classList.remove("show"), 4000);
      }
    }
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }

  function state() {
    return root.TTT.store.load();
  }

  function boot(page, render) {
    const rootEl = document.getElementById("root");
    const nav = h("nav", { class: "topnav" },
      h("a", { class: "brand", href: "index.html", text: "🎲 TableTop Tracker" }),
      h("a", { href: "index.html", "data-nav": "index", text: "Classement" }),
      h("a", { href: "players.html", "data-nav": "players", text: "Joueurs" }),
      h("a", { href: "games.html", "data-nav": "games", text: "Jeux" }),
      h("a", { href: "new-match.html", class: "cta", "data-nav": "new", text: "+ Nouvelle partie" }),
      h("a", { href: "settings.html", "data-nav": "settings", text: "⚙ Paramètres" })
    );
    const flash = h("div", { id: "flash" });
    const main = h("main", { id: "app" });
    rootEl.appendChild(nav);
    rootEl.appendChild(flash);
    rootEl.appendChild(main);
    initNav(page);
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    render(main);
  }

  root.TTT = root.TTT || {};
  root.TTT.dom = { h, clear, fmtDate, fmt1, fmtPct, rankBadge, playerDot, playerLink, gameLink, download };
  root.TTT.util = { daysAgoFilter, initNav, state, boot };
})(typeof window !== "undefined" ? window : globalThis);
