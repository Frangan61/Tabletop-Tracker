(function () {
  "use strict";
  const { h, clear, fmt1, rankBadge, playerDot, autocomplete, filterItems } = TTT.dom;
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

    // Champ texte avec autocomplétion : taper filtre la liste ("c" -> tous les jeux avec un c, "cat" -> catan…)
    let selectedGameId = "";
    const gameInput = h("input", { id: "m-game", type: "text", placeholder: "Tape le nom du jeu… (ex: catan)", autocomplete: "off" });
    const gameWrap = h("div", { style: "position:relative" }, gameInput);
    const preselect = new URLSearchParams(location.search).get("game");
    if (preselect && s.games.some((g) => g.id === preselect)) {
      selectedGameId = preselect;
      gameInput.value = s.games.find((g) => g.id === preselect).name;
    }
    autocomplete(gameInput, () => s.games.map((g) => ({ label: g.name + (g.coop ? " 🤝" : ""), value: g.id })), (it) => {
      selectedGameId = it.value;
      refresh();
    });

    const dateIn = h("input", { id: "m-date", type: "date", value: new Date().toISOString().slice(0, 10) });
    const notesIn = h("input", { id: "m-notes", type: "text", placeholder: "Notes éventuelles (facultatif)" });

    const playerSel = h("select", { id: "m-player" },
      s.players.map((p) => h("option", { value: p.id, text: p.name }))
    );
    const scoreIn = h("input", { id: "m-score", type: "number", step: "any", placeholder: "Score" });
    const scoreLabel = h("label", { for: "m-score", text: "Score brut" });
    const scoreBox = h("div", null, scoreLabel, scoreIn);

    // Mode coopératif : résultat commun au lieu des scores individuels
    const coopResultSel = h("select", { id: "m-coopresult" },
      h("option", { value: "", text: "— Résultat de la partie —" }),
      h("option", { value: "win", text: "🏆 Victoire (tout le monde 1er)" }),
      h("option", { value: "loss", text: "💀 Défaite (tout le monde dernier)" })
    );
    const teamScoreIn = h("input", { id: "m-teamscore", type: "number", step: "any", placeholder: "Score d'équipe (optionnel)" });
    const coopBox = h("div", { class: "grid cols-2", style: "display:none" },
      h("div", null, h("label", { for: "m-coopresult", text: "Résultat (commun à tous)" }), coopResultSel),
      h("div", null, h("label", { for: "m-teamscore", text: "Score d'équipe (optionnel, pour le top 10)" }), teamScoreIn)
    );

    const curGame = () => s.games.find((x) => x.id === selectedGameId);
    const isCoop = () => !!(curGame() && curGame().coop);
    const modeOf = () => TTT.scoring.catOf(curGame());
    const isTwoOnly = () => { const m = modeOf(); return m === "duel" || m === "duo"; };

    const participants = [];
    const previewBody = h("tbody");
    const previewTable = h("table", null,
      h("thead", null, h("tr", null, h("th", { text: "Joueur" }), h("th", { class: "num", text: "Score" }), h("th", { text: "Rang" }), h("th", { class: "num", text: "Points" }), h("th", { text: "" }))),
      previewBody
    );
    const previewPanel = h("div", { class: "panel" }, h("h2", { style: "margin-top:0", text: "Participants & points calculés" }), previewTable);

    function refreshPlayerOptions() {
      const used = new Set(participants.map((p) => p.playerId));
      clear(playerSel);
      s.players.forEach((p) => {
        if (used.has(p.id)) return;
        playerSel.appendChild(h("option", { value: p.id, text: p.name }));
      });
      if (!playerSel.options.length) playerSel.appendChild(h("option", { value: "", text: "— tous les joueurs sont ajoutés —" }));
    }

    function currentEntries() {
      if (isCoop()) {
        const win = coopResultSel.value === "win";
        return participants.map((p) => ({ playerId: p.playerId, score: coopResultSel.value ? (win ? 1 : 0) : 0 }));
      }
      return participants.map((p) => ({ playerId: p.playerId, score: p.score }));
    }

    function canSave() {
      if (!selectedGameId || participants.length < 2) return false;
      if (isTwoOnly() && participants.length !== 2) return false;
      if (isCoop()) return !!coopResultSel.value;
      return participants.every((p) => typeof p.score === "number");
    }

    function renderPreview() {
      clear(previewBody);
      participants.forEach((p, i) => {
        const pl = s.players.find((x) => x.id === p.playerId) || {};
        previewBody.appendChild(h("tr", null,
          h("td", null, playerDot(pl), " " + pl.name),
          h("td", { class: "num", text: isCoop() ? (coopResultSel.value === "win" ? "🏆" : coopResultSel.value === "loss" ? "💀" : "…") : String(p.score) }),
          h("td", { class: "muted", text: "…" }),
          h("td", { class: "num", text: "…" }),
          h("td", null, h("button", { class: "secondary", text: "Retirer", onclick: function () { participants.splice(i, 1); refresh(); } }))
        ));
      });
      if (selectedGameId && participants.length >= 2 && canSave()) {
        const st = state();
        const results = TTT.scoring.computeMatchResults(st, { gameId: selectedGameId, date: dateIn.value, entries: currentEntries() });
        results.forEach((r, i) => {
          const row = previewBody.children[i];
          row.children[2].textContent = "";
          row.children[2].appendChild(rankBadge(r.rank));
          row.children[3].textContent = fmt1(r.points) + " pts" + (r.perf > 0 ? " (perf +" + fmt1(r.perf) + ")" : "") + (r.isRecord ? " ★ record !" : "");
          row.children[3].className = "num" + (r.isRecord ? " badge-record" : "");
        });
      }
      saveBtn.disabled = !canSave();
    }

    function refresh() {
      refreshPlayerOptions();
      const coop = isCoop();
      scoreBox.style.display = coop ? "none" : "";
      coopBox.style.display = coop ? "" : "none";
      renderPreview();
    }

    const addBtn = h("button", {
      class: "secondary", text: "Ajouter le joueur",
      onclick: function () {
        const pid = playerSel.value;
        if (!pid || participants.some((p) => p.playerId === pid)) return;
        if (isTwoOnly() && participants.length >= 2) { alert("Jeu à 2 joueurs (duel/duo) : 2 participants exactement."); return; }
        if (isCoop()) {
          participants.push({ playerId: pid, score: null });
        } else {
          const raw = scoreIn.value.trim().replace(",", ".");
          const score = parseFloat(raw);
          if (raw === "" || isNaN(score)) { alert("Saisis un score valide."); return; }
          participants.push({ playerId: pid, score });
          scoreIn.value = "";
        }
        refresh();
      }
    });

    const saveBtn = h("button", {
      text: "Enregistrer la partie", disabled: true,
      onclick: function () {
        try {
          const st = state();
          const coop = isCoop();
          const teamRaw = teamScoreIn.value.trim().replace(",", ".");
          TTT.store.addMatch(st, {
            gameId: selectedGameId,
            date: dateIn.value,
            notes: notesIn.value.trim(),
            entries: currentEntries(),
            coopResult: coop ? coopResultSel.value : null,
            teamScore: coop && teamRaw !== "" && !isNaN(parseFloat(teamRaw)) ? parseFloat(teamRaw) : null,
          });
          location.href = "index.html?msg=" + encodeURIComponent("Partie enregistrée (" + participants.length + " joueurs" + (coop ? ", coopératif" : "") + ").");
        } catch (e) {
          alert(e.message);
        }
      }
    });

    main.appendChild(h("div", { class: "panel" },
      h("div", { class: "grid cols-3", style: "grid-template-columns: 2fr 1fr 2fr" },
        h("div", null, h("label", { for: "m-game", text: "Jeu *" }), gameWrap),
        h("div", null, h("label", { for: "m-date", text: "Date" }), dateIn),
        h("div", null, h("label", { for: "m-notes", text: "Notes" }), notesIn)
      ),
      coopBox,
      h("h2", { text: "Ajouter un participant" }),
      h("div", { class: "form-row" },
        h("div", null, h("label", { for: "m-player", text: "Joueur" }), playerSel),
        scoreBox,
        h("div", null, addBtn)
      ),
      h("p", { class: "muted small", text: "Le rang est calculé automatiquement (ex-aequo géré). Points = (points de rang + perf) × poids BGG du jeu. Jeu coopératif : victoire = 1er pour tous, défaite = dernier pour tous, pas de perf." })
    ));
    main.appendChild(previewPanel);
    main.appendChild(h("div", { class: "btn-row" }, saveBtn, h("a", { class: "btn secondary", href: "index.html", text: "Annuler" })));

    coopResultSel.addEventListener("change", renderPreview);
    dateIn.addEventListener("change", renderPreview);
    refresh();
  });
})();
