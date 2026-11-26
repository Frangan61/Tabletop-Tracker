(function () {
  "use strict";
  const { h, clear, fmtDate, fmt1, playerDot, gameLink } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("tournament", function (main) {
    main.appendChild(h("h1", { text: "🏆 Tournoi" }));
    const s = state();

    if (!s.games.length || s.players.length < 4) {
      main.appendChild(h("div", { class: "empty" },
        h("p", { text: "Il faut au moins un jeu et 4 joueurs pour lancer un tournoi." }),
        h("p", null, h("a", { href: "games.html", text: "Ajouter un jeu" }), " · ", h("a", { href: "players.html", text: "Ajouter des joueurs" }))
      ));
      return;
    }

    const board = TTT.scoring.leaderboard(s);
    const ptsOf = (id) => {
      const r = board.find((x) => x.playerId === id);
      return r ? r.points : 0;
    };

    const gameSel = h("select", { id: "t-game" },
      s.games.map((g) => h("option", { value: g.id, text: g.name + " (poids " + g.complexity + ")" }))
    );
    const nPoolsSel = h("select", { id: "t-pools" },
      h("option", { value: "auto", text: "Auto (√ du nb de joueurs)" }),
      [2, 3, 4, 5, 6].map((n) => h("option", { value: String(n), text: n + " poules" }))
    );
    const qualSel = h("select", { id: "t-qual" },
      [1, 2, 3].map((n) => h("option", { value: String(n), text: n + " qualifié" + (n > 1 ? "s" : "") + " par poule", selected: n === 2 }))
    );
    const seedingCb = h("input", { id: "t-seeding", type: "checkbox", checked: true });

    const playerBoxes = new Map();
    const playerList = h("div", { class: "grid cols-2" });
    s.players.forEach((p) => {
      const cb = h("input", { type: "checkbox", checked: true });
      cb.addEventListener("change", updateCount);
      playerBoxes.set(p.id, cb);
      playerList.appendChild(h("label", { class: "tag-toggle" }, cb, " ", playerDot(p), " " + p.name,
        h("span", { class: "muted small", text: " · " + fmt1(ptsOf(p.id)) + " pts (#" + (board.find((r) => r.playerId === p.id) || { rank: "?" }).rank + ")" })));
    });
    const countEl = h("span", { class: "muted small" });
    function updateCount() {
      const n = [...playerBoxes.values()].filter((c) => c.checked).length;
      countEl.textContent = n + " joueur(s) sélectionné(s)";
    }
    updateCount();

    main.appendChild(h("div", { class: "panel" },
      h("div", { class: "grid cols-3", style: "grid-template-columns: 2fr 1fr 1fr" },
        h("div", null, h("label", { for: "t-game", text: "Jeu du tournoi" }), gameSel),
        h("div", null, h("label", { for: "t-pools", text: "Poules" }), nPoolsSel),
        h("div", null, h("label", { for: "t-qual", text: "Qualifiés / poule" }), qualSel)
      ),
      h("div", null, h("label", { text: "Participants" }), playerList, " ", countEl),
      h("div", null,
        h("label", { class: "tag-toggle", style: "display:inline-flex" }, seedingCb, " Têtes de série selon le classement (les forts répartis en chapeaux, ils ne se retrouvent qu'en phase finale)"),
        h("div", { class: "muted small", text: "Sans cette option : tirage 100 % aléatoire." })
      ),
      h("div", { class: "btn-row" },
        h("button", {
          text: "🎲 Générer les poules",
          onclick: function () {
            const ids = [...playerBoxes.entries()].filter(([, c]) => c.checked).map(([id]) => id);
            if (ids.length < 4) { alert("Sélectionne au moins 4 joueurs."); return; }
            let nPools = nPoolsSel.value === "auto" ? Math.max(2, Math.round(Math.sqrt(ids.length))) : parseInt(nPoolsSel.value, 10);
            current = TTT.tournament.makePools(ids, nPools, seedingCb.checked, board);
            renderPools();
          }
        }),
        h("a", { class: "btn secondary", href: "new-match.html?game=" + gameSel.value, id: "t-play", text: "▶ Nouvelle partie (ce jeu)" })
      )
    ));

    gameSel.addEventListener("change", function () {
      const a = main.querySelector("#t-play");
      if (a) a.setAttribute("href", "new-match.html?game=" + gameSel.value);
    });

    let current = null;
    const poolsPanel = h("div", null);
    main.appendChild(poolsPanel);

    function renderPools() {
      clear(poolsPanel);
      if (!current) return;
      const letters = "ABCDEFGH";
      const grid = h("div", { class: "grid cols-2" });
      current.forEach((pool, i) => {
        const card = h("div", { class: "panel match-card" },
          h("div", { class: "head" }, h("span", { class: "title", text: "Poule " + (letters[i] || i + 1) }), h("span", { class: "muted small", text: pool.length + " joueurs · " + qualSel.value + " qualifié(s)" })),
          h("ul", null, pool.map((pid) => {
            const p = s.players.find((x) => x.id === pid);
            const r = board.find((x) => x.playerId === pid);
            return h("li", null, h("span", null, playerDot(p), " ", h("a", { class: "player-link", href: "player.html?id=" + encodeURIComponent(pid), text: p ? p.name : "?" })), h("span", { class: "muted small", text: "#" + (r ? r.rank : "?") + " · " + fmt1(ptsOf(pid)) + " pts" }));
          }))
        );
        grid.appendChild(card);
      });
      poolsPanel.appendChild(grid);
      poolsPanel.appendChild(h("div", { class: "btn-row" },
        h("button", { class: "secondary", text: "🔀 Retirer au sort", onclick: () => { const ids = current.flat(); current = TTT.tournament.makePools(ids, current.length, seedingCb.checked, board); renderPools(); } }),
        h("button", {
          text: "💾 Enregistrer ce tournoi",
          onclick: function () {
            const st = state();
            TTT.store.addTournament(st, { gameId: gameSel.value, seeding: seedingCb.checked, nPools: current.length, qualifiedPerPool: parseInt(qualSel.value, 10), pools: current });
            alert("Tournoi enregistré.");
            renderHistory();
          }
        })
      ));
    }

    main.appendChild(h("h2", { text: "Historique des tournois" }));
    const histPanel = h("div", { class: "panel" });
    main.appendChild(histPanel);
    function renderHistory() {
      clear(histPanel);
      const st = state();
      if (!st.tournaments.length) {
        histPanel.appendChild(h("p", { class: "muted", text: "Aucun tournoi enregistré." }));
        return;
      }
      st.tournaments.slice().reverse().forEach((t) => {
        const g = st.games.find((x) => x.id === t.gameId);
        const letters = "ABCDEFGH";
        histPanel.appendChild(h("div", { class: "match-card", style: "margin-bottom:14px" },
          h("div", { class: "head" },
            h("span", { class: "title", text: (g ? g.name : "?") + " — " + fmtDate(t.createdAt.slice(0, 10)) }),
            h("span", { class: "muted small", text: t.seeding ? "🎯 têtes de série" : "🎲 aléatoire" }),
            h("button", { class: "secondary", text: "Supprimer", onclick: () => { TTT.store.deleteTournament(state(), t.id); renderHistory(); } })
          ),
          h("div", { class: "small" }, t.pools.map((pool, i) => h("div", null, h("b", { text: "Poule " + (letters[i] || i + 1) + " : " }), pool.map((pid) => { const p = st.players.find((x) => x.id === pid); return (p ? p.name : "?") + " "; }).join("· ")))),
          h("div", { class: "muted small", text: t.nPools + " poules · " + t.qualifiedPerPool + " qualifié(s)/poule" })
        ));
      });
    }
    renderHistory();
  });
})();
