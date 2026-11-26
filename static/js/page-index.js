(function () {
  "use strict";
  const { h, clear, fmtDate, fmt1, fmtPct, rankBadge, playerLink, playerDot, gameLink, fmtEntryResult, shareButton, deleteMatchButton } = TTT.dom;
  const { state, daysAgoFilter, boot } = TTT.util;

  boot("index", function (main) {
    const s = state();
    main.appendChild(h("h1", { text: "Classement général" }));

    if (!s.players.length) {
      main.appendChild(h("div", { class: "empty" },
        h("p", { text: "Bienvenue ! Aucun joueur pour l'instant." }),
        h("p", null, h("a", { href: "players.html", text: "Ajoute ton premier joueur" }), " puis ", h("a", { href: "games.html", text: "un jeu" }), ", et enregistre ta ", h("a", { href: "new-match.html", text: "première partie" }), ".")
      ));
      return;
    }

    const selected = new Set();

    const catDefs = [
      { v: "versus", label: "⚔️ Compétitif", checked: true },
      { v: "duel", label: "🏓 Duel" },
      { v: "coop", label: "🤝 Coop" },
      { v: "duo", label: "👥 Duo" },
    ];
    const toolbar = h("div", { class: "toolbar" },
      h("label", { for: "period", text: "Période :", style: "margin:0" }),
      h("select", { id: "period" },
        h("option", { value: "all", text: "Depuis toujours" }),
        h("option", { value: "30", text: "30 derniers jours" }),
        h("option", { value: "90", text: "3 derniers mois" }),
        h("option", { value: "365", text: "12 derniers mois" })
      ),
      h("label", { for: "mode", text: "Formule :", style: "margin:0" }),
      h("select", { id: "mode" },
        h("option", { value: "full", text: "Complète (rang + perf score × poids BGG)" }),
        h("option", { value: "podium", text: "Podium seul (rang × poids BGG, sans bonus de score)" })
      ),
      h("label", { text: "Catégories :", style: "margin:0" }),
      h("span", { id: "cats", style: "display:inline-flex;gap:10px;flex-wrap:wrap;align-items:center" },
        catDefs.map((c) => {
          const cb = h("input", { type: "checkbox", value: c.v });
          cb.checked = !!c.checked;
          cb.addEventListener("change", renderBoard);
          c.cb = cb;
          return h("label", { style: "margin:0;display:inline-flex;gap:4px;align-items:center;cursor:pointer" }, cb, " " + c.label);
        })
      ),
      h("span", { class: "muted small", text: "(aucune cochée = tout)" }),
      h("button", { class: "secondary", text: "Tout cocher", onclick: () => { s.players.forEach((p) => selected.add(p.id)); renderBoard(); } }),
      h("button", { class: "secondary", text: "Tout décocher", onclick: () => { selected.clear(); renderBoard(); } }),
      h("span", { id: "sel-count", class: "muted small" })
    );
    main.appendChild(toolbar);

    const panel = h("div", { class: "panel" });
    main.appendChild(panel);
    const comparePanel = h("div", null);
    main.appendChild(comparePanel);

    function currentFilter() {
      const v = toolbar.querySelector("#period").value;
      const days = parseInt(v, 10);
      const pf = v === "all" || isNaN(days) ? null : daysAgoFilter(days);
      const cats = catDefs.filter((c) => c.cb.checked).map((c) => c.v);
      const cf = TTT.scoring.categoryFilter(s, cats.length ? cats : "all");
      return (m) => (!pf || pf(m)) && (!cf || cf(m));
    }

    function currentMode() {
      return toolbar.querySelector("#mode").value === "podium" ? "podium" : "full";
    }

    function renderBoard() {
      clear(panel);
      const filter = currentFilter();
      const mode = currentMode();
      const rows = TTT.scoring.leaderboard(s, filter, mode);
      toolbar.querySelector("#sel-count").textContent = selected.size ? selected.size + " joueur(s) sélectionné(s) — comparatif ci-dessous" : "Coche des joueurs pour les comparer";
      if (!rows.length || rows.every((r) => r.matches === 0)) {
        panel.appendChild(h("p", { class: "muted", text: "Aucune partie sur cette période." }));
      } else {
        const table = h("table", null,
          h("tr", null,
            h("th", { text: "✓" }), h("th", { text: "Rang" }), h("th", { text: "Joueur" }), h("th", { class: "num", text: "Points" }),
            h("th", { class: "num", text: "Parties" }), h("th", { class: "num", text: "Victoires" }),
            h("th", { class: "num", text: "% victoires" }), h("th", { class: "num", text: "Podiums" })
          )
        );
        rows.forEach((r) => {
          const cb = h("input", { type: "checkbox" });
          cb.checked = selected.has(r.playerId);
          cb.addEventListener("change", () => {
            if (cb.checked) selected.add(r.playerId); else selected.delete(r.playerId);
            renderBoard();
          });
          table.appendChild(h("tr", null,
            h("td", null, cb),
            h("td", null, rankBadge(r.rank)),
            h("td", null, playerLink(s, r.playerId)),
            h("td", { class: "num", text: fmt1(r.points) }),
            h("td", { class: "num", text: String(r.matches) }),
            h("td", { class: "num", text: String(r.wins) }),
            h("td", { class: "num", text: r.matches ? fmtPct(r.winRate) : "—" }),
            h("td", { class: "num", text: String(r.podiums) })
          ));
        });
        panel.appendChild(table);
      }
      renderCompare(filter, mode);
    }

    function renderCompare(filter, mode) {
      clear(comparePanel);
      const ids = s.players.filter((p) => selected.has(p.id)).map((p) => p.id);
      if (ids.length < 2) return;
      // Comparaison équitable : uniquement les parties où TOUS les joueurs cochés étaient présents
      const data = TTT.stats.comparePlayers(s, ids, filter, mode, true);
      const maxPts = Math.max.apply(null, data.map((d) => d.points).concat([1]));

      comparePanel.appendChild(h("h2", { text: "⚖️ Comparaison (" + ids.length + " joueurs)" }));
      comparePanel.appendChild(h("p", { class: "muted small", text: "Base équitable : seules les " + (data[0] ? data[0].matches : 0) + " partie(s) où tous les joueurs cochés étaient présents ensemble sont comptées (les parties avec d'autres joueurs en plus comptent aussi)." }));

      const bars = h("div", { class: "panel" });
      data.forEach((d) => {
        bars.appendChild(h("div", { class: "cmp-row" },
          h("span", { class: "cmp-name" }, playerDot(d.player), " " + d.player.name),
          h("div", { class: "bar" }, h("div", { class: "bar-fill", style: "width:" + Math.round((d.points / maxPts) * 100) + "%;background:" + (d.player.color || "#4363d8") })),
          h("span", { class: "cmp-val", text: fmt1(d.points) + " pts" })
        ));
      });
      comparePanel.appendChild(bars);

      const metrics = [
        ["Points", (d) => fmt1(d.points)],
        ["Parties", (d) => String(d.matches)],
        ["Victoires", (d) => String(d.wins)],
        ["% victoires", (d) => (d.matches ? fmtPct(d.winRate) : "—")],
        ["Podiums", (d) => String(d.podiums)],
        ["Rang moyen", (d) => (d.avgRank == null ? "—" : String(d.avgRank))],
        ["Meilleur score", (d) => (d.bestScore == null ? "—" : String(d.bestScore))],
        ["Série en cours", (d) => String(d.currentStreak) + " 🔥"],
      ];
      const t = h("table", null,
        h("tr", null, h("th", { text: "" }), data.map((d) => h("th", null, playerDot(d.player), " " + d.player.name)))
      );
      metrics.forEach(([label, f]) => {
        t.appendChild(h("tr", null, h("th", { text: label, style: "text-transform:none" }), data.map((d) => h("td", { class: "num", text: f(d) }))));
      });
      comparePanel.appendChild(h("div", { class: "panel" }, t));

      if (data.some((d) => d.evolution.length >= 2)) {
        comparePanel.appendChild(h("h2", { text: "Évolution comparée des points cumulés" }));
        const canvas = h("canvas", { class: "chart" });
        comparePanel.appendChild(canvas);
        const draw = () => TTT.charts.drawMultiLineChart(canvas, data.map((d) => ({ label: d.player.name, color: d.player.color, points: d.evolution.map((e) => e.y) })));
        requestAnimationFrame(draw);
        window.addEventListener("resize", TTT.util.debounce(draw, 200));
      }

      if (ids.length === 2) renderH2H(comparePanel, ids[0], ids[1], filter);
    }

    function renderH2H(container, idA, idB, filter) {
      const a = s.players.find((p) => p.id === idA);
      const b = s.players.find((p) => p.id === idB);
      const duel = TTT.stats.headToHead(s, idA, idB, filter);
      container.appendChild(h("h2", { text: "⚔️ Face-à-face : " + a.name + " vs " + b.name }));
      if (!duel.total) {
        container.appendChild(h("p", { class: "muted", text: "Ces deux joueurs ne se sont jamais affrontés." }));
        return;
      }
      const cards = h("div", { class: "grid cols-2" },
        h("div", { class: "stat-card" },
          h("div", { class: "label", text: a.name + " gagne" }),
          h("div", { class: "value", text: duel.winsA + " / " + duel.total }, h("span", { class: "sub", text: "sur " + duel.total + " partie(s) communes" }))
        ),
        h("div", { class: "stat-card" },
          h("div", { class: "label", text: b.name + " gagne" }),
          h("div", { class: "value", text: duel.winsB + " / " + duel.total }, h("span", { class: "sub", text: duel.ties ? duel.ties + " match nul" + (duel.ties > 1 ? "s" : "") : "" }))
        ),
        h("div", { class: "stat-card" },
          h("div", { class: "label", text: "Score brut moyen" }),
          h("div", { class: "value", style: "font-size:19px", text: a.name + " " + duel.avgScoreA + " — " + b.name + " " + duel.avgScoreB })
        ),
        h("div", { class: "stat-card" },
          h("div", { class: "label", text: "Points gagnés en duel" }),
          h("div", { class: "value", style: "font-size:19px", text: a.name + " " + fmt1(duel.ptsA) + " — " + b.name + " " + fmt1(duel.ptsB) }, h("div", { class: "sub", text: "dernier duel le " + fmtDate(duel.last) }))
        )
      );
      container.appendChild(cards);
      const t = h("table", null,
        h("tr", null, h("th", { text: "Date" }), h("th", { text: "Jeu" }), h("th", { class: "num", text: a.name }), h("th", { class: "num", text: b.name }))
      );
      duel.matches.slice().reverse().forEach((c) => {
        const winA = c.a.rank < c.b.rank;
        t.appendChild(h("tr", null,
          h("td", { text: fmtDate(c.match.date) }),
          h("td", null, c.game ? gameLink(s, c.game.id) : "?"),
          h("td", { class: "num", text: (winA ? "👑 " : "") + c.a.score + " (rang " + c.a.rank + ")" }),
          h("td", { class: "num", text: (!winA && c.a.rank !== c.b.rank ? "👑 " : "") + c.b.score + " (rang " + c.b.rank + ")" })
        ));
      });
      container.appendChild(h("div", { class: "panel" }, t));
    }

    toolbar.querySelector("#period").addEventListener("change", renderBoard);
    toolbar.querySelector("#mode").addEventListener("change", renderBoard);
    renderBoard();

    main.appendChild(h("h2", { text: "Dernières parties" }));
    const recent = s.matches.slice(-5).reverse();
    if (!recent.length) {
      main.appendChild(h("p", { class: "muted", text: "Aucune partie enregistrée. " }, h("a", { href: "new-match.html", text: "Enregistre la première !" })));
    } else {
      const grid = h("div", { class: "grid cols-2" });
      recent.forEach((m) => {
        const entries = m.entries.slice().sort((a, b) => a.rank - b.rank);
        const card = h("div", { class: "panel match-card" },
          h("div", { class: "head" }, h("span", { class: "title" }, gameLink(s, m.gameId)), h("span", null, h("span", { class: "muted small", text: fmtDate(m.date) }), " ", shareButton(s, m.id), " ", deleteMatchButton(s, m.id))),
          h("ul", null, entries.map((e) => {
            return h("li", null,
              h("span", null, rankBadge(e.rank), " ", playerLink(s, e.playerId)),
              h("span", null, h("span", { class: "muted", text: fmtEntryResult(m, e) + " · " }), h("b", { text: fmt1(e.points) + " pts" }), e.isRecord ? h("span", { class: "badge-record", text: " ★ record" }) : null)
            );
          }))
        );
        grid.appendChild(card);
      });
      main.appendChild(grid);
    }
  });
})();
