(function (root) {
  "use strict";

  const DEFAULT_SCORING = {
    rankPoints: [10, 7, 5, 3, 2, 1],
    complexityMultiplier: true,
    perfMode: "percentile", // "percentile" | "zscore"
    perfCoef: 10, // points de perf max (percentile=1 ou z clampe a 3 selon le mode)
  };

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function computeRanks(scores) {
    return scores.map((s) => 1 + scores.filter((x) => x > s).length);
  }

  function rankPointsFor(rank, config) {
    const rp = config.rankPoints && config.rankPoints.length ? config.rankPoints : DEFAULT_SCORING.rankPoints;
    const idx = Math.min(Math.max(rank - 1, 0), rp.length - 1);
    return rp[idx];
  }

  function weightFor(game, config) {
    const w = game && typeof game.complexity === "number" && game.complexity > 0 ? game.complexity : 1;
    return config.complexityMultiplier ? w : 1;
  }

  // Tous les scores bruts des parties PRECEDENTES de ce jeu (tous joueurs confondus)
  function historyScores(state, gameId, beforeDate) {
    const out = [];
    for (const m of state.matches) {
      if (m.gameId !== gameId) continue;
      if (beforeDate && m.date >= beforeDate) continue;
      for (const e of m.entries) out.push(e.score);
    }
    return out;
  }

  // Bonus dynamique : position du score dans l'historique du jeu.
  function perfPoints(history, score, config) {
    if (!history.length) return 0;
    const mode = config.perfMode === "zscore" ? "zscore" : "percentile";
    const coef = typeof config.perfCoef === "number" && config.perfCoef >= 0 ? config.perfCoef : DEFAULT_SCORING.perfCoef;
    if (mode === "zscore") {
      const mu = history.reduce((a, b) => a + b, 0) / history.length;
      const sigma = Math.sqrt(history.reduce((a, b) => a + (b - mu) * (b - mu), 0) / history.length);
      if (sigma < 1e-9) return score > mu ? coef : 0;
      const z = (score - mu) / sigma;
      return coef * Math.min(Math.max(z, 0), 3) / 3;
    }
    const below = history.filter((s) => s < score).length;
    return coef * (below / history.length);
  }

  function computeMatchResults(state, input) {
    const config = state.scoring || DEFAULT_SCORING;
    const game = state.games.find((g) => g.id === input.gameId) || { complexity: 1 };
    const weight = weightFor(game, config);
    const scores = input.entries.map((e) => e.score);
    const ranks = computeRanks(scores);
    const history = historyScores(state, input.gameId, input.date);
    const maxHist = history.length ? Math.max.apply(null, history) : null;
    return input.entries.map((e, i) => {
      const base = rankPointsFor(ranks[i], config);
      const perf = perfPoints(history, e.score, config);
      const isRecord = maxHist !== null && e.score > maxHist;
      return {
        playerId: e.playerId,
        score: e.score,
        rank: ranks[i],
        rankPoints: base,
        perf: round1(perf),
        points: round1((base + perf) * weight),
        isRecord,
      };
    });
  }

  function playerTotalPoints(state, playerId, filter) {
    let total = 0;
    for (const m of state.matches) {
      if (filter && !filter(m)) continue;
      for (const e of m.entries) {
        if (e.playerId === playerId) total += e.points || 0;
      }
    }
    return round1(total);
  }

  // Points d'une entrée selon le mode d'affichage :
  // "full" = points stockés (rang + perf) × poids ; "podium" = rang seul × poids (sans bonus de score)
  function entryPoints(state, match, entry, config, mode) {
    const game = state.games.find((g) => g.id === match.gameId) || { complexity: 1 };
    const weight = weightFor(game, config);
    if (mode === "podium") {
      const base = typeof entry.rankPoints === "number" ? entry.rankPoints : rankPointsFor(entry.rank, config);
      return round1(base * weight);
    }
    return entry.points || 0;
  }

  function leaderboard(state, filter, mode) {
    mode = mode || "full";
    const config = state.scoring || DEFAULT_SCORING;
    const rows = state.players.map((p) => {
      let points = 0;
      let matches = 0;
      let wins = 0;
      let podiums = 0;
      for (const m of state.matches) {
        if (filter && !filter(m)) continue;
        for (const e of m.entries) {
          if (e.playerId === p.id) {
            points += entryPoints(state, m, e, config, mode);
            matches += 1;
            if (e.rank === 1) wins += 1;
            if (e.rank <= 3) podiums += 1;
          }
        }
      }
      return {
        playerId: p.id,
        name: p.name,
        color: p.color,
        points: round1(points),
        matches,
        wins,
        podiums,
        winRate: matches ? wins / matches : 0,
      };
    });
    rows.sort((a, b) => b.points - a.points || b.wins - a.wins || String(a.name).localeCompare(String(b.name)));
    rows.forEach((r, i) => {
      r.rank = 1 + rows.slice(0, i).filter((x) => x.points > r.points).length;
    });
    return rows;
  }

  const api = {
    DEFAULT_SCORING,
    round1,
    computeRanks,
    rankPointsFor,
    weightFor,
    historyScores,
    perfPoints,
    entryPoints,
    computeMatchResults,
    playerTotalPoints,
    leaderboard,
  };

  root.TTT = root.TTT || {};
  root.TTT.scoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
