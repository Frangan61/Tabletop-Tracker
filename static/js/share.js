(function (root) {
  "use strict";

  const PREFIX = "TTT1:";

  function b64urlEncode(str) {
    let b64;
    if (typeof Buffer !== "undefined") b64 = Buffer.from(str, "utf8").toString("base64");
    else b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function b64urlDecode(b64) {
    const s = b64.replace(/-/g, "+").replace(/_/g, "/");
    if (typeof Buffer !== "undefined") return Buffer.from(s, "base64").toString("utf8");
    return decodeURIComponent(escape(atob(s)));
  }

  // Encode une partie en code partageable (résolution par noms, pas par id interne)
  function encodeMatch(state, matchId) {
    const m = state.matches.find((x) => x.id === matchId);
    if (!m) throw new Error("Partie introuvable.");
    const game = state.games.find((g) => g.id === m.gameId);
    const payload = {
      v: 1,
      game: game
        ? {
            name: game.name,
            bggId: game.bggId || null,
            complexity: game.complexity,
            year: game.year || null,
            minPlayers: game.minPlayers || null,
            maxPlayers: game.maxPlayers || null,
            duration: game.duration || null,
            coop: !!game.coop,
            duel: !!game.duel,
            tags: game.tags || [],
          }
        : null,
      date: m.date,
      notes: m.notes || "",
      coopResult: m.coopResult || null,
      teamScore: typeof m.teamScore === "number" ? m.teamScore : null,
      entries: m.entries.map((e) => ({
        player: (state.players.find((p) => p.id === e.playerId) || { name: "?" }).name,
        score: e.score,
      })),
    };
    if (!payload.game) throw new Error("Jeu associé introuvable.");
    return PREFIX + b64urlEncode(JSON.stringify(payload));
  }

  function decodeMatch(code) {
    if (typeof code !== "string" || !code.trim().startsWith(PREFIX)) {
      throw new Error("Code invalide : il doit commencer par « " + PREFIX + " ».");
    }
    let data;
    try {
      data = JSON.parse(b64urlDecode(code.trim().slice(PREFIX.length)));
    } catch (e) {
      throw new Error("Code illisible (JSON invalide).");
    }
    if (!data || data.v !== 1 || !data.game || !data.game.name || !Array.isArray(data.entries) || data.entries.length < 2) {
      throw new Error("Code invalide : structure de partie non reconnue.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || "")) throw new Error("Code invalide : date manquante.");
    const entries = data.entries.map((e) => {
      const score = parseFloat(e.score);
      if (!e.player || typeof e.player !== "string" || isNaN(score)) throw new Error("Code invalide : joueur/score manquant.");
      return { player: e.player.trim(), score };
    });
    return {
      game: {
        name: String(data.game.name),
        bggId: data.game.bggId || null,
        complexity: typeof data.game.complexity === "number" && data.game.complexity > 0 ? data.game.complexity : 1,
        year: data.game.year || null,
        minPlayers: data.game.minPlayers || null,
        maxPlayers: data.game.maxPlayers || null,
        duration: typeof data.game.duration === "number" ? data.game.duration : null,
        coop: !!data.game.coop,
        duel: !!data.game.duel,
        tags: Array.isArray(data.game.tags) ? data.game.tags : [],
      },
      date: data.date,
      notes: typeof data.notes === "string" ? data.notes : "",
      coopResult: data.coopResult === "win" || data.coopResult === "loss" ? data.coopResult : null,
      teamScore: typeof data.teamScore === "number" ? data.teamScore : null,
      entries,
    };
  }

  // Importe un code dans le state courant : crée le jeu/les joueurs manquants,
  // détecte les doublons, recalcule rangs et points avec l'historique local.
  function importMatchCode(state, code, store) {
    const data = decodeMatch(code);

    let game = null;
    if (data.game.bggId) game = state.games.find((g) => g.bggId === data.game.bggId);
    if (!game) game = state.games.find((g) => g.name.toLowerCase() === data.game.name.toLowerCase());
    let createdGame = false;
    if (!game) {
      game = store.addGame(state, data.game);
      createdGame = true;
    }

    const createdPlayers = [];
    const entries = data.entries.map((e) => {
      let p = state.players.find((x) => x.name.toLowerCase() === e.player.toLowerCase());
      if (!p) {
        p = store.addPlayer(state, e.player);
        createdPlayers.push(p.name);
      }
      return { playerId: p.id, score: e.score };
    });

    const duplicate = state.matches.some(
      (m) =>
        m.gameId === game.id &&
        m.date === data.date &&
        m.entries.length === entries.length &&
        m.entries.every((e) => entries.some((x) => x.playerId === e.playerId && x.score === e.score))
    );
    if (duplicate) return { duplicate: true, match: null };

    const match = store.addMatch(state, {
      gameId: game.id,
      date: data.date,
      notes: data.notes,
      entries,
      coopResult: data.coopResult,
      teamScore: data.teamScore,
    });
    return { duplicate: false, match, createdGame, createdPlayers, game };
  }

  const api = { PREFIX, encodeMatch, decodeMatch, importMatchCode, b64urlEncode, b64urlDecode };
  root.TTT = root.TTT || {};
  root.TTT.share = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
