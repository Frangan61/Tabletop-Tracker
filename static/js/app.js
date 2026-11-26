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
      let c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c = c.flat(Infinity); // autorise h("ul", null, items.map(...))
      if (Array.isArray(c)) {
        for (const cc of c) {
          if (cc == null || cc === false) continue;
          el.appendChild(typeof cc === "string" ? document.createTextNode(cc) : cc);
        }
        continue;
      }
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

  function fmtEntryResult(m, e) {
    if (m && m.coopResult) {
      return (m.coopResult === "win" ? "🏆 victoire" : "💀 défaite") + (m.teamScore != null ? " · score équipe " + m.teamScore : "");
    }
    return "score " + (e ? e.score : "?");
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

  function shareDialog(title, text) {
    const ta = h("textarea", { readonly: true, style: "width:100%;min-height:110px" });
    ta.value = text;
    const overlay = h("div", { class: "overlay" },
      h("div", { class: "dialog panel" },
        h("h2", { style: "margin-top:0", text: title }),
        ta,
        h("div", { class: "btn-row" },
          h("button", {
            text: "📋 Copier",
            onclick: async function () {
              try { await navigator.clipboard.writeText(text); this.textContent = "✅ Copié !"; }
              catch (e) { ta.focus(); ta.select(); }
            }
          }),
          h("button", { class: "secondary", text: "Fermer", onclick: function () { overlay.remove(); } })
        )
      )
    );
    document.body.appendChild(overlay);
    ta.focus();
    ta.select();
  }

  function shareButton(state, matchId) {
    return h("button", {
      class: "secondary", text: "🔗 Partager", title: "Générer un code à envoyer à un ami",
      onclick: function () {
        try {
          shareDialog("Code de la partie — copie-le et envoie-le", TTT.share.encodeMatch(state, matchId));
        } catch (e) { alert(e.message); }
      }
    });
  }

  function normText(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // Filtre "contient" insensible à la casse/accents : "c" -> tous les jeux avec un c, "cat" -> "catan"
  function filterItems(items, q) {
    const nq = normText(q).trim();
    if (!nq) return items.slice();
    return items.filter((it) => normText(it.label).includes(nq));
  }

  // Champ texte avec liste déroulante filtrée au fur et à mesure.
  // getItems() -> [{label, value, sub}] ; onPick(item) au clic ou Entrée.
  function autocomplete(input, getItems, onPick) {
    let box = null;
    function close() {
      if (box) { box.remove(); box = null; }
    }
    function render() {
      close();
      const items = filterItems(getItems(), input.value).slice(0, 12);
      if (!input.value.trim() || !items.length) return;
      box = h("div", { class: "ac-list" },
        items.map((it) =>
          h("div", {
            class: "ac-item",
            text: it.label + (it.sub ? "  ·  " + it.sub : ""),
            onclick: () => { input.value = it.label; onPick(it); close(); },
          })
        )
      );
      (input.parentNode || document.body).appendChild(box);
    }
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const items = filterItems(getItems(), input.value);
        const pick = items[0] || (input.value.trim() ? { label: input.value.trim(), value: input.value.trim() } : null);
        if (pick) { input.value = pick.label; onPick(pick); close(); e.preventDefault(); }
      } else if (e.key === "Escape") close();
    });
    input.addEventListener("blur", () => setTimeout(close, 150));
    return { close };
  }

  function debounce(fn, ms) {
    let t = null;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms || 150);
    };
  }

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function boot(page, render) {
    // Bannière visible si une erreur JS plante une page (utile sur mobile)
    window.addEventListener("error", (e) => {
      try {
        const b = h("div", {
          style: "position:fixed;top:0;left:0;right:0;background:#7a1020;color:#ffd7dc;padding:8px 12px;font:12px monospace;z-index:999;white-space:pre-wrap",
          text: "Erreur JS : " + (e.message || e.type) + " @ " + (e.filename || "").split("/").pop() + ":" + (e.lineno || "?"),
        });
        document.body.appendChild(b);
      } catch (_) {}
    });

    const rootEl = document.getElementById("root");
    const nav = h("nav", { class: "topnav" },
      h("a", { class: "brand", href: "index.html", text: "🎲 TableTop Tracker" }),
      h("a", { href: "index.html", "data-nav": "index", text: "Classement" }),
      h("a", { href: "players.html", "data-nav": "players", text: "Joueurs" }),
      h("a", { href: "games.html", "data-nav": "games", text: "Jeux" }),
      h("a", { href: "finder.html", "data-nav": "finder", text: "🎯 Trouver un jeu" }),
      h("a", { href: "tournament.html", "data-nav": "tournament", text: "🏆 Tournoi" }),
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
  root.TTT.dom = { h, clear, fmtDate, fmt1, fmtPct, rankBadge, playerDot, playerLink, gameLink, download, fmtEntryResult, shareDialog, shareButton, autocomplete, filterItems, normText };
  root.TTT.util = { daysAgoFilter, initNav, state, boot, sha256Hex, debounce };
})(typeof window !== "undefined" ? window : globalThis);
