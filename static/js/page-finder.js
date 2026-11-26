(function () {
  "use strict";
  const { h, clear, fmt1 } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("finder", function (main) {
    main.appendChild(h("h1", { text: "🎯 Trouver un jeu" }));
    const s = state();

    const fPlayers = h("input", { id: "f-players", type: "number", min: "1", max: "20", placeholder: "Nombre de joueurs" });
    const fDuration = h("input", { id: "f-duration", type: "number", min: "5", max: "600", step: "5", placeholder: "Durée max (min)" });
    const fQ = h("input", { id: "f-q", type: "text", placeholder: "Rechercher un nom ou un tag…", autocomplete: "off" });

    const allTags = [...new Set(s.games.flatMap((g) => g.tags || []).map((t) => t.toLowerCase()))].sort();
    const tagBoxes = new Map();
    const tagPanel = h("div", { class: "tag-cloud" });
    allTags.forEach((t) => {
      const cb = h("input", { type: "checkbox", id: "tag-" + t });
      cb.addEventListener("change", render);
      tagBoxes.set(t, cb);
      tagPanel.appendChild(h("label", { class: "tag-toggle" }, cb, " " + t));
    });

    main.appendChild(h("div", { class: "panel" },
      h("div", { class: "grid cols-3", style: "grid-template-columns: 1fr 1fr 2fr" },
        h("div", null, h("label", { for: "f-players", text: "Nous sommes" }), fPlayers),
        h("div", null, h("label", { for: "f-duration", text: "Temps disponible (min max)" }), fDuration),
        h("div", null, h("label", { for: "f-q", text: "Nom ou tag" }), fQ)
      ),
      s.games.some((g) => (g.tags || []).length) ? h("div", null, h("label", { text: "Catégories" }), tagPanel) : null
    ));
    [fPlayers, fDuration, fQ].forEach((el) => el.addEventListener("input", render));

    const count = h("p", { class: "muted" });
    const results = h("div", { class: "grid cols-2" });
    main.appendChild(count);
    main.appendChild(results);

    function matches(g, q, n, d, tags) {
      if (q) {
        const hay = (g.name + " " + (g.tags || []).join(" ")).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (n) {
        if (g.minPlayers && n < g.minPlayers) return false;
        if (g.maxPlayers && n > g.maxPlayers) return false;
      }
      if (d && g.duration && g.duration > d) return false;
      const gtags = (g.tags || []).map((t) => t.toLowerCase());
      if (tags.some((t) => !gtags.includes(t))) return false;
      return true;
    }

    function render() {
      clear(results);
      const q = fQ.value.trim();
      const n = fPlayers.value ? parseInt(fPlayers.value, 10) : null;
      const d = fDuration.value ? parseInt(fDuration.value, 10) : null;
      const tags = [...tagBoxes.entries()].filter(([, cb]) => cb.checked).map(([t]) => t);
      const found = s.games
        .filter((g) => matches(g, q, n, d, tags))
        .map((g) => ({
          g,
          tagScore: tags.filter((t) => (g.tags || []).map((x) => x.toLowerCase()).includes(t)).length,
          count: s.matches.filter((m) => m.gameId === g.id).length,
        }))
        .sort((a, b) => b.tagScore - a.tagScore || b.count - a.count || a.g.name.localeCompare(b.g.name));
      count.textContent = found.length + " jeu" + (found.length > 1 ? "x" : "") + " trouvé" + (found.length > 1 ? "s" : "") + " sur " + s.games.length;
      if (!found.length) {
        results.appendChild(h("div", { class: "empty", style: "grid-column: 1 / -1" },
          h("p", { text: "Aucun jeu ne correspond. " }, h("a", { href: "games.html", text: "Ajoute un jeu" }))));
        return;
      }
      found.forEach(({ g, count: nMatches }) => {
        results.appendChild(h("div", { class: "panel match-card" },
          h("div", { class: "head" },
            h("a", { class: "title", href: "game.html?id=" + encodeURIComponent(g.id), text: g.name }),
            h("span", { text: "poids " + g.complexity + " · " + (g.duration ? g.duration + " min" : "durée ?") + " · " + (g.minPlayers && g.maxPlayers ? g.minPlayers + "–" + g.maxPlayers + " joueurs" : "joueurs ?") })
          ),
          (g.tags || []).length ? h("div", { class: "tag-cloud" }, g.tags.map((t) => h("span", { class: "chip", text: t }))) : null,
          h("div", { class: "btn-row" },
            h("a", { class: "btn", href: "new-match.html?game=" + encodeURIComponent(g.id), text: "▶ Jouer à celui-là" }),
            h("span", { class: "muted small", text: nMatches + " partie" + (nMatches > 1 ? "s" : "") + " enregistrée" + (nMatches > 1 ? "s" : "") })
          )
        ));
      });
    }
    render();
  });
})();
