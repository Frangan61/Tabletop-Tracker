(function () {
  "use strict";
  const { h, clear } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("games", function (main) {
    main.appendChild(h("h1", { text: "Jeux" }));

    const s = state();

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

    function fillForm(t) {
      fName.value = t.name || "";
      fBgg.value = t.id || "";
      fComplexity.value = t.complexity ? String(Math.round(t.complexity * 10) / 10) : "2.3";
      fYear.value = t.year || "";
      fMin.value = t.minPlayers || "";
      fMax.value = t.maxPlayers || "";
    }

    const form = h("div", { class: "panel" },
      h("h2", { style: "margin-top:0", text: "Ajouter un jeu (manuel ou pré-rempli via BGG)" }),
      h("div", null, h("label", { for: "gname", text: "Nom *" }), fName, fBgg),
      h("div", { class: "grid cols-4" },
        h("div", null, h("label", { for: "gcomplexity", text: "Complexité BGG (poids 1–5) *" }), fComplexity),
        h("div", null, h("label", { for: "gyear", text: "Année" }), fYear),
        h("div", null, h("label", { for: "gmin", text: "Joueurs min" }), fMin),
        h("div", null, h("label", { for: "gmax", text: "Joueurs max" }), fMax)
      ),
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
          });
          location.href = "games.html?msg=" + encodeURIComponent("Jeu « " + fName.value.trim() + " » ajouté.");
        }
      }))
    );
    main.appendChild(form);

    const panel = h("div", { class: "panel" });
    main.appendChild(h("h2", { text: "Mes jeux (" + s.games.length + ")" }));
    main.appendChild(panel);

    function renderList() {
      clear(panel);
      const st = state();
      if (!st.games.length) {
        panel.appendChild(h("p", { class: "muted", text: "Aucun jeu enregistré." }));
        return;
      }
      const t = h("table", null,
        h("tr", null, h("th", { text: "Jeu" }), h("th", { class: "num", text: "Poids BGG" }), h("th", { class: "num", text: "Année" }), h("th", { class: "num", text: "Joueurs" }), h("th", { class: "num", text: "Parties" }), h("th", { text: "" }))
      );
      st.games.forEach((g) => {
        const count = st.matches.filter((m) => m.gameId === g.id).length;
        t.appendChild(h("tr", null,
          h("td", null, h("a", { href: "game.html?id=" + encodeURIComponent(g.id), text: g.name }), g.bggId ? h("span", { class: "muted small", text: "  · BGG #" + g.bggId }) : null),
          h("td", { class: "num" }, h("span", { class: "weight", text: String(g.complexity) })),
          h("td", { class: "num", text: g.year ? String(g.year) : "—" }),
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
    renderList();
  });
})();
