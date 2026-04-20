"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

/**
 * LatentSpaceHero — cursor-reactive "points crystallizing out of noise".
 *
 * A field of points drifts in 3D latent space and projects to 2D. Points
 * far from the cursor read as dim, disconnected noise. Points near the
 * cursor brighten and connect to their neighbors — structure crystallizing.
 * When the user is idle, an ambient "ghost cursor" orbits the field so
 * there's always some structure forming and dissolving.
 *
 * Rendered with the 2D canvas API (previously WebGL). The shader version
 * cost O(pixels × N²) per frame and jankied older integrated GPUs. This
 * version draws the ~30 points and handful of active edges as primitives,
 * cost O(N² ≈ 676 pair checks) per frame total — orders of magnitude
 * cheaper. Same visual language, same lifecycle guards.
 */

const N = 26;          // point count
const RADIUS = 0.42;   // cursor influence radius (latent units, short axis = 1)
const EDGE_MAX = 0.34; // only connect points closer than this in 2D

function fract(x: number) {
  return x - Math.floor(x);
}

function hash3(n: number): [number, number, number] {
  return [
    fract(Math.sin(n) * 43758.5453),
    fract(Math.sin(n + 1.7) * 22578.1459),
    fract(Math.sin(n + 5.3) * 19642.349),
  ];
}

// Latent-space position for point i at time t: deterministic base + slow drift.
function pointPos(i: number, t: number): [number, number, number] {
  const [bx, by, bz] = hash3(i * 11.1);
  const phase = i * 2.39996;
  const dx = Math.sin(t * 0.30 + phase) * 0.18;
  const dy = Math.cos(t * 0.23 + phase * 1.31) * 0.18;
  const dz = Math.sin(t * 0.19 + phase * 0.77) * 0.18;
  return [
    (bx * 2 - 1) * 0.85 + dx,
    (by * 2 - 1) * 0.85 + dy,
    (bz * 2 - 1) * 0.85 + dz,
  ];
}

// Rotate by Y then X (matches the shader).
function rotateYX(
  p: [number, number, number],
  ay: number,
  ax: number,
): [number, number, number] {
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const cx = Math.cos(ax), sx = Math.sin(ax);
  const x1 = cy * p[0] + sy * p[2];
  const y1 = p[1];
  const z1 = -sy * p[0] + cy * p[2];
  return [x1, cx * y1 - sx * z1, sx * y1 + cx * z1];
}

