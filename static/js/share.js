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
            bestPlayers: game.bestPlayers || null,
            favorite: !!game.favorite,
            lowestScoreWins: !!game.lowestScoreWins,
            tags: game.tags || [],
            image: game.image || null,
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
        bestPlayers: typeof data.game.bestPlayers === "number" && data.game.bestPlayers >= 1 ? Math.round(data.game.bestPlayers) : null,
        favorite: !!data.game.favorite,
        lowestScoreWins: !!data.game.lowestScoreWins,
        tags: Array.isArray(data.game.tags) ? data.game.tags : [],
        image: typeof data.game.image === "string" && data.game.image ? data.game.image : null,
      },
      date: data.date,
      notes: typeof data.notes === "string" ? data.notes : "",
      coopResult: data.coopResult === "win" || data.coopResult === "loss" ? data.coopResult : null,
      teamScore: typeof data.teamScore === "number" ? data.teamScore : null,
      entries,
    };
  }

  function normalizeName(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  // "Catan" vs "Katan" -> true (évite les doublons), mais "Ticket to Ride" != "Ticket to Ride: Europe"
  function namesSimilar(a, b) {
    const x = normalizeName(a), y = normalizeName(b);
    if (!x || !y) return false;
    if (x === y) return true;
    const diff = Math.abs(x.length - y.length);
    const shorter = Math.min(x.length, y.length);
    if (shorter >= 5 && diff <= 3 && (x.includes(y) || y.includes(x))) return true;
    return diff <= 1 && levenshtein(x, y) <= 1;
  }

  // Importe un code dans le state courant : crée le jeu/les joueurs manquants,
  // RECTIFIE les infos du jeu existant si elles sont erronées/incomplètes,
  // détecte les doublons, recalcule rangs et points avec l'historique local.
  function importMatchCode(state, code, store) {
    const data = decodeMatch(code);

    let game = null;
    if (data.game.bggId) game = state.games.find((g) => g.bggId === data.game.bggId);
    if (!game) game = state.games.find((g) => g.name.toLowerCase() === data.game.name.toLowerCase());
    if (!game) game = state.games.find((g) => namesSimilar(g.name, data.game.name));
    let createdGame = false;
    let updatedGame = false;
    if (!game) {
      game = store.addGame(state, data.game);
      createdGame = true;
    } else {
      // Jeu déjà connu : on rectifie les champs erronés/incomplets avec ceux du code
      const fields = {};
      if (!game.bggId && data.game.bggId) fields.bggId = data.game.bggId;
      if (data.game.complexity > 0) fields.complexity = data.game.complexity;
      if (data.game.year && !game.year) fields.year = data.game.year;
      if (data.game.minPlayers && !game.minPlayers) fields.minPlayers = data.game.minPlayers;
      if (data.game.maxPlayers && !game.maxPlayers) fields.maxPlayers = data.game.maxPlayers;
      if (data.game.duration && !game.duration) fields.duration = data.game.duration;
      if (data.game.image && !game.image) fields.image = data.game.image;
      if (data.game.tags && data.game.tags.length) fields.tags = [...(game.tags || []), ...data.game.tags];
      if (data.game.coop) fields.coop = true;
      if (data.game.duel) fields.duel = true;
      if (data.game.lowestScoreWins) fields.lowestScoreWins = true;
      if (data.game.bestPlayers && data.game.bestPlayers !== game.bestPlayers) fields.bestPlayers = data.game.bestPlayers;
      if (data.game.favorite) fields.favorite = true;
      if (Object.keys(fields).length) {
        store.updateGame(state, game.id, fields);
        updatedGame = true;
      }
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
    return { duplicate: false, match, createdGame, updatedGame, createdPlayers, game };
  }

  const api = { PREFIX, encodeMatch, decodeMatch, importMatchCode, namesSimilar, b64urlEncode, b64urlDecode };
  root.TTT = root.TTT || {};
  root.TTT.share = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
