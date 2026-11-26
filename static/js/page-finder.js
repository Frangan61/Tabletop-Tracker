(function () {
  "use strict";
  const { h, clear, fmt1, autocomplete, filterItems } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("finder", function (main) {
    main.appendChild(h("h1", { text: "🎯 Trouver un jeu" }));
    const s = state();

    const fPlayers = h("input", { id: "f-players", type: "number", min: "1", max: "20", placeholder: "Nombre de joueurs" });
    const fBest = h("input", { id: "f-best", type: "number", min: "1", max: "20", placeholder: "Meilleur à (nb joueurs, BGG Best)" });
    const fDuration = h("input", { id: "f-duration", type: "number", min: "5", max: "600", step: "5", placeholder: "Durée max (min)" });
    const fQ = h("input", { id: "f-q", type: "text", placeholder: "Nom du jeu…", autocomplete: "off" });
    const fFav = h("input", { id: "f-fav", type: "checkbox" });

    // Tags : champ autocomplété, les tags choisis deviennent des chips filtrables
    const allTags = [...new Set(s.games.flatMap((g) => g.tags || []))].sort((a, b) => a.localeCompare(b));
    const activeTags = new Set();
    const tagInput = h("input", { id: "f-tag", type: "text", placeholder: "Tape un tag… (ex: stratégie)", autocomplete: "off" });
    const tagInputWrap = h("div", { style: "position:relative" }, tagInput);
    const activeTagPanel = h("div", { class: "tag-cloud" });
    autocomplete(tagInput, () => allTags.map((t) => ({ label: t, value: t })), (it) => {
      activeTags.add(it.value);
      tagInput.value = "";
      renderActiveTags();
      render();
    });
    function renderActiveTags() {
      clear(activeTagPanel);
      activeTags.forEach((t) => {
        activeTagPanel.appendChild(h("span", { class: "chip" }, t + " ", h("button", {
          class: "fav-star", text: "✕", style: "font-size:11px;padding:0 2px",
          onclick: () => { activeTags.delete(t); renderActiveTags(); render(); },
        })));
      });
    }

    main.appendChild(h("div", { class: "panel" },
      h("div", { class: "grid cols-2", style: "grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))" },
        h("div", null, h("label", { for: "f-players", text: "Nous sommes" }), fPlayers),
        h("div", null, h("label", { for: "f-best", text: "👍 Meilleur à (BGG « Best » / plage joueurs)" }), fBest),
        h("div", null, h("label", { for: "f-duration", text: "Temps disponible (min max)" }), fDuration),
        h("div", null, h("label", { for: "f-q", text: "Nom du jeu" }), fQ),
        h("div", null, h("label", { for: "f-tag", text: "Tags (autocomplétion)" }), tagInputWrap),
        h("div", null, h("label", { class: "tag-toggle", style: "display:inline-flex;margin-top:10px" }, fFav, " ⭐ favoris uniquement"))
      ),
      activeTagPanel
    ));
    [fPlayers, fBest, fDuration, fQ].forEach((el) => el.addEventListener("input", render));
    fFav.addEventListener("change", render);

    const count = h("p", { class: "muted" });
    const results = h("div", { class: "grid cols-2" });
    main.appendChild(count);
    main.appendChild(results);

    function matches(g, q, n, best, d, fav, tags) {
      if (q) {
        const hay = (g.name + " " + (g.tags || []).join(" ")).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (n) {
        if (g.minPlayers && n < g.minPlayers) return false;
        if (g.maxPlayers && n > g.maxPlayers) return false;
      }
      if (best) {
        // si le jeu a un "Best" BGG renseigné, il doit correspondre ; sinon on se rabat sur la plage min/max
        if (g.bestPlayers) { if (g.bestPlayers !== best) return false; }
        else if (g.minPlayers && g.maxPlayers && (best < g.minPlayers || best > g.maxPlayers)) return false;
      }
      if (d && g.duration && g.duration > d) return false;
      if (fav && !g.favorite) return false;
      const gtags = (g.tags || []).map((t) => t.toLowerCase());
      if (tags.some((t) => !gtags.includes(t.toLowerCase()))) return false;
      return true;
    }

    function render() {
      clear(results);
      const q = fQ.value.trim();
      const n = fPlayers.value ? parseInt(fPlayers.value, 10) : null;
      const best = fBest.value ? parseInt(fBest.value, 10) : null;
      const d = fDuration.value ? parseInt(fDuration.value, 10) : null;
      const tags = [...activeTags];
      const found = s.games
        .filter((g) => matches(g, q, n, best, d, fFav.checked, tags))
        .map((g) => ({
          g,
          tagScore: tags.filter((t) => (g.tags || []).map((x) => x.toLowerCase()).includes(t.toLowerCase())).length,
          count: s.matches.filter((m) => m.gameId === g.id).length,
        }))
        .sort((a, b) => b.tagScore - a.tagScore || (b.g.favorite ? 1 : 0) - (a.g.favorite ? 1 : 0) || b.count - a.count || a.g.name.localeCompare(b.g.name));
      count.textContent = found.length + " jeu" + (found.length > 1 ? "x" : "") + " trouvé" + (found.length > 1 ? "s" : "") + " sur " + s.games.length;
      if (!found.length) {
        results.appendChild(h("div", { class: "empty", style: "grid-column: 1 / -1" },
          h("p", { text: "Aucun jeu ne correspond. " }, h("a", { href: "games.html", text: "Ajoute un jeu" }))));
        return;
      }
      found.forEach(({ g, count: nMatches }) => {
        results.appendChild(h("div", { class: "panel match-card" },
          h("div", { class: "head" },
            h("a", { class: "title", href: "game.html?id=" + encodeURIComponent(g.id), text: (g.favorite ? "⭐ " : "") + g.name }),
            h("span", { text: (g.bestPlayers ? "👍 " + g.bestPlayers + " joueurs · " : "") + (g.minPlayers && g.maxPlayers ? g.minPlayers + "–" + g.maxPlayers + " joueurs" : "") })
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
