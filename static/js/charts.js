(function (root) {
  "use strict";

  function drawLineChart(canvas, points, opts) {
    opts = opts || {};
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 600;
    const cssH = canvas.clientHeight || 220;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);
    if (!points || points.length < 2) {
      ctx.fillStyle = "#8a8f98";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText("Pas assez de parties pour tracer une courbe.", 12, cssH / 2);
      return;
    }
    const padL = 44, padR = 12, padT = 14, padB = 26;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;
    const ys = points.map((p) => p.y);
    let min = Math.min.apply(null, ys);
    let max = Math.max.apply(null, ys);
    if (min === max) { min -= 1; max += 1; }
    const x = (i) => padL + (w * i) / (points.length - 1);
    const y = (v) => padT + h - ((v - min) / (max - min)) * h;

    ctx.strokeStyle = "#e3e6ea";
    ctx.fillStyle = "#8a8f98";
    ctx.font = "11px system-ui, sans-serif";
    ctx.lineWidth = 1;
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = min + ((max - min) * i) / steps;
      const yy = y(v);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + w, yy);
      ctx.stroke();
      ctx.fillText(String(Math.round(v * 10) / 10), 6, yy + 4);
    }

    ctx.strokeStyle = opts.color || "#4363d8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(x(i), y(p.y));
      else ctx.lineTo(x(i), y(p.y));
    });
    ctx.stroke();

    ctx.fillStyle = opts.color || "#4363d8";
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(x(i), y(p.y), 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const last = points[points.length - 1];
    ctx.fillText(String(last.y), Math.min(x(points.length - 1) + 6, cssW - 30), y(last.y) + 4);
  }

  root.TTT = root.TTT || {};
  root.TTT.charts = { drawLineChart };
})(typeof window !== "undefined" ? window : globalThis);
