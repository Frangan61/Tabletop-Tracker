(function (root) {
  "use strict";

  function matchesOf(state, playerId) {
    const out = [];
    for (const m of state.matches) {
      const e = m.entries.find((x) => x.playerId === playerId);
      if (e) out.push({ match: m, entry: e, game: state.games.find((g) => g.id === m.gameId) });
    }
    out.sort((a, b) => (a.match.date < b.match.date ? 1 : a.match.date > b.match.date ? -1 : a.match.createdAt < b.match.createdAt ? 1 : -1));
    return out;
  }

  function streaks(history) {
    let longest = 0;
    let current = 0;
    for (const h of history) {
      if (h.entry.rank === 1) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    const currentStreak = history.length && history[0].entry.rank === 1 ? current : 0;
    return { longest, current: currentStreak };
  }

  function lastN(history, n) {
    const slice = history.slice(0, n);
    if (!slice.length) return null;
    const avg = (f) => slice.reduce((s, h) => s + f(h), 0) / slice.length;
    return {
      n: slice.length,
      avgPoints: Math.round(avg((h) => h.entry.points) * 10) / 10,
      avgRank: Math.round(avg((h) => h.entry.rank) * 100) / 100,
      winRate: slice.filter((h) => h.entry.rank === 1).length / slice.length,
      records: slice.filter((h) => h.entry.isRecord).length,
    };
  }

  function playerStats(state, playerId) {
    const history = matchesOf(state, playerId);
    const player = state.players.find((p) => p.id === playerId);
    const wins = history.filter((h) => h.entry.rank === 1).length;
    const podiums = history.filter((h) => h.entry.rank <= 3).length;
    const totalPoints = history.reduce((s, h) => s + h.entry.points, 0);

    let bestScore = null;
    for (const h of history) {
      if (!bestScore || h.entry.score > bestScore.entry.score) bestScore = h;
    }
    let bestPoints = null;
    for (const h of history) {
      if (!bestPoints || h.entry.points > bestPoints.entry.points) bestPoints = h;
    }

    const byGame = {};
    for (const h of history) {
      byGame[h.match.gameId] = byGame[h.match.gameId] || { game: h.game, count: 0, sumRank: 0, sumPoints: 0 };
      byGame[h.match.gameId].count += 1;
      byGame[h.match.gameId].sumRank += h.entry.rank;
      byGame[h.match.gameId].sumPoints += h.entry.points;
    }
    const games = Object.values(byGame)
      .map((g) => ({ game: g.game, count: g.count, avgRank: Math.round((g.sumRank / g.count) * 100) / 100, totalPoints: Math.round(g.sumPoints * 10) / 10 }))
      .sort((a, b) => b.count - a.count || a.avgRank - b.avgRank);

    // Classement général = catégorie compétitive (les parties coop sont à part)
    const board = root.TTT.scoring.leaderboard(state, null, "full", "versus");
    const row = board.find((r) => r.playerId === playerId);

    const vsHist = history.filter((h) => !(h.game && h.game.coop));
    const coopHist = history.filter((h) => h.game && h.game.coop);
    const coopWins = coopHist.filter((h) => h.entry.rank === 1).length;
    const coop = {
      matches: coopHist.length,
      wins: coopWins,
      losses: coopHist.length - coopWins,
      winRate: coopHist.length ? coopWins / coopHist.length : 0,
    };

    const evolution = [];
    let cum = 0;
    const chrono = history.slice().reverse();
    for (const h of chrono) {
      cum = Math.round((cum + h.entry.points) * 10) / 10;
      evolution.push({ date: h.match.date, label: (h.game ? h.game.name : "?") + " — " + h.match.date, points: h.entry.points, total: cum });
    }

    const vsPoints = vsHist.reduce((s, h) => s + h.entry.points, 0);
    return {
      player,
      matches: history.length,
      wins,
      podiums,
      winRate: history.length ? wins / history.length : 0,
      totalPoints: Math.round(vsPoints * 10) / 10,
      coop,
      globalRank: row ? row.rank : null,
      bestScore: bestScore ? { score: bestScore.entry.score, game: bestScore.game, date: bestScore.match.date } : null,
      bestPoints: bestPoints ? { points: bestPoints.entry.points, game: bestPoints.game, date: bestPoints.match.date } : null,
      streaks: streaks(history),
      last5: lastN(history, 5),
      last10: lastN(history, 10),
      games,
      history,
      evolution,
      recordsCount: history.filter((h) => h.entry.isRecord).length,
    };
  }

  // Filtre : uniquement les parties où TOUS les joueurs donnés étaient présents
  // (les parties avec d'autres joueurs en plus comptent quand même).
  function commonFilter(playerIds) {
    const set = new Set(playerIds);
    return (m) => [...set].every((id) => m.entries.some((e) => e.playerId === id));
  }

  // Comparaison de plusieurs joueurs (filtre de période + mode de points optionnels).
  // onlyCommon=true : on ne garde que les parties communes aux joueurs sélectionnés,
  // pour que la comparaison soit équitable (mêmes parties pour tout le monde).
  function comparePlayers(state, playerIds, filter, mode, onlyCommon) {
    const config = state.scoring || root.TTT.scoring.DEFAULT_SCORING;
    let f = filter || null;
    if (onlyCommon && playerIds.length >= 2) {
      const c = commonFilter(playerIds);
      f = (m) => (!filter || filter(m)) && c(m);
    }
    return playerIds.map((id) => {
      const player = state.players.find((p) => p.id === id);
      const hist = matchesOf(state, id).filter((h) => !f || f(h.match));
      const board = root.TTT.scoring.leaderboard(state, f, mode).find((r) => r.playerId === id);
      const wins = hist.filter((h) => h.entry.rank === 1).length;
      const podiums = hist.filter((h) => h.entry.rank <= 3).length;
      const avgRank = hist.length ? Math.round((hist.reduce((s, h) => s + h.entry.rank, 0) / hist.length) * 100) / 100 : null;
      const best = hist.length ? Math.max.apply(null, hist.map((h) => h.entry.score)) : null;
      const streak = streaks(hist);
      let cum = 0;
      const evolution = hist.slice().reverse().map((h) => {
        cum = Math.round((cum + root.TTT.scoring.entryPoints(state, h.match, h.entry, config, mode || "full")) * 10) / 10;
        return { date: h.match.date, y: cum };
      });
      return {
        player,
        points: board ? board.points : 0,
        matches: hist.length,
        wins,
        podiums,
        winRate: hist.length ? wins / hist.length : 0,
        avgRank,
        bestScore: best,
        currentStreak: streak.current,
        evolution,
      };
    });
  }

  // Face-à-face entre deux joueurs : uniquement les parties où ils sont tous les deux
  function headToHead(state, idA, idB, filter) {
    const common = [];
    for (const m of state.matches) {
      if (filter && !filter(m)) continue;
      const a = m.entries.find((e) => e.playerId === idA);
      const b = m.entries.find((e) => e.playerId === idB);
      if (a && b) common.push({ match: m, a, b, game: state.games.find((g) => g.id === m.gameId) });
    }
    common.sort((x, y) => (x.match.date < y.match.date ? -1 : 1));
    let winsA = 0, winsB = 0, ties = 0, sumA = 0, sumB = 0, ptsA = 0, ptsB = 0;
    for (const c of common) {
      if (c.a.rank < c.b.rank) winsA++;
      else if (c.b.rank < c.a.rank) winsB++;
      else ties++;
      sumA += c.a.score;
      sumB += c.b.score;
      ptsA += c.a.points || 0;
      ptsB += c.b.points || 0;
    }
    const n = common.length;
    const r1 = (x) => Math.round(x * 10) / 10;
    return {
      total: n,
      winsA,
      winsB,
      ties,
      avgScoreA: n ? r1(sumA / n) : null,
      avgScoreB: n ? r1(sumB / n) : null,
      ptsA: r1(ptsA),
      ptsB: r1(ptsB),
      last: n ? common[n - 1].match.date : null,
      matches: common,
    };
  }

  const api = { matchesOf, playerStats, comparePlayers, headToHead, commonFilter };
  root.TTT = root.TTT || {};
  root.TTT.stats = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
