(function () {
  "use strict";
  const { h, clear, fmtDate, fmt1, fmtPct, rankBadge, gameLink, playerDot, fmtEntryResult } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("players", function (main) {
    const id = new URLSearchParams(location.search).get("id");
    const s = state();
    const stats = id ? TTT.stats.playerStats(s, id) : null;
    if (!stats || !stats.player) {
      main.appendChild(h("div", { class: "empty" }, h("p", { text: "Joueur introuvable. " }, h("a", { href: "players.html", text: "Retour à la liste" }))));
      return;
    }
    const p = stats.player;

    const head = h("div", { class: "panel" },
      h("div", { class: "player-header" },
        playerDot(p),
        h("h1", { text: p.name }),
        h("span", { class: "muted", text: stats.globalRank ? "Rang général : #" + stats.globalRank : "" })
      )
    );
    main.appendChild(head);

    const cards = h("div", { class: "grid cols-5" },
      h("div", { class: "stat-card" }, h("div", { class: "label", text: "Parties" }), h("div", { class: "value", text: String(stats.matches) })),
      h("div", { class: "stat-card" }, h("div", { class: "label", text: "Victoires" }), h("div", { class: "value", text: String(stats.wins) }), h("div", { class: "sub", text: fmtPct(stats.winRate) + " · " + stats.podiums + " podiums" })),
      h("div", { class: "stat-card" }, h("div", { class: "label", text: "Points pondérés (⚔️ compétitif)" }), h("div", { class: "value", text: fmt1(stats.totalPoints) })),
      h("div", { class: "stat-card" }, h("div", { class: "label", text: "🤝 Coopératif" }), h("div", { class: "value", text: stats.coop.matches ? stats.coop.wins + "V/" + stats.coop.losses + "D" : "—" }), h("div", { class: "sub", text: stats.coop.matches ? fmtPct(stats.coop.winRate) + " de victoires · " + stats.coop.matches + " parties" : "aucune partie coop" })),
      h("div", { class: "stat-card" }, h("div", { class: "label", text: "🏓 À 2 joueurs" }), h("div", { class: "value", text: stats.duel.matches ? stats.duel.wins + "V/" + stats.duel.losses + "D" : "—" }), h("div", { class: "sub", text: stats.duel.matches ? fmtPct(stats.duel.winRate) + " de victoires · " + stats.duel.matches + " parties duel/duo" : "aucune partie à 2" })),
      h("div", { class: "stat-card" }, h("div", { class: "label", text: "Série en cours" }), h("div", { class: "value", text: stats.streaks.current + " 🔥" }), h("div", { class: "sub", text: "Record : " + stats.streaks.longest })),
      h("div", { class: "stat-card" }, h("div", { class: "label", text: "Records perso" }), h("div", { class: "value", text: String(stats.recordsCount) + " ★" }))
    );
    main.appendChild(cards);

    main.appendChild(h("h2", { text: "Records & meilleures performances" }));
    const rec = h("div", { class: "grid cols-2" },
      h("div", { class: "stat-card" },
        h("div", { class: "label", text: "Meilleur score brut" }),
        stats.bestScore
          ? h("div", { class: "value", text: String(stats.bestScore.score) }, " ", h("span", { class: "small muted", text: "sur " + (stats.bestScore.game ? stats.bestScore.game.name : "?") + " le " + fmtDate(stats.bestScore.date) }))
          : h("div", { class: "value", text: "—" })
      ),
      h("div", { class: "stat-card" },
        h("div", { class: "label", text: "Meilleure partie (points)" }),
        stats.bestPoints
          ? h("div", { class: "value", text: fmt1(stats.bestPoints.points) + " pts" }, " ", h("span", { class: "small muted", text: "sur " + (stats.bestPoints.game ? stats.bestPoints.game.name : "?") + " le " + fmtDate(stats.bestPoints.date) }))
          : h("div", { class: "value", text: "—" })
      )
    );
    main.appendChild(rec);

    main.appendChild(h("h2", { text: "Dernières parties" }));
    const lastGrid = h("div", { class: "grid cols-2" });
    [["5 dernières", stats.last5], ["10 dernières", stats.last10]].forEach(([label, st]) => {
      lastGrid.appendChild(h("div", { class: "stat-card" },
        h("div", { class: "label", text: label }),
        st
          ? h("div", null,
              h("div", { class: "value", text: fmt1(st.avgPoints) + " pts", style: "font-size:20px" }, h("div", { class: "sub", text: "moyenne de points" })),
              h("div", { class: "sub", text: "Rang moyen : " + st.avgRank + " · Victoires : " + fmtPct(st.winRate) + " · Records : " + st.records })
            )
          : h("div", { class: "muted", text: "Pas assez de parties." })
      ));
    });
    main.appendChild(lastGrid);

    if (stats.evolution.length >= 2) {
      main.appendChild(h("h2", { text: "Évolution des points cumulés" }));
      const canvas = h("canvas", { class: "chart" });
      main.appendChild(canvas);
      const draw = () => TTT.charts.drawLineChart(canvas, stats.evolution.map((e) => ({ y: e.total })), { color: p.color || "#4363d8" });
      requestAnimationFrame(draw);
      window.addEventListener("resize", TTT.util.debounce(draw, 200));
    }

    if (stats.games.length) {
      main.appendChild(h("h2", { text: "Ses jeux" }));
      const gt = h("table", null,
        h("tr", null, h("th", { text: "Jeu" }), h("th", { class: "num", text: "Parties" }), h("th", { class: "num", text: "Rang moyen" }), h("th", { class: "num", text: "Points" }))
      );
      stats.games.slice(0, 8).forEach((g) => {
        gt.appendChild(h("tr", null,
          h("td", null, g.game ? gameLink(s, g.game.id) : "?"),
          h("td", { class: "num", text: String(g.count) }),
          h("td", { class: "num", text: String(g.avgRank) }),
          h("td", { class: "num", text: fmt1(g.totalPoints) })
        ));
      });
      const gp = h("div", { class: "panel" }, gt);
      main.appendChild(gp);
    }

    main.appendChild(h("h2", { text: "Historique complet (" + stats.matches + ")" }));
    if (!stats.history.length) {
      main.appendChild(h("p", { class: "muted", text: "Aucune partie pour l'instant." }));
    } else {
      const t = h("table", null,
        h("tr", null, h("th", { text: "Date" }), h("th", { text: "Jeu" }), h("th", { class: "num", text: "Score" }), h("th", { text: "Rang" }), h("th", { class: "num", text: "Points" }))
      );
      stats.history.forEach((hrow) => {
        t.appendChild(h("tr", null,
          h("td", { text: fmtDate(hrow.match.date) }),
          h("td", null, gameLink(s, hrow.match.gameId)),
          h("td", { class: "num", text: hrow.match.coopResult ? (hrow.match.coopResult === "win" ? "🏆" : "💀") + (hrow.match.teamScore != null ? " " + hrow.match.teamScore : "") : String(hrow.entry.score) }),
          h("td", null, rankBadge(hrow.entry.rank)),
          h("td", { class: "num", text: fmt1(hrow.entry.points) + (hrow.entry.isRecord ? " ★" : "") })
        ));
      });
      main.appendChild(h("div", { class: "panel" }, t));
    }
  });
})();
