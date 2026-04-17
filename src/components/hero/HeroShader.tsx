"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

/**
 * HeroShader
 *
 * Slowly-drifting topographic contour lines rendered as a full-bleed WebGL
 * canvas behind the hero type. Near-monochrome palette with an occasional
 * terminal-green accent line. Reads as a moving topo map: clean hairlines
 * at regular elevation intervals that breathe and flow as the underlying
 * noise field drifts.
 *
 * - fBM noise field drifted by time; thresholded with fract() into iso-lines
 * - fwidth()-based anti-aliasing keeps lines at roughly one device pixel
 * - Every 6th line picks up a faint green tint
 * - 30 fps cap; DPR clamped (1.5 desktop / 1.25 mobile)
 * - IntersectionObserver pauses when the hero is offscreen
 * - visibilitychange pauses when the tab is hidden
 * - prefers-reduced-motion renders a single static frame
 * - Dark and light palettes both rendered; only fallback is if WebGL / OES
 *   derivatives are unavailable (returns null and shows solid --bg)
 */

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// NOTE: requires OES_standard_derivatives extension (WebGL1), which is
// ubiquitous on modern browsers. We enable it and fall back if the
// extension isn't available at runtime.
const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;

// Palette — passed from JS so we can switch dark/light without recompiling
uniform vec3 u_bg;        // background tint
uniform vec3 u_line;      // base contour color
uniform vec3 u_accent;    // accent color (green on dark, something quieter on light)
uniform float u_lineAlpha;   // strength of non-accent lines
uniform float u_accentAlpha; // strength of accent lines

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
    p = p * 2.03 + vec2(0.17, -0.11);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  // Slow drift: full cycle ~30s. Two-vector warp adds subtle parallax.
  float t = u_time * 0.035;
  vec2 q = p * 1.25;
  vec2 warp = vec2(
    fbm(q + vec2(t * 0.22, -t * 0.17)),
    fbm(q + vec2(-t * 0.18, t * 0.25) + 5.2)
  );
  float n = fbm(q + warp * 0.45);

  // Iso-contours: 12 bands across the field.
  const float BANDS = 12.0;
  float v = n * BANDS;
  float d = abs(fract(v) - 0.5);

  // fwidth() for resolution-independent line width (~1.0 device pixel).
  // Using fwidth on the unfracted v makes the line width scale naturally
  // with elevation gradient, so flat regions get softer lines and steep
  // regions get crisper ones — reads like an actual topo print.
  float aa = fwidth(v) * 0.75;
  float line = 1.0 - smoothstep(0.0, aa, d);

  // Every 6th band picks up the accent tint (index mod 6 == 0).
  float bandIdx = floor(v);
  float accent = step(5.5, mod(bandIdx, 6.0));

  // Compose: base bg, add the non-accent and accent contributions.
  vec3 col = u_bg;
  col = mix(col, u_line,   line * u_lineAlpha   * (1.0 - accent));
  col = mix(col, u_accent, line * u_accentAlpha * accent);

  // Gentle radial vignette so the corners don't fight the type.
  vec2 vv = uv - 0.5;
  float vig = smoothstep(1.05, 0.45, length(vv));
  col = mix(u_bg, col, mix(0.80, 1.0, vig));

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

type Palette = {
  bg: [number, number, number];
  line: [number, number, number];
  accent: [number, number, number];
  lineAlpha: number;
  accentAlpha: number;
  canvasOpacity: number;
};

const DARK_PALETTE: Palette = {
  // Near-black base matching --bg (#0E0E0E -> ~0.055)
  bg: [0.055, 0.055, 0.058],
  // Muted slate line, ~#434A52
  line: [0.262, 0.291, 0.322],
  // Terminal green #22C55E, slightly dimmed so it doesn't burn
  accent: [0.133, 0.67, 0.34],
  lineAlpha: 0.85,
  accentAlpha: 0.9,
  canvasOpacity: 0.8,
};

const LIGHT_PALETTE: Palette = {
  // Warm off-white matching --bg (#FAFAF7 -> ~0.98)
  bg: [0.98, 0.98, 0.97],
  // Charcoal line, ~#3A3A3C
  line: [0.227, 0.227, 0.235],
  // Quiet ink green so the accent still reads without shouting on light bg
  accent: [0.08, 0.42, 0.24],
  lineAlpha: 0.35,
  accentAlpha: 0.5,
  canvasOpacity: 0.7,
};

export function HeroShader() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const palette = theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    // Required for fwidth() in WebGL1.
    const derivExt = gl.getExtension("OES_standard_derivatives");
    if (!derivExt) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = link(gl, vs, fs);
    if (!program) return;

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uBg = gl.getUniformLocation(program, "u_bg");
    const uLine = gl.getUniformLocation(program, "u_line");
    const uAccent = gl.getUniformLocation(program, "u_accent");
    const uLineAlpha = gl.getUniformLocation(program, "u_lineAlpha");
    const uAccentAlpha = gl.getUniformLocation(program, "u_accentAlpha");

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

    // Palette uniforms — set once per mount (theme changes remount via deps).
    if (uBg) gl.uniform3f(uBg, palette.bg[0], palette.bg[1], palette.bg[2]);
    if (uLine) gl.uniform3f(uLine, palette.line[0], palette.line[1], palette.line[2]);
    if (uAccent) gl.uniform3f(uAccent, palette.accent[0], palette.accent[1], palette.accent[2]);
    if (uLineAlpha) gl.uniform1f(uLineAlpha, palette.lineAlpha);
    if (uAccentAlpha) gl.uniform1f(uAccentAlpha, palette.accentAlpha);

    canvas.style.opacity = String(palette.canvasOpacity);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // Render at least one frame so the hero isn't blank on load.
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

    let rafId = 0;
    let lastRender = 0;
    let inView = true;
    let tabVisible = typeof document !== "undefined" ? document.visibilityState === "visible" : true;
    const FRAME_MS = 1000 / 30;
    const startPerf = typeof performance !== "undefined" ? performance.now() : Date.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!inView || !tabVisible) return;
      if (now - lastRender < FRAME_MS) return;
      lastRender = now;
      draw((now - startPerf) / 1000);
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
      tabVisible = document.visibilityState === "visible";
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
        }}
      />
    </div>
  );
}