// Simple perspective projection.
function project(p: [number, number, number]): [number, number] {
  const persp = 2.0 / (2.5 - p[2]);
  return [p[0] * persp, p[1] * persp];
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function LatentSpaceHero() {
  const { theme } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(rm.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    rm.addEventListener("change", onChange);
    return () => rm.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const maxDpr = mobile ? 1 : 2;
    const getDpr = () => Math.min(window.devicePixelRatio || 1, maxDpr);

    let width = 0;
    let height = 0;
    let dpr = 1;
    const mouse = { x: -9999, y: -9999 };
    let smoothX = -9999;
    let smoothY = -9999;
    // mouseActive: crossfade between ambient orbit and user cursor. Rises to
    // 1 while the user is moving, decays back to 0 after ~1.5s of stillness.
    let mouseActive = 0;
    let lastMouseMoveAt = -Infinity;
    const startTime = Date.now();
    let rafId: number | null = null;
    let lastFrame = 0;
    let inView = true;
    let tabVisible = !document.hidden;
    let lastTime = performance.now();
    const frameMs = 1000 / 30;

    const resize = () => {
      dpr = getDpr();
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Draw in CSS pixels regardless of DPR.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Park the cursor off-screen so the field starts in ambient mode.
      mouse.x = -9999;
      mouse.y = -9999;
      smoothX = mouse.x;
      smoothY = mouse.y;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ev = "touches" in e ? e.touches[0] : e;
      if (!ev) return;
      mouse.x = ev.clientX - rect.left;
      mouse.y = ev.clientY - rect.top;
      lastMouseMoveAt = performance.now();
    };
    window.addEventListener("mousemove", onMouse as EventListener);
    window.addEventListener("touchmove", onMouse as EventListener, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && rafId == null && tabVisible && !reducedMotion) {
          lastTime = performance.now();
          rafId = requestAnimationFrame(animate);
        }
      },
      { rootMargin: "0px" },
    );
    io.observe(wrap);

    const onVis = () => {
      tabVisible = !document.hidden;
      if (tabVisible && inView && rafId == null && !reducedMotion) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const colorRgb = theme === "dark" ? "224, 219, 204" : "41, 46, 51";

    // Buffers reused across frames — avoids per-frame allocation.
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const act = new Float32Array(N);

    const draw = (tSeconds: number) => {
      ctx.clearRect(0, 0, width, height);
      if (width === 0 || height === 0) return;

      // Mesh coord system: "1 latent unit" = short canvas axis in pixels.
      // Mesh center sits 0.12 scale-units right of canvas center (matches
      // the shader's horizontal offset so the hero name has breathing room).
      const scale = Math.min(width, height);
      const ox = width / 2 + 0.12 * scale;
      const oy = height / 2;

      const t = tSeconds * 0.5;
      const ay = t * 0.10;
      const ax = t * 0.07;

      // Ambient activation point — slow orbit in latent space.
      const ambT = tSeconds * 0.18;
      const ambX = Math.sin(ambT) * 0.22 * scale + ox;
      const ambY = Math.cos(ambT * 0.83) * 0.16 * scale + oy;

      const radiusPx = RADIUS * scale;

      // Pass 1: project + compute per-point activation.
      for (let i = 0; i < N; i++) {
        const base = pointPos(i, t);
        const rotated = rotateYX(base, ay, ax);
        rotated[0] *= 0.55;
        rotated[1] *= 0.55;
        rotated[2] *= 0.55;
        const [vx, vy] = project(rotated);
        const cx = vx * scale + ox;
        const cy = vy * scale + oy;
        px[i] = cx;
        py[i] = cy;

        const dA = Math.hypot(cx - ambX, cy - ambY);
        const dM = Math.hypot(cx - smoothX, cy - smoothY);
        const aAmb = (1 - smoothstep(0, radiusPx, dA)) * 0.65;
        const aUser = 1 - smoothstep(0, radiusPx, dM);
        // Crossfade: ambient at rest, user cursor when active (ambient
        // stays partially visible so activation from the user blends in).
        act[i] =
          mouseActive * Math.max(aAmb * 0.4, aUser) +
          (1 - mouseActive) * aAmb;
      }

      // Pass 2: edges. Only pairs where both endpoints are activated AND
      // spatially close — this is the "crystallization" moment.
      const edgeMaxPx = EDGE_MAX * scale;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.3;
      for (let i = 0; i < N; i++) {
        if (act[i] < 0.04) continue;
        for (let j = i + 1; j < N; j++) {
          const pairAct = Math.min(act[i], act[j]);
          if (pairAct < 0.04) continue;
          const dx = px[i] - px[j];
          const dy = py[i] - py[j];
          const d2 = Math.hypot(dx, dy);
          if (d2 > edgeMaxPx) continue;
          const falloff = 1 - smoothstep(edgeMaxPx * 0.5, edgeMaxPx, d2);
          // 0.85 matches the shader's edge-strength; second 0.85 is the
          // global alpha damp so the hero text stays dominant.
          const a = pairAct * falloff * 0.85 * 0.85;
          ctx.strokeStyle = `rgba(${colorRgb}, ${a})`;
          ctx.beginPath();
          ctx.moveTo(px[i], py[i]);
          ctx.lineTo(px[j], py[j]);
          ctx.stroke();
        }
      }

      // Pass 3: halos. Soft radial glows around activated points.
      const haloR = 0.050 * scale;
      const haloInner = 0.010 * scale;
      for (let i = 0; i < N; i++) {
        if (act[i] < 0.05) continue;
        const cx = px[i];
        const cy = py[i];
        const g = ctx.createRadialGradient(cx, cy, haloInner, cx, cy, haloR);
        const a = act[i] * 0.45 * 0.85;
        g.addColorStop(0, `rgba(${colorRgb}, ${a})`);
        g.addColorStop(1, `rgba(${colorRgb}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pass 4: dots. Baseline visible even at rest, brighter when activated.
      // Small radial gradient so the edge is soft (matches the shader's
      // smoothstep dot falloff at comparable sizes).
      const dotOuter = Math.max(2, 0.014 * scale);
      const dotCore = Math.max(0.8, 0.005 * scale);
      for (let i = 0; i < N; i++) {
        const cx = px[i];
        const cy = py[i];
        const lit = Math.min(1, 0.48 + act[i] * 0.80);
        const a = lit * 0.85;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotOuter);
        g.addColorStop(0, `rgba(${colorRgb}, ${a})`);
        g.addColorStop(dotCore / dotOuter, `rgba(${colorRgb}, ${a * 0.9})`);
        g.addColorStop(1, `rgba(${colorRgb}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, dotOuter, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    function animate(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const k = 8;
      smoothX += (mouse.x - smoothX) * k * dt;
      smoothY += (mouse.y - smoothY) * k * dt;

      const sinceMove = now - lastMouseMoveAt;
      const target =
        sinceMove < 100 ? 1 : sinceMove > 1500 ? 0 : 1 - (sinceMove - 100) / 1400;
      mouseActive += (target - mouseActive) * Math.min(1, dt * 4);

      if (now - lastFrame >= frameMs) {
        lastFrame = now;
        const t = (Date.now() - startTime) / 1000;
        draw(t);
      }

      if (inView && tabVisible && !reducedMotion) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
      }
    }

    if (reducedMotion) {
      draw(0);
    } else {
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse as EventListener);
      window.removeEventListener("touchmove", onMouse as EventListener);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [theme, reducedMotion]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 right-0"
      style={{ zIndex: 0, top: "100px" }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
