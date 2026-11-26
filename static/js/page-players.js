(function () {
  "use strict";
  const { h, clear, fmt1, fmtPct, playerDot } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("players", function (main) {
    main.appendChild(h("h1", { text: "Joueurs" }));

    const s = state();
    const form = h("div", { class: "panel" },
      h("h2", { style: "margin-top:0", text: "Ajouter un joueur" }),
      h("div", { class: "form-row" },
        h("div", null, h("label", { for: "pname", text: "Nom" }), h("input", { id: "pname", type: "text", placeholder: "Ex : Alice", autocomplete: "off" })),
        h("div", null, h("label", { for: "pcolor", text: "Couleur" }), h("input", { id: "pcolor", type: "color", value: "#4363d8" })),
        h("div", null, h("button", {
          text: "Ajouter",
          onclick: function () {
            const name = main.querySelector("#pname").value.trim();
            if (!name) return;
            const st = state();
            const p = TTT.store.addPlayer(st, name);
            st.players.find((x) => x.id === p.id).color = main.querySelector("#pcolor").value;
            TTT.store.save(st);
            location.href = "player.html?id=" + encodeURIComponent(p.id) + "&msg=" + encodeURIComponent("Joueur « " + name + " » créé.");
          }
        }))
      )
    );
    main.appendChild(form);

    const panel = h("div", { class: "panel" });
    main.appendChild(panel);

    function renderList() {
      clear(panel);
      const st = state();
      if (!st.players.length) {
        panel.appendChild(h("p", { class: "muted", text: "Aucun joueur pour l'instant." }));
        return;
      }
      const board = TTT.scoring.leaderboard(st);
      const table = h("table", null,
        h("tr", null, h("th", { text: "Joueur" }), h("th", { class: "num", text: "Points" }), h("th", { class: "num", text: "Parties" }), h("th", { class: "num", text: "Victoires" }), h("th", { class: "num", text: "%" }), h("th", { text: "" }))
      );
      st.players.forEach((p) => {
        const r = board.find((x) => x.playerId === p.id) || { points: 0, matches: 0, wins: 0, winRate: 0 };
        table.appendChild(h("tr", null,
          h("td", null, h("a", { class: "player-link", href: "player.html?id=" + encodeURIComponent(p.id) }, playerDot(p), " " + p.name)),
          h("td", { class: "num", text: fmt1(r.points) }),
          h("td", { class: "num", text: String(r.matches) }),
          h("td", { class: "num", text: String(r.wins) }),
          h("td", { class: "num", text: r.matches ? fmtPct(r.winRate) : "—" }),
          h("td", null, h("button", {
            class: "secondary", text: "Supprimer",
            onclick: function () {
              if (!confirm("Supprimer « " + p.name + " » ?")) return;
              try {
                TTT.store.deletePlayer(state(), p.id);
                renderList();
              } catch (e) {
                alert(e.message);
              }
            }
          }))
        ));
      });
      panel.appendChild(table);
    }
    renderList();
  });
})();
