(function (root) {
  "use strict";

  function drawLineChart(canvas, points, opts) {
    drawMultiLineChart(canvas, [{ points: points.map((p) => p.y), color: (opts && opts.color) || "#4363d8" }], opts);
  }

  // series: [{ label, color, points: [y1, y2, ...] }]
  function drawMultiLineChart(canvas, series, opts) {
    opts = opts || {};
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 600;
    const cssH = canvas.clientHeight || 240;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);
    const all = series.flatMap((s) => s.points);
    if (all.length < 2) {
      ctx.fillStyle = "#8a8f98";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText("Pas assez de parties pour tracer une courbe.", 12, cssH / 2);
      return;
    }
    const padL = 44, padR = 12, padT = 14, padB = 26;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;
    let min = Math.min.apply(null, all);
    let max = Math.max.apply(null, all);
    if (min === max) { min -= 1; max += 1; }
    const maxLen = Math.max.apply(null, series.map((s) => s.points.length));
    const x = (i) => padL + (w * i) / Math.max(maxLen - 1, 1);
    const y = (v) => padT + h - ((v - min) / (max - min)) * h;

    ctx.strokeStyle = "#e3e6ea";
    ctx.fillStyle = "#8a8f98";
    ctx.font = "11px system-ui, sans-serif";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = min + ((max - min) * i) / 4;
      const yy = y(v);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + w, yy);
      ctx.stroke();
      ctx.fillText(String(Math.round(v * 10) / 10), 6, yy + 4);
    }

    series.forEach((s) => {
      ctx.strokeStyle = s.color || "#4363d8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.points.forEach((v, i) => {
        if (i === 0) ctx.moveTo(x(i), y(v));
        else ctx.lineTo(x(i), y(v));
      });
      ctx.stroke();
      ctx.fillStyle = s.color || "#4363d8";
      s.points.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(x(i), y(v), 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // légende
    let lx = padL + 6;
    const ly = cssH - 8;
    ctx.font = "12px system-ui, sans-serif";
    series.forEach((s) => {
      ctx.fillStyle = s.color || "#4363d8";
      ctx.fillRect(lx, ly - 8, 10, 3);
      ctx.fillStyle = "#cfd6e0";
      ctx.fillText(s.label || "", lx + 14, ly - 4);
      lx += 14 + ctx.measureText(s.label || "").width + 18;
    });
  }

  root.TTT = root.TTT || {};
  root.TTT.charts = { drawLineChart, drawMultiLineChart };
})(typeof window !== "undefined" ? window : globalThis);
