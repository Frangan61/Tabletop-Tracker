(function () {
  "use strict";
  const { h, download } = TTT.dom;
  const { state, boot } = TTT.util;

  boot("settings", function (main) {
    main.appendChild(h("h1", { text: "Paramètres" }));
    const s = state();

    const rp = h("input", { id: "s-rankpoints", type: "text", value: s.scoring.rankPoints.join(",") });
    const cm = h("input", { id: "s-cm", type: "checkbox" });
    cm.checked = !!s.scoring.complexityMultiplier;
    const rb = h("input", { id: "s-rb", type: "number", step: "0.5", min: "0", value: String(s.scoring.recordBonus) });

    main.appendChild(h("div", { class: "panel" },
      h("h2", { style: "margin-top:0", text: "Formule de points" }),
      h("p", { class: "muted small", html: "Pour chaque partie : <b>points = points de rang × poids BGG du jeu</b> (si activé) <b>+ bonus record × poids BGG</b> si le score du joueur bat son meilleur score précédent sur ce même jeu. Les ex-aequo partagent le même rang." }),
      h("div", null, h("label", { for: "s-rankpoints", text: "Points par rang (1er, 2e, 3e, … séparés par des virgules)" }), rp),
      h("div", { class: "grid cols-2" },
        h("div", null, h("label", { for: "s-cm", text: "Multiplier par le poids BGG (complexité)" }), cm),
        h("div", null, h("label", { for: "s-rb", text: "Bonus record perso sur le jeu (× poids BGG)" }), rb)
      ),
      h("div", { class: "btn-row" },
        h("button", {
          text: "Enregistrer la formule",
          onclick: function () {
            const st = state();
            const arr = rp.value.split(",").map((x) => parseFloat(x.trim().replace(",", "."))).filter((x) => !isNaN(x) && x >= 0);
            if (!arr.length) { alert("Indique au moins une valeur de points de rang."); return; }
            st.scoring.rankPoints = arr;
            st.scoring.complexityMultiplier = cm.checked;
            st.scoring.recordBonus = parseFloat(rb.value) || 0;
            TTT.store.save(st);
            alert("Formule enregistrée. Les points des parties existantes ne changent pas automatiquement.");
          }
        }),
        h("button", {
          class: "secondary", text: "Recalculer toutes les parties avec cette formule",
          onclick: function () {
            if (!confirm("Recalculer les points de TOUTES les parties avec la formule actuelle ?")) return;
            TTT.store.recalculateAll(state());
            alert("Points recalculés.");
            location.reload();
          }
        })
      )
    ));

    main.appendChild(h("div", { class: "panel" },
      h("h2", { style: "margin-top:0", text: "Données" }),
      h("div", { class: "btn-row" },
        h("button", {
          class: "secondary", text: "Exporter en JSON",
          onclick: function () { download("tabletop-tracker-export.json", TTT.store.exportJSON(state()), "application/json"); }
        }),
        h("button", {
          class: "secondary", text: "Exporter les parties en CSV",
          onclick: function () { download("parties.csv", TTT.store.exportCSV(state()), "text/csv;charset=utf-8"); }
        }),
        h("label", { class: "btn secondary", style: "margin:0", text: "Importer un JSON", },
          h("input", {
            type: "file", accept: "application/json,.json", style: "display:none",
            onchange: function (ev) {
              const f = ev.target.files[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = function () {
                try {
                  TTT.store.importJSON(String(r.result));
                  location.href = "index.html?msg=" + encodeURIComponent("Données importées.");
                } catch (e) { alert("Import impossible : " + e.message); }
              };
              r.readAsText(f);
            }
          })
        ),
        h("button", {
          class: "danger", text: "Tout effacer",
          onclick: function () {
            if (!confirm("SUPPRIMER toutes les données (joueurs, jeux, parties) ? Cette action est irréversible.")) return;
            if (!confirm("Vraiment tout effacer ?")) return;
            localStorage.removeItem(TTT.store.KEY);
            location.href = "index.html?msg=" + encodeURIComponent("Données effacées.");
          }
        })
      )
    ));
  });
})();
