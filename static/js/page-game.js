(function () {
  "use strict";
  const { h, fmtDate, fmt1, rankBadge, playerLink, fmtEntryResult, shareButton } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("games", function (main) {
    const id = new URLSearchParams(location.search).get("id");
    const s = state();
    const g = s.games.find((x) => x.id === id);
    if (!g) {
      main.appendChild(h("div", { class: "empty" }, h("p", { text: "Jeu introuvable. " }, h("a", { href: "games.html", text: "Retour aux jeux" }))));
      return;
    }

    const headChildren = [
      h("div", null,
        h("h1", { style: "margin:0 0 6px", text: g.name }),
        h("div", { class: "muted" },
          h("span", { class: "weight", text: "Poids BGG : " + g.complexity + " / 5" }),
          "  ·  " + (function () { const c = TTT.scoring.catOf(g); return c === "duel" ? "🏓 duel 1v1  ·  " : c === "coop" ? "🤝 coopératif  ·  " : c === "duo" ? "👥 duo  ·  " : "⚔️ compétitif  ·  "; })() + (g.year ? "Année " + g.year + "  ·  " : "") + (g.duration ? "⏱ " + g.duration + " min  ·  " : "") + (g.minPlayers && g.maxPlayers ? "Joueurs " + g.minPlayers + "–" + g.maxPlayers : ""),
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

    main.appendChild(h("h2", { text: "🏆 Top 10 des scores — tous joueurs confondus" }));
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
      all.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
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
