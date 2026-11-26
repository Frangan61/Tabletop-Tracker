(function () {
  "use strict";
  const { h, clear, fmtDate, fmt1, fmtPct, rankBadge, playerLink, gameLink } = TTT.dom;
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

    const toolbar = h("div", { class: "toolbar" },
      h("label", { for: "period", text: "Période :", style: "margin:0" }),
      h("select", { id: "period" },
        h("option", { value: "all", text: "Depuis toujours" }),
        h("option", { value: "30", text: "30 derniers jours" }),
        h("option", { value: "90", text: "3 derniers mois" }),
        h("option", { value: "365", text: "12 derniers mois" })
      )
    );
    main.appendChild(toolbar);

    const panel = h("div", { class: "panel" });
    main.appendChild(panel);

    function renderBoard() {
      clear(panel);
      const v = toolbar.querySelector("#period").value;
      const days = parseInt(v, 10);
      const filter = v === "all" || isNaN(days) ? null : daysAgoFilter(days);
      const rows = TTT.scoring.leaderboard(s, filter);
      if (!rows.length || rows.every((r) => r.matches === 0)) {
        panel.appendChild(h("p", { class: "muted", text: "Aucune partie sur cette période." }));
        return;
      }
      const table = h("table", null,
        h("tr", null,
          h("th", { text: "Rang" }), h("th", { text: "Joueur" }), h("th", { class: "num", text: "Points" }),
          h("th", { class: "num", text: "Parties" }), h("th", { class: "num", text: "Victoires" }),
          h("th", { class: "num", text: "% victoires" }), h("th", { class: "num", text: "Podiums" })
        )
      );
      rows.forEach((r) => {
        table.appendChild(h("tr", null,
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
    toolbar.querySelector("#period").addEventListener("change", renderBoard);
    renderBoard();

    main.appendChild(h("h2", { text: "Dernières parties" }));
    const recent = s.matches.slice(-5).reverse();
    if (!recent.length) {
      main.appendChild(h("p", { class: "muted", text: "Aucune partie enregistrée. " , }, h("a", { href: "new-match.html", text: "Enregistre la première !" })));
    } else {
      const grid = h("div", { class: "grid cols-2" });
      recent.forEach((m) => {
        const game = s.games.find((g) => g.id === m.gameId);
        const entries = m.entries.slice().sort((a, b) => a.rank - b.rank);
        const card = h("div", { class: "panel match-card" },
          h("div", { class: "head" }, h("span", { class: "title" }, gameLink(s, m.gameId)), h("span", { text: fmtDate(m.date) })),
          h("ul", null, entries.map((e) => {
            const p = s.players.find((x) => x.id === e.playerId);
            return h("li", null,
              h("span", null, rankBadge(e.rank), " ", playerLink(s, e.playerId)),
              h("span", null, h("span", { class: "muted", text: "score " + e.score + " · " }), h("b", { text: fmt1(e.points) + " pts" }), e.isRecord ? h("span", { class: "badge-record", text: " ★ record" }) : null)
            );
          }))
        );
        grid.appendChild(card);
      });
      main.appendChild(grid);
    }
  });
})();
