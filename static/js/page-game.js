(function () {
  "use strict";
  const { h, fmtDate, fmt1, rankBadge, playerLink, fmtEntryResult, shareButton, autocomplete, filterItems } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("games", function (main) {
    const id = new URLSearchParams(location.search).get("id");
    const s = state();
    const g = s.games.find((x) => x.id === id);
    if (!g) {
      main.appendChild(h("div", { class: "empty" }, h("p", { text: "Jeu introuvable. " }, h("a", { href: "games.html", text: "Retour aux jeux" }))));
      return;
    }

    const favBtn = h("button", {
      class: "fav-star", text: g.favorite ? "⭐" : "☆", title: g.favorite ? "Retirer des favoris" : "Mettre en favori",
      onclick: function () {
        TTT.store.updateGame(state(), g.id, { favorite: !g.favorite });
        location.reload();
      },
    });
    const headChildren = [
      favBtn,
      h("div", null,
        h("h1", { style: "margin:0 0 6px", text: g.name }),
        h("div", { class: "muted" },
          h("span", { class: "weight", text: "Poids BGG : " + g.complexity + " / 5" }),
          "  ·  " + (function () { const c = TTT.scoring.catOf(g); return c === "duel" ? "🏓 duel 1v1  ·  " : c === "coop" ? "🤝 coopératif  ·  " : c === "duo" ? "👥 duo  ·  " : "⚔️ compétitif  ·  "; })() + (g.bestPlayers ? "👍 meilleur à " + g.bestPlayers + " joueurs  ·  " : "") + (g.lowestScoreWins ? "🏌️ le plus petit score gagne  ·  " : "") + (g.year ? "Année " + g.year + "  ·  " : "") + (g.duration ? "⏱ " + g.duration + " min  ·  " : "") + (g.minPlayers && g.maxPlayers ? "Joueurs " + g.minPlayers + "–" + g.maxPlayers : ""),
          g.bggId ? "  ·  " + h("a", { href: "https://boardgamegeek.com/boardgame/" + g.bggId, target: "_blank", rel: "noopener", text: "Voir sur BGG ↗" }) : null
        ),
        (g.tags || []).length ? h("div", { class: "tag-cloud" }, g.tags.map((t) => h("span", { class: "chip", text: t }))) : null
      )
    ];
    if (g.image) headChildren.unshift(h("img", { src: g.image, alt: g.name }));
    main.appendChild(h("div", { class: "panel game-head" }, headChildren));

    const gameMatches = s.matches.filter((m) => m.gameId === g.id).sort((a, b) => (a.date < b.date ? 1 : -1));

    main.appendChild(h("h2", { text: "Classement sur ce jeu" }));
    const boardPanel = h("div", { class: "panel" });
    main.appendChild(boardPanel);
    if (!gameMatches.length) {
      boardPanel.appendChild(h("p", { class: "muted", text: "Aucune partie sur ce jeu." }));
    } else {
      const rows = TTT.scoring.leaderboard(s, (m) => m.gameId === g.id);
      const t = h("table", null,
        h("tr", null, h("th", { text: "Rang" }), h("th", { text: "Joueur" }), h("th", { class: "num", text: "Points" }), h("th", { class: "num", text: "Parties" }), h("th", { class: "num", text: "Victoires" }))
      );
      rows.filter((r) => r.matches > 0).forEach((r) => {
        t.appendChild(h("tr", null,
          h("td", null, rankBadge(r.rank)),
          h("td", null, playerLink(s, r.playerId)),
          h("td", { class: "num", text: fmt1(r.points) }),
          h("td", { class: "num", text: String(r.matches) }),
          h("td", { class: "num", text: String(r.wins) })
        ));
      });
      boardPanel.appendChild(t);
    }

    // --- Tags éditables + favori ---
    main.appendChild(h("h2", { text: "🏷 Tags & favori" }));
    const allTags = [...new Set(s.games.flatMap((x) => x.tags || []))].sort();
    const tagInput = h("input", { id: "gtag-add", type: "text", placeholder: "Ajouter un tag… (autocomplétion ou nouveau)", autocomplete: "off" });
    const tagWrap = h("div", { style: "position:relative;max-width:340px" }, tagInput);
    function addTag(t) {
      t = String(t || "").trim();
      if (!t) return;
      const st = state();
      const gg = st.games.find((x) => x.id === g.id);
      const tags = [...(gg.tags || [])];
      if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
        tags.push(t);
        TTT.store.updateGame(st, g.id, { tags });
      }
      location.reload();
    }
    const tagItems = () =>
      filterItems(allTags.map((t) => ({ label: t, value: t })), tagInput.value)
        .filter((it) => !(g.tags || []).map((x) => x.toLowerCase()).includes(it.label.toLowerCase()));
    autocomplete(tagInput, tagItems, (it) => addTag(it.value));

    main.appendChild(h("div", { class: "panel" },
      h("div", { class: "tag-cloud" }, (g.tags || []).length
        ? g.tags.map((t) => h("span", { class: "chip" }, t + " ", h("button", {
            class: "fav-star", text: "✕", style: "font-size:11px;padding:0 2px",
            onclick: function () {
              const st = state();
              const gg = st.games.find((x) => x.id === g.id);
              TTT.store.updateGame(st, g.id, { tags: (gg.tags || []).filter((x) => x !== t) });
              location.reload();
            },
          })))
        : h("span", { class: "muted small", text: "Aucun tag pour l'instant." })),
      tagWrap
    ));

    // --- Édition des infos du jeu (nom, poids, durée, joueurs, mode… même après création) ---
    main.appendChild(h("h2", { text: "✏️ Modifier les infos du jeu" }));
    const eName = h("input", { id: "e-name", type: "text", value: g.name });
    const eBgg = h("input", { id: "e-bgg", type: "text", placeholder: "ex: 13", value: g.bggId || "" });
    const eComplexity = h("input", { id: "e-complexity", type: "number", min: "1", max: "5", step: "0.1", value: String(g.complexity) });
    const eYear = h("input", { id: "e-year", type: "number", min: "1900", max: "2100", placeholder: "Année", value: g.year || "" });
    const eMin = h("input", { id: "e-min", type: "number", min: "1", max: "20", placeholder: "Min", value: g.minPlayers || "" });
    const eMax = h("input", { id: "e-max", type: "number", min: "1", max: "20", placeholder: "Max", value: g.maxPlayers || "" });
    const eDuration = h("input", { id: "e-duration", type: "number", min: "5", max: "600", step: "5", placeholder: "Durée moy. (min)", value: g.duration || "" });
    const eBest = h("input", { id: "e-best", type: "number", min: "1", max: "20", placeholder: "Meilleur à (nb joueurs)", value: g.bestPlayers || "" });
    const eImg = h("input", { id: "e-img", type: "text", placeholder: "URL de l'image (optionnel)", value: g.image || "" });
    const eMode = h("select", { id: "e-mode" },
      h("option", { value: "versus", text: "⚔️ Compétitif — scores individuels" }),
      h("option", { value: "duel", text: "🏓 Duel 1v1 — strictement 2 joueurs" }),
      h("option", { value: "coop", text: "🤝 Coopératif — victoire/défaite commune" }),
      h("option", { value: "duo", text: "👥 Duo — coopératif, strictement 2 joueurs" })
    );
    eMode.value = TTT.scoring.catOf(g);
    const eLow = h("input", { id: "e-low", type: "checkbox" });
    eLow.checked = !!g.lowestScoreWins;
    main.appendChild(h("div", { class: "panel" },
      h("div", null, h("label", { for: "e-name", text: "Nom *" }), eName),
      h("div", { class: "grid cols-4" },
        h("div", null, h("label", { for: "e-complexity", text: "Complexité BGG (poids 1–5) *" }), eComplexity),
        h("div", null, h("label", { for: "e-year", text: "Année" }), eYear),
        h("div", null, h("label", { for: "e-bgg", text: "BGG id" }), eBgg),
        h("div", null, h("label", { for: "e-img", text: "Image (URL)" }), eImg)
      ),
      h("div", { class: "grid cols-4" },
        h("div", null, h("label", { for: "e-min", text: "Joueurs min" }), eMin),
        h("div", null, h("label", { for: "e-max", text: "Joueurs max" }), eMax),
        h("div", null, h("label", { for: "e-duration", text: "Durée moy. (min)" }), eDuration),
        h("div", null, h("label", { for: "e-best", text: "👍 Meilleur à (nb joueurs)" }), eBest)
      ),
      h("div", null, h("label", { for: "e-mode", text: "Type de jeu (catégorie de classement)" }), eMode),
      h("div", null, h("label", { style: "display:inline-flex;gap:6px;align-items:center;cursor:pointer" }, eLow, " 🏌️ Le plus petit score gagne (golf, fléchettes, etc.)")),
      h("div", { class: "btn-row" }, h("button", {
        text: "Enregistrer les modifications",
        onclick: function () {
          const name = eName.value.trim();
          if (!name) { alert("Le nom du jeu est obligatoire."); return; }
          const mode = eMode.value;
          TTT.store.updateGame(state(), g.id, {
            name: name,
            bggId: eBgg.value.trim() || null,
            complexity: parseFloat(eComplexity.value) || 1,
            year: eYear.value ? parseInt(eYear.value, 10) : null,
            minPlayers: eMin.value ? parseInt(eMin.value, 10) : null,
            maxPlayers: eMax.value ? parseInt(eMax.value, 10) : null,
            duration: eDuration.value ? parseInt(eDuration.value, 10) : null,
            bestPlayers: eBest.value ? parseInt(eBest.value, 10) : null,
            image: eImg.value.trim() || null,
            coop: mode === "coop" || mode === "duo",
            duel: mode === "duel" || mode === "duo",
            lowestScoreWins: eLow.checked,
          });
          // poids / mode / règle « petit score » modifiés -> on recalcule toutes les parties
          TTT.store.recalculateAll(state());
          location.href = "game.html?id=" + encodeURIComponent(g.id) + "&msg=" + encodeURIComponent("Jeu « " + name + " » mis à jour (parties recalculées).");
        }
      }))
    ));

    main.appendChild(h("h2", { text: g.lowestScoreWins ? "🏆 Top 10 — le plus petit score gagne 🏌️" : "🏆 Top 10 des scores — tous joueurs confondus" }));
    const topPanel = h("div", { class: "panel" });
    main.appendChild(topPanel);
    if (g.coop) {
      // Jeu coopératif : top 10 des meilleurs scores d'équipe
      const team = gameMatches.filter((m) => m.teamScore != null)
        .map((m) => ({ teamScore: m.teamScore, date: m.date, win: m.coopResult === "win", players: m.entries.map((e) => e.playerId) }))
        .sort((a, b) => b.teamScore - a.teamScore || a.date.localeCompare(b.date));
      if (!team.length) {
        topPanel.appendChild(h("p", { class: "muted", text: "Aucun score d'équipe enregistré." }));
      } else {
        const tt = h("table", null,
          h("tr", null, h("th", { text: "#" }), h("th", { text: "Équipe" }), h("th", { class: "num", text: "Score équipe" }), h("th", { text: "Résultat" }), h("th", { text: "Date" }))
        );
        team.slice(0, 10).forEach((t, i) => {
          tt.appendChild(h("tr", null,
            h("td", null, i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1)),
            h("td", null, t.players.map((pid, j) => h("span", null, (j ? " · " : ""), playerLink(s, pid)))),
            h("td", { class: "num", text: String(t.teamScore) }),
            h("td", { text: t.win ? "🏆" : "💀" }),
            h("td", { text: fmtDate(t.date) })
          ));
        });
        topPanel.appendChild(tt);
      }
    } else {
      const all = [];
      for (const m of gameMatches) {
        for (const e of m.entries) all.push({ playerId: e.playerId, score: e.score, points: e.points, date: m.date });
      }
      const low = !!g.lowestScoreWins;
      all.sort((a, b) => (low ? a.score - b.score : b.score - a.score) || a.date.localeCompare(b.date));
      if (!all.length) {
        topPanel.appendChild(h("p", { class: "muted", text: "Aucune partie sur ce jeu." }));
      } else {
        const tt = h("table", null,
          h("tr", null, h("th", { text: "#" }), h("th", { text: "Joueur" }), h("th", { class: "num", text: "Score" }), h("th", { text: "Date" }), h("th", { class: "num", text: "Points" }))
        );
        all.slice(0, 10).forEach((e, i) => {
          tt.appendChild(h("tr", null,
            h("td", null, i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1)),
            h("td", null, playerLink(s, e.playerId)),
            h("td", { class: "num", text: String(e.score) }),
            h("td", { text: fmtDate(e.date) }),
            h("td", { class: "num", text: fmt1(e.points) })
          ));
        });
        topPanel.appendChild(tt);
      }
    }

    main.appendChild(h("h2", { text: "Historique des parties (" + gameMatches.length + ")" }));
    if (!gameMatches.length) {
      main.appendChild(h("p", { class: "muted", text: "—" }));
    } else {
      const t = h("table", null,
        h("tr", null, h("th", { text: "Date" }), h("th", { text: "Résultats (rang · joueur · score · points)" }))
      );
      gameMatches.forEach((m) => {
        const entries = m.entries.slice().sort((a, b) => a.rank - b.rank);
        t.appendChild(h("tr", null,
          h("td", { text: fmtDate(m.date), style: "white-space:nowrap" }, " ", shareButton(s, m.id)),
          h("td", null, entries.map((e) => {
            const p = s.players.find((x) => x.id === e.playerId);
            return h("div", { class: "small" }, rankBadge(e.rank), " ", h("b", { text: p ? p.name : "?" }), h("span", { class: "muted", text: " — " + fmtEntryResult(m, e) + " · " + fmt1(e.points) + " pts" + (e.isRecord ? " ★" : "") }));
          }))
        ));
      });
      main.appendChild(h("div", { class: "panel" }, t));
    }
  });
})();
