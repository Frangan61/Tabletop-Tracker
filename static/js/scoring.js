(function (root) {
  "use strict";

  const DEFAULT_SCORING = {
    rankPoints: [10, 7, 5, 3, 2, 1],
    complexityMultiplier: true,
    recordBonus: 5,
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

  function bestScoreBefore(state, playerId, gameId, beforeDate) {
    let best = null;
    for (const m of state.matches) {
      if (m.gameId !== gameId) continue;
      if (beforeDate && m.date >= beforeDate) continue;
      for (const e of m.entries) {
        if (e.playerId === playerId && (best === null || e.score > best)) best = e.score;
      }
    }
    return best;
  }

  function computeMatchResults(state, input) {
    const config = state.scoring || DEFAULT_SCORING;
    const game = state.games.find((g) => g.id === input.gameId) || { complexity: 1 };
    const weight = weightFor(game, config);
    const scores = input.entries.map((e) => e.score);
    const ranks = computeRanks(scores);
    return input.entries.map((e, i) => {
      const base = rankPointsFor(ranks[i], config);
      const rankPoints = round1(base * weight);
      const prevBest = bestScoreBefore(state, e.playerId, input.gameId, input.date);
      const isRecord = prevBest !== null && e.score > prevBest;
      const bonus = isRecord ? round1((config.recordBonus || 0) * weight) : 0;
      return {
        playerId: e.playerId,
        score: e.score,
        rank: ranks[i],
        points: round1(rankPoints + bonus),
        rankPoints,
        bonus,
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

  function leaderboard(state, filter) {
    const rows = state.players.map((p) => {
      let points = 0;
      let matches = 0;
      let wins = 0;
      let podiums = 0;
      for (const m of state.matches) {
        if (filter && !filter(m)) continue;
        for (const e of m.entries) {
          if (e.playerId === p.id) {
            points += e.points || 0;
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
    bestScoreBefore,
    computeMatchResults,
    playerTotalPoints,
    leaderboard,
  };

  root.TTT = root.TTT || {};
  root.TTT.scoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
