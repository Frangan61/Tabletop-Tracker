(function (root) {
  "use strict";

  const KEY = "ttt:v1";

  function defaultState() {
    return {
      version: 1,
      players: [],
      games: [],
      matches: [],
      tournaments: [],
      seeded: false,
      scoring: JSON.parse(JSON.stringify((root.TTT && root.TTT.scoring && root.TTT.scoring.DEFAULT_SCORING) || {
        rankPoints: [10, 7, 5, 3, 2, 1],
        complexityMultiplier: true,
        recordBonus: 5,
      })),
    };
  }

  function storage() {
    if (typeof localStorage !== "undefined") return localStorage;
    if (root.__tttMockStorage) return root.__tttMockStorage;
    throw new Error("localStorage indisponible");
  }

  function gameExists(state, g) {
    if (g.bggId && state.games.some((x) => x.bggId === g.bggId)) return true;
    const norm = (s) => String(s || "").toLowerCase();
    if (state.games.some((x) => norm(x.name) === norm(g.name))) return true;
    if (root.TTT.share && root.TTT.share.namesSimilar) {
      if (state.games.some((x) => root.TTT.share.namesSimilar(x.name, g.name))) return true;
    }
    return false;
  }

  // Ajoute les jeux de la liste de référence (50 populaires) qui manquent. Retourne le nb ajoutés.
  function seedDefaultGames(state) {
    const seeds = (root.TTT && root.TTT.SEED_GAMES) || [];
    let added = 0;
    for (const g of seeds) {
      if (gameExists(state, g)) continue;
      addGame(state, g);
      added++;
    }
    state.seeded = true;
    save(state);
    return added;
  }

  function load() {
    try {
      const raw = storage().getItem(KEY);
      if (!raw) {
        // Première ouverture : pré-charge la liste des 50 jeux populaires
        const st = defaultState();
        seedDefaultGames(st);
        return st;
      }
      const data = JSON.parse(raw);
      const base = defaultState();
      return {
        version: data.version || 1,
        players: Array.isArray(data.players) ? data.players : [],
        games: Array.isArray(data.games) ? data.games : [],
        matches: Array.isArray(data.matches) ? data.matches : [],
        tournaments: Array.isArray(data.tournaments) ? data.tournaments : [],
        seeded: !!data.seeded,
        scoring: Object.assign(base.scoring, data.scoring || {}),
      };
    } catch (e) {
      return defaultState();
    }
  }

  function save(state) {
    storage().setItem(KEY, JSON.stringify(state));
    return state;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  const PALETTE = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6", "#bfef45", "#469990", "#9a6324"];

  function nextColor(state) {
    return PALETTE[state.players.length % PALETTE.length];
  }

  function addPlayer(state, name) {
    const p = { id: uid(), name: name.trim(), color: nextColor(state), createdAt: new Date().toISOString() };
    state.players.push(p);
    save(state);
    return p;
  }

  function deletePlayer(state, id) {
    const used = state.matches.some((m) => m.entries.some((e) => e.playerId === id));
    if (used) throw new Error("Ce joueur participe à des parties : suppression impossible.");
    state.players = state.players.filter((p) => p.id !== id);
    save(state);
  }

  function normalizeTags(tags) {
    const seen = new Set();
    const out = [];
    for (const t of Array.isArray(tags) ? tags : String(tags || "").split(",")) {
      const clean = String(t).trim().replace(/\s+/g, " ");
      const key = clean.toLowerCase();
      if (clean && !seen.has(key) && out.length < 15) {
        seen.add(key);
        out.push(clean);
      }
    }
    return out;
  }

  function addGame(state, data) {
    const g = {
      id: uid(),
      name: data.name.trim(),
      bggId: data.bggId || null,
      complexity: typeof data.complexity === "number" ? data.complexity : 1,
      year: data.year || null,
      minPlayers: data.minPlayers || null,
      maxPlayers: data.maxPlayers || null,
      duration: typeof data.duration === "number" && data.duration > 0 ? Math.round(data.duration) : null,
      coop: !!data.coop || data.mode === "coop" || data.mode === "duo",
      duel: !!data.duel || data.mode === "duel" || data.mode === "duo",
      tags: normalizeTags(data.tags || []),
      image: data.image || null,
      createdAt: new Date().toISOString(),
    };
    state.games.push(g);
    save(state);
    return g;
  }

  function updateGame(state, id, fields) {
    const g = state.games.find((x) => x.id === id);
    if (!g) throw new Error("Jeu introuvable.");
    if (fields.tags) fields.tags = normalizeTags(fields.tags);
    Object.assign(g, fields);
    save(state);
    return g;
  }

  function deleteGame(state, id) {
    const used = state.matches.some((m) => m.gameId === id);
    if (used) throw new Error("Ce jeu a des parties enregistrées : suppression impossible.");
    state.games = state.games.filter((g) => g.id !== id);
    save(state);
  }

  function addMatch(state, input) {
    if (!input.gameId) throw new Error("Choisis un jeu.");
    if (!input.entries || input.entries.length < 2) throw new Error("Il faut au moins 2 joueurs.");
    const entries = root.TTT.scoring.computeMatchResults(state, input);
    const match = {
      id: uid(),
      gameId: input.gameId,
      date: input.date || new Date().toISOString().slice(0, 10),
      notes: input.notes || "",
      entries,
      coopResult: input.coopResult || null, // "win" | "loss" pour les jeux coopératifs
      teamScore: typeof input.teamScore === "number" ? input.teamScore : null,
      createdAt: new Date().toISOString(),
    };
    state.matches.push(match);
    state.matches.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt < b.createdAt ? -1 : 1));
    save(state);
    return match;
  }

  function deleteMatch(state, id) {
    state.matches = state.matches.filter((m) => m.id !== id);
    save(state);
  }

  // Supprime TOUTES les parties (scores globaux) ; joueurs et jeux conservés.
  function resetMatches(state) {
    state.matches = [];
    save(state);
    return state;
  }

  function addTournament(state, data) {
    const t = {
      id: uid(),
      gameId: data.gameId,
      seeding: !!data.seeding,
      nPools: data.nPools,
      qualifiedPerPool: data.qualifiedPerPool || 2,
      pools: data.pools, // [[playerId, ...], ...]
      createdAt: new Date().toISOString(),
    };
    state.tournaments.push(t);
    save(state);
    return t;
  }

  function deleteTournament(state, id) {
    state.tournaments = state.tournaments.filter((t) => t.id !== id);
    save(state);
  }

  function recalculateAll(state) {
    const sorted = state.matches.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt < b.createdAt ? -1 : 1));
    const fresh = { version: state.version, players: state.players, games: state.games, matches: [], tournaments: state.tournaments || [], scoring: state.scoring };
    for (const m of sorted) {
      const entries = root.TTT.scoring.computeMatchResults(fresh, { gameId: m.gameId, date: m.date, entries: m.entries });
      fresh.matches.push(Object.assign({}, m, { entries }));
    }
    fresh.matches = sorted.map((m) => fresh.matches.find((x) => x.id === m.id));
    save(fresh);
    return fresh;
  }

  function exportJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.players) || !Array.isArray(data.games) || !Array.isArray(data.matches)) {
      throw new Error("Fichier invalide : structure attendue {players, games, matches}.");
    }
    const base = defaultState();
    const state = {
      version: 1,
      players: data.players,
      games: data.games,
      matches: data.matches,
      tournaments: Array.isArray(data.tournaments) ? data.tournaments : [],
      scoring: Object.assign(base.scoring, data.scoring || {}),
    };
    save(state);
    return state;
  }

  function exportCSV(state) {
    const esc = (v) => {
      const s = String(v == null ? "" : v);
      return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = ["date;jeu;joueur;score;rang;points;bonus_record"];
    const sorted = state.matches.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const m of sorted) {
      const game = state.games.find((g) => g.id === m.gameId);
      for (const e of m.entries) {
        const p = state.players.find((x) => x.id === e.playerId);
        lines.push([m.date, game ? game.name : m.gameId, p ? p.name : e.playerId, e.score, e.rank, e.points, e.isRecord ? "oui" : "non"].map(esc).join(";"));
      }
    }
    return lines.join("\n");
  }

  const api = {
    KEY,
    defaultState,
    load,
    save,
    uid,
    addPlayer,
    deletePlayer,
    addGame,
    normalizeTags,
    updateGame,
    deleteGame,
    seedDefaultGames,
    gameExists,
    addMatch,
    deleteMatch,
    resetMatches,
    addTournament,
    deleteTournament,
    recalculateAll,
    exportJSON,
    importJSON,
    exportCSV,
  };

  root.TTT = root.TTT || {};
  root.TTT.store = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
