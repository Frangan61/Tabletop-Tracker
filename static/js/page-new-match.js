(function () {
  "use strict";
  const { h, clear, fmt1, rankBadge, playerDot } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("new", function (main) {
    main.appendChild(h("h1", { text: "Nouvelle partie" }));
    const s = state();

    if (!s.games.length) {
      main.appendChild(h("div", { class: "empty" }, h("p", { text: "Il faut d'abord ajouter un jeu. " }, h("a", { href: "games.html", text: "Ajouter un jeu" }))));
      return;
    }
    if (s.players.length < 2) {
      main.appendChild(h("div", { class: "empty" }, h("p", { text: "Il faut au moins 2 joueurs. " }, h("a", { href: "players.html", text: "Ajouter des joueurs" }))));
      return;
    }

    const gameSel = h("select", { id: "m-game" },
      h("option", { value: "", text: "— Choisir un jeu —" }),
      s.games.map((g) => h("option", { value: g.id, text: g.name + " (poids " + g.complexity + ")" }))
    );
    const dateIn = h("input", { id: "m-date", type: "date", value: new Date().toISOString().slice(0, 10) });
    const notesIn = h("input", { id: "m-notes", type: "text", placeholder: "Notes éventuelles (facultatif)" });

    const playerSel = h("select", { id: "m-player" },
      s.players.map((p) => h("option", { value: p.id, text: p.name }))
    );
    const scoreIn = h("input", { id: "m-score", type: "number", step: "any", placeholder: "Score" });

    const participants = [];
    const previewBody = h("tbody");
    const previewTable = h("table", null,
      h("thead", null, h("tr", null, h("th", { text: "Joueur" }), h("th", { class: "num", text: "Score" }), h("th", { text: "Rang" }), h("th", { class: "num", text: "Points" }), h("th", { text: "" }))),
      previewBody
    );
    const previewPanel = h("div", { class: "panel" }, h("h2", { style: "margin-top:0", text: "Participants & points calculés" }), previewTable);

    function usedIds() {
      return participants.map((p) => p.playerId);
    }

    function refreshPlayerOptions() {
      const used = new Set(usedIds());
      clear(playerSel);
      s.players.forEach((p) => {
        if (used.has(p.id)) return;
        playerSel.appendChild(h("option", { value: p.id, text: p.name }));
      });
      if (!playerSel.options.length) playerSel.appendChild(h("option", { value: "", text: "— tous les joueurs sont ajoutés —" }));
    }

    function renderPreview() {
      clear(previewBody);
      participants.forEach((p, i) => {
        previewBody.appendChild(h("tr", null,
          h("td", null, playerDot(s.players.find((x) => x.id === p.playerId)), " " + (s.players.find((x) => x.id === p.playerId) || {}).name),
          h("td", { class: "num", text: String(p.score) }),
          h("td", { class: "muted", text: "…" }),
          h("td", { class: "num", text: "…" }),
          h("td", null, h("button", { class: "secondary", text: "Retirer", onclick: function () { participants.splice(i, 1); refresh(); } }))
        ));
      });
      const gameId = gameSel.value;
      if (gameId && participants.length >= 2 && participants.every((p) => typeof p.score === "number")) {
        const st = state();
        const results = TTT.scoring.computeMatchResults(st, { gameId, date: dateIn.value, entries: participants });
        results.forEach((r, i) => {
          const row = previewBody.children[i];
          row.children[2].textContent = "";
          row.children[2].appendChild(rankBadge(r.rank));
          row.children[3].textContent = fmt1(r.points) + " pts" + (r.isRecord ? " ★ record !" : "");
          row.children[3].className = "num" + (r.isRecord ? " badge-record" : "");
        });
      }
      saveBtn.disabled = !(gameId && participants.length >= 2 && participants.every((p) => typeof p.score === "number"));
    }

    function refresh() {
      refreshPlayerOptions();
      renderPreview();
    }

    const addBtn = h("button", {
      class: "secondary", text: "Ajouter le joueur",
      onclick: function () {
        const pid = playerSel.value;
        const raw = scoreIn.value.trim().replace(",", ".");
        if (!pid) return;
        const score = parseFloat(raw);
        if (raw === "" || isNaN(score)) { alert("Saisis un score valide."); return; }
        if (participants.some((p) => p.playerId === pid)) return;
        participants.push({ playerId: pid, score });
        scoreIn.value = "";
        refresh();
      }
    });

    const saveBtn = h("button", {
      text: "Enregistrer la partie", disabled: true,
      onclick: function () {
        try {
          const st = state();
          const m = TTT.store.addMatch(st, { gameId: gameSel.value, date: dateIn.value, notes: notesIn.value.trim(), entries: participants });
          location.href = "index.html?msg=" + encodeURIComponent("Partie enregistrée (" + participants.length + " joueurs).");
        } catch (e) {
          alert(e.message);
        }
      }
    });

    main.appendChild(h("div", { class: "panel" },
      h("div", { class: "grid cols-3", style: "grid-template-columns: 2fr 1fr 2fr" },
        h("div", null, h("label", { for: "m-game", text: "Jeu *" }), gameSel),
        h("div", null, h("label", { for: "m-date", text: "Date" }), dateIn),
        h("div", null, h("label", { for: "m-notes", text: "Notes" }), notesIn)
      ),
      h("h2", { text: "Ajouter un participant" }),
      h("div", { class: "form-row" },
        h("div", null, h("label", { for: "m-player", text: "Joueur" }), playerSel),
        h("div", null, h("label", { for: "m-score", text: "Score brut" }), scoreIn),
        h("div", null, addBtn)
      ),
      h("p", { class: "muted small", text: "Le rang est calculé automatiquement (ex-aequo géré). Points = points de rang × poids BGG du jeu, + bonus si le score bat ton record perso sur ce jeu." })
    ));
    main.appendChild(previewPanel);
    main.appendChild(h("div", { class: "btn-row" }, saveBtn, h("a", { class: "btn secondary", href: "index.html", text: "Annuler" })));

    gameSel.addEventListener("change", renderPreview);
    dateIn.addEventListener("change", renderPreview);
    refresh();
  });
})();
