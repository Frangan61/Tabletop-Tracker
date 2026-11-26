(function (root) {
  "use strict";

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function range(n) {
    return Array.from({ length: n }, (_, i) => i);
  }

  function pointsOf(board, id) {
    const r = board && board.find((x) => x.playerId === id);
    return r ? r.points : 0;
  }

  // Répartit ids en nPools poules équilibrées.
  // useSeeding : tri par points (classement) puis chapeaux 1-2 / 3-4 / 5-8... distribués
  // en serpentin sur les poules (style tirage au sort FIFA) -> les forts ne se rencontrent
  // théoriquement qu'en phase finale.
  function makePools(ids, nPools, useSeeding, board) {
    ids = ids.slice();
    if (ids.length < 2) return [ids];
    nPools = Math.max(2, Math.min(Math.floor(nPools) || 2, ids.length));
    const pools = range(nPools).map(() => []);

    if (useSeeding && board && board.length) {
      // Chapeaux FIFA : pot 0 = n°1, pot 1 = n°2-3, pot 2 = n°4-7, pot 3 = n°8-15...
      // Les petits chapeaux (taille < nPools) sont tirés dans des poules LIBRES
      // (jamais la poule d'une tête de série) ; les gros chapeaux en round-robin mélangé.
      const ordered = ids.slice().sort((a, b) => pointsOf(board, b) - pointsOf(board, a) || String(a).localeCompare(String(b)));
      const taken = new Set();
      let start = 0;
      let size = 1;
      let potIndex = 0;
      while (start < ordered.length) {
        const pot = ordered.slice(start, start + size);
        let order;
        if (potIndex === 0) {
          order = shuffle(range(nPools));
          taken.add(order[0]);
        } else if (pot.length < nPools) {
          const free = shuffle(range(nPools).filter((i) => !taken.has(i)));
          order = free.concat(shuffle(range(nPools).filter((i) => taken.has(i))));
          free.forEach((i) => taken.add(i));
        } else {
          order = shuffle(range(nPools));
        }
        pot.forEach((pid, i) => pools[order[i % nPools]].push(pid));
        start += size;
        size *= 2;
        potIndex++;
      }
    } else {
      shuffle(ids).forEach((pid, i) => pools[i % nPools].push(pid));
    }

    balance(pools);
    return pools;
  }

  function balance(pools) {
    for (;;) {
      pools.sort((a, b) => b.length - a.length);
      if (pools[0].length - pools[pools.length - 1].length <= 1) break;
      pools[pools.length - 1].push(pools[0].pop());
    }
  }

  const api = { shuffle, makePools, pointsOf };
  root.TTT = root.TTT || {};
  root.TTT.tournament = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
