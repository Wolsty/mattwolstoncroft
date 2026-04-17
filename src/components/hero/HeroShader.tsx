"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

/**
 * HeroShader
 *
 * Slow-moving fBM noise field rendered as a full-bleed canvas behind the
 * hero type. Near-monochrome dark palette (charcoal -> slate -> deep
 * blue/green) with an occasional faint terminal-green tracer and a soft
 * vignette. Reads as "surface of dark water at night."
 *
 * - 30 fps cap
 * - IntersectionObserver pauses when offscreen
 * - prefers-reduced-motion renders a single static frame
 * - Light mode returns null (falls back to solid --bg)
 * - Mobile and low-end: DPR capped at 1.5
 */

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;

uniform vec2  u_resolution;
uniform float u_time;

// hash / value noise
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 5-octave fBM
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

void main() {
  // Normalize to 0..1, preserve aspect in y via resolution
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  // Slow time: one full "breath" takes ~30s at scale 0.05
  float t = u_time * 0.04;

  // Two drifting noise layers for parallax-y motion
  float n1 = fbm(p * 1.6 + vec2(t * 0.35, -t * 0.22));
  float n2 = fbm(p * 2.8 + vec2(-t * 0.18, t * 0.30) + n1 * 0.6);

  // Low-contrast base: charcoal -> deep slate -> hint of deep blue/green
  vec3 cCharcoal = vec3(0.055, 0.058, 0.065);   // ~#0E0F10
  vec3 cSlate    = vec3(0.085, 0.098, 0.115);   // ~#16191D
  vec3 cDeepBlue = vec3(0.060, 0.085, 0.118);   // ~#10161E
  vec3 cDeepTeal = vec3(0.055, 0.098, 0.085);   // ~#0E1916

  // Soft blend driven by the noise fields
  vec3 col = mix(cCharcoal, cSlate, smoothstep(0.25, 0.85, n1));
  col = mix(col, cDeepBlue, smoothstep(0.45, 0.95, n2) * 0.65);
  col = mix(col, cDeepTeal, smoothstep(0.30, 0.80, n1 * n2) * 0.30);

  // Occasional, faint specular tracer in terminal green (#22C55E = ~0.133, 0.773, 0.369).
  // Thin ridge: high-frequency sharpened band of the noise, gated by a
  // very slow cos so tracers fade in and out every ~25s instead of persisting.
  float ridge = 1.0 - abs(n2 - 0.52) * 12.0;
  ridge = clamp(ridge, 0.0, 1.0);
  ridge = pow(ridge, 8.0);
  float gate = 0.5 + 0.5 * cos(u_time * 0.18 + n1 * 6.28);
  float tracer = ridge * gate * 0.10; // capped at 10% contribution
  col += vec3(0.133, 0.773, 0.369) * tracer;

  // Soft radial vignette pulls the eye toward the type column
  vec2 vv = uv - 0.5;
  float vig = smoothstep(0.95, 0.35, length(vv));
  col *= mix(0.70, 1.0, vig);

  // Subtle film grain keyed to time, very low amplitude
  float grain = (hash(gl_FragCoord.xy + u_time * 60.0) - 0.5) * 0.012;
  col += grain;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

export function HeroShader() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (theme !== "dark") return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = link(gl, vs, fs);
    if (!program) return;

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cap DPR for perf, especially on mobile
    const getDpr = () => {
      const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const isNarrow = window.innerWidth < 640;
      return Math.min(raw, isNarrow ? 1.25 : 1.5);
    };

    const resize = () => {
      const dpr = getDpr();
      const w = Math.max(1, Math.floor(container.clientWidth * dpr));
      const h = Math.max(1, Math.floor(container.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      if (uResolution) gl.uniform2f(uResolution, w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = (timeSec: number) => {
      if (uTime) gl.uniform1f(uTime, timeSec);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // Always render at least one frame so the hero isn't blank on load
    draw(0);

    if (reducedMotion) {
      return () => {
        ro.disconnect();
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      };
    }

    // Animate. Cap to ~30fps. Pause when offscreen.
    let rafId = 0;
    let lastRender = 0;
    let inView = true;
    const FRAME_MS = 1000 / 30;
    const startPerf = typeof performance !== "undefined" ? performance.now() : Date.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!inView) return;
      if (now - lastRender < FRAME_MS) return;
      lastRender = now;
      const t = (now - startPerf) / 1000;
      draw(t);
    };
    rafId = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inView = e.isIntersecting;
      },
      { threshold: 0.01 },
    );
    io.observe(container);

    const onVisibility = () => {
      inView = document.visibilityState === "visible" && inView;
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [theme]);

  // Light mode: don't render — fall back to the solid --bg
  if (theme !== "dark") return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          opacity: 0.55,
        }}
      />
    </div>
  );
}
