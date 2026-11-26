(function () {
  "use strict";
  const { h, clear } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("games", function (main) {
    main.appendChild(h("h1", { text: "Jeux" }));

    const s = state();

    function modeBadge(g) {
      const c = TTT.scoring.catOf(g);
      return h("span", { class: "chip", text: c === "duel" ? "🏓 duel 1v1" : c === "coop" ? "🤝 coop" : c === "duo" ? "👥 duo" : "⚔️ compétitif" });
    }

    const searchBox = h("input", { id: "bggq", type: "text", placeholder: "Rechercher sur BoardGameGeek… (ex : Catan, Wingspan)", autocomplete: "off" });
    const results = h("div", { class: "bgg-results" });
    const searchPanel = h("div", { class: "panel" },
      h("h2", { style: "margin-top:0", text: "Recherche BGG" }),
      h("div", { class: "form-row" },
        h("div", null, h("label", { for: "bggq", text: "Nom du jeu" }), searchBox),
        h("div", null, h("button", {
          text: "Rechercher",
          onclick: async function () {
            const q = searchBox.value.trim();
            if (!q) return;
            clear(results);
            results.appendChild(h("p", { class: "muted small", text: "Recherche en cours…" }));
            try {
              const items = await TTT.bgg.search(q);
              clear(results);
              if (!items.length) {
                results.appendChild(h("p", { class: "muted small", text: "Aucun résultat. Utilise le formulaire manuel ci-dessous." }));
                return;
              }
              items.slice(0, 8).forEach((it) => {
                results.appendChild(h("button", {
                  class: "secondary",
                  text: it.name + (it.year ? " (" + it.year + ")" : ""),
                  onclick: async function () {
                    try {
                      const t = await TTT.bgg.thing(it.id);
                      fillForm(t);
                      results.scrollIntoView({ behavior: "smooth" });
                    } catch (e) {
                      alert("Fiche BGG illisible : " + e.message + "\nRemplis le formulaire à la main.");
                    }
                  }
                }));
              });
            } catch (e) {
              clear(results);
              results.appendChild(h("p", { class: "muted small", text: "API BGG indisponible (" + e.message + ") — saisis le jeu manuellement ci-dessous." }));
            }
          }
        }))
      ),
      results
    );
    main.appendChild(searchPanel);

    const fName = h("input", { id: "gname", type: "text", placeholder: "Nom du jeu" });
    const fBgg = h("input", { id: "gbgg", type: "hidden" });
    const fComplexity = h("input", { id: "gcomplexity", type: "number", min: "1", max: "5", step: "0.1", value: "2.3" });
    const fYear = h("input", { id: "gyear", type: "number", min: "1900", max: "2100", placeholder: "Année" });
    const fMin = h("input", { id: "gmin", type: "number", min: "1", max: "20", placeholder: "Min" });
    const fMax = h("input", { id: "gmax", type: "number", min: "1", max: "20", placeholder: "Max" });
    const fDuration = h("input", { id: "gduration", type: "number", min: "5", max: "600", step: "5", placeholder: "Durée moy. (min)" });
    const fBest = h("input", { id: "gbest", type: "number", min: "1", max: "20", placeholder: "Meilleur à (nb joueurs)" });
    const fTags = h("input", { id: "gtags", type: "text", placeholder: "Tags séparés par des virgules (ex: Stratégie, Cartes, Ambiance)" });
    const fMode = h("select", { id: "gmode" },
      h("option", { value: "versus", text: "⚔️ Compétitif — scores individuels (3+ joueurs ou libre)" }),
      h("option", { value: "duel", text: "🏓 Duel 1v1 — compétitif, strictement 2 joueurs" }),
      h("option", { value: "coop", text: "🤝 Coopératif — victoire/défaite commune" }),
      h("option", { value: "duo", text: "👥 Duo — coopératif, strictement 2 joueurs" })
    );
    const fLow = h("input", { id: "glow", type: "checkbox" });
    function autoMode() {
      const two = fMin.value === "2" && fMax.value === "2";
      const cur = fMode.value;
      if (two) fMode.value = cur === "coop" || cur === "duo" ? "duo" : "duel";
      else if (cur === "duel" || cur === "duo") fMode.value = cur === "duo" ? "coop" : "versus";
    }
    fMin.addEventListener("change", autoMode);
    fMax.addEventListener("change", autoMode);

    function fillForm(t) {
      fName.value = t.name || "";
      fBgg.value = t.id || "";
      fComplexity.value = t.complexity ? String(Math.round(t.complexity * 10) / 10) : "2.3";
      fYear.value = t.year || "";
      fMin.value = t.minPlayers || "";
      fMax.value = t.maxPlayers || "";
      fDuration.value = t.playingtime || "";
      fBest.value = t.bestPlayers || "";
      const tags = [...(t.categories || []), ...(t.mechanics || [])];
      fTags.value = tags.slice(0, 12).join(", ");
      const coopBgg = (t.categories || []).some((c) => /cooperative/i.test(c));
      const two = String(t.minPlayers) === "2" && String(t.maxPlayers) === "2";
      fMode.value = two ? (coopBgg ? "duo" : "duel") : coopBgg ? "coop" : "versus";
      if (t.image) fImg.value = t.image;
    }

    const fImg = h("input", { id: "gimg", type: "hidden" });
    const form = h("div", { class: "panel" },
      h("h2", { style: "margin-top:0", text: "Ajouter un jeu (manuel ou pré-rempli via BGG)" }),
      h("div", null, h("label", { for: "gname", text: "Nom *" }), fName, fBgg, fImg),
      h("div", { class: "grid cols-4" },
        h("div", null, h("label", { for: "gcomplexity", text: "Complexité BGG (poids 1–5) *" }), fComplexity),
        h("div", null, h("label", { for: "gyear", text: "Année" }), fYear),
        h("div", null, h("label", { for: "gmin", text: "Joueurs min" }), fMin),
        h("div", null, h("label", { for: "gmax", text: "Joueurs max" }), fMax)
      ),
      h("div", { class: "grid cols-3", style: "grid-template-columns: 1fr 1fr 1fr" },
        h("div", null, h("label", { for: "gduration", text: "Durée moyenne (minutes)" }), fDuration),
        h("div", null, h("label", { for: "gbest", text: "👍 Meilleur à (nb joueurs, BGG « Best »)" }), fBest),
        h("div", null, h("label", { for: "gtags", text: "Tags / catégories (séparés par des virgules)" }), fTags)
      ),
      h("div", null, h("label", { for: "gmode", text: "Type de jeu (catégorie de classement)" }), fMode),
      h("div", null, h("label", { style: "display:inline-flex;gap:6px;align-items:center;cursor:pointer" }, fLow, " 🏌️ Le plus petit score gagne (golf, fléchettes, etc.)")),
      h("div", { class: "btn-row" }, h("button", {
        text: "Ajouter le jeu",
        onclick: function () {
          if (!fName.value.trim()) { alert("Le nom du jeu est obligatoire."); return; }
          const st = state();
          TTT.store.addGame(st, {
            name: fName.value,
            bggId: fBgg.value || null,
            complexity: parseFloat(fComplexity.value) || 1,
            year: fYear.value ? parseInt(fYear.value, 10) : null,
            minPlayers: fMin.value ? parseInt(fMin.value, 10) : null,
            maxPlayers: fMax.value ? parseInt(fMax.value, 10) : null,
            duration: fDuration.value ? parseInt(fDuration.value, 10) : null,
            bestPlayers: fBest.value ? parseInt(fBest.value, 10) : null,
            mode: fMode.value,
            lowestScoreWins: fLow.checked,
            tags: fTags.value,
            image: fImg.value || null,
          });
          location.href = "games.html?msg=" + encodeURIComponent("Jeu « " + fName.value.trim() + " » ajouté.");
        }
      }))
    );
    main.appendChild(form);

    const panel = h("div", { class: "panel" });
    const searchIn = h("input", { id: "gsearch", type: "text", placeholder: "🔍 Rechercher par nom ou tag dans mes jeux…", autocomplete: "off" });
    main.appendChild(h("div", { class: "toolbar" }, searchIn));
    main.appendChild(h("h2", { text: "Mes jeux (" + s.games.length + ")" }));
    main.appendChild(h("div", { class: "btn-row", style: "margin-top:-6px" }, h("button", {
      class: "secondary",
      text: "✨ Ajouter les 50 jeux populaires manquants",
      onclick: function () {
        const added = TTT.store.seedDefaultGames(state());
        location.href = "games.html?msg=" + encodeURIComponent(added ? added + " jeu(x) ajouté(s) depuis la liste de base (50 jeux populaires)." : "Tous les jeux de la liste sont déjà présents.");
      }
    })));
    main.appendChild(panel);

    function renderList() {
      clear(panel);
      const st = state();
      if (!st.games.length) {
        panel.appendChild(h("p", { class: "muted", text: "Aucun jeu enregistré." }));
        return;
      }
      const q = (searchIn.value || "").trim().toLowerCase();
      const games = q
        ? st.games.filter((g) => g.name.toLowerCase().includes(q) || (g.tags || []).some((t) => t.toLowerCase().includes(q)))
        : st.games;
      if (!games.length) {
        panel.appendChild(h("p", { class: "muted", text: "Aucun jeu ne correspond à « " + searchIn.value + " »." }));
        return;
      }
      const t = h("table", null,
        h("tr", null, h("th", { text: "Jeu" }), h("th", { text: "Tags" }), h("th", { class: "num", text: "Poids BGG" }), h("th", { class: "num", text: "Durée" }), h("th", { class: "num", text: "👍 Best" }), h("th", { class: "num", text: "Joueurs" }), h("th", { class: "num", text: "Parties" }), h("th", { text: "" }))
      );
      games.forEach((g) => {
        const count = st.matches.filter((m) => m.gameId === g.id).length;
        t.appendChild(h("tr", null,
          h("td", null, h("a", { href: "game.html?id=" + encodeURIComponent(g.id), text: (g.favorite ? "⭐ " : "") + g.name }), " ", modeBadge(g), g.lowestScoreWins ? h("span", { class: "chip", text: "🏌️ petit score" }) : null, g.bggId ? h("span", { class: "muted small", text: "  · BGG #" + g.bggId }) : null),
          h("td", null, (g.tags || []).map((tg) => h("span", { class: "chip", text: tg }))),
          h("td", { class: "num" }, h("span", { class: "weight", text: String(g.complexity) })),
          h("td", { class: "num", text: g.duration ? g.duration + " min" : "—" }) ,
          h("td", { class: "num", text: g.bestPlayers ? "👍 " + g.bestPlayers : "—" }),
          h("td", { class: "num", text: g.minPlayers && g.maxPlayers ? g.minPlayers + "–" + g.maxPlayers : "—" }),
          h("td", { class: "num", text: String(count) }),
          h("td", null, h("button", {
            class: "secondary", text: "Supprimer",
            onclick: function () {
              if (!confirm("Supprimer « " + g.name + " » ?")) return;
              try {
                TTT.store.deleteGame(state(), g.id);
                renderList();
              } catch (e) { alert(e.message); }
            }
          }))
        ));
      });
      panel.appendChild(t);
    }
    searchIn.addEventListener("input", renderList);
    renderList();
  });
})();
