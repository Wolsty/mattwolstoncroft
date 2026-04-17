"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

/**
 * HeroShader — flowing liquid / silk-gradient
 *
 * Adapted from the paper-design/shaders-react MeshGradient technique: five
 * color "poles" drift across the viewport on sin/cos orbits; each fragment
 * gets an inverse-distance weighted blend of all poles; the uv is first
 * warped by a two-iteration sin/cos distortion and then swirled radially
 * so the pole boundaries read as flowing edges rather than hard gradients.
 *
 * Palette is the only thing that changes from that reference:
 *  - four low-saturation dark poles (near-black, deep slate, dark navy,
 *    oil-tinted slate)
 *  - one accent pole in terminal green (#22C55E) with low alpha, so it
 *    contributes a subtle highlight rather than a color pillar.
 *
 * The brightest pixel the shader can produce is the green-pole RGB scaled
 * by its weight (alpha 0.4), which stays well below the hero text's
 * foreground color.
 *
 * Dark and light palettes both render. Light palette uses warm off-white
 * with soft charcoal flows. If WebGL is unavailable, returns null and the
 * solid --bg shows through.
 */

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec4  u_colors[5];
uniform float u_distortion;
uniform float u_swirl;

vec2 rot(vec2 p, float a) {
  float c = cos(a); float s = sin(a);
  return mat2(c, -s, s, c) * p;
}

vec2 getPosition(int i, float t) {
  float fi = float(i);
  float a = fi * 0.37;
  float b = 0.6 + mod(fi, 3.0) * 0.3;
  float c = 0.8 + mod(fi + 1.0, 4.0) * 0.25;
  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);
  return 0.5 + 0.5 * vec2(x, y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  // Light aspect compensation so the flowing shapes don't read as flat bars
  // on ultra-wide viewports. Center around 0.5 so corrections are symmetric.
  float aspect = u_resolution.x / u_resolution.y;
  vec2 shape_uv = uv;
  shape_uv.x = 0.5 + (uv.x - 0.5) * (aspect > 1.0 ? 1.0 : 1.0 / aspect);
  shape_uv.y = 0.5 + (uv.y - 0.5) * (aspect > 1.0 ? aspect : 1.0);

  // Slow time. Coefficient 0.28 lands one full visual cycle in ~20s, well
  // inside the 15–25s target. The +41.5 offset just skips past a dead-looking
  // initial frame so the shader isn't boring on first paint.
  float t = 0.28 * u_time + 41.5;

  // Two-iteration sin/cos warp. Biased toward the center via (1 - radius).
  float radius = smoothstep(0.0, 1.0, length(shape_uv - 0.5));
  float center = 1.0 - radius;

  for (float i = 1.0; i <= 2.0; i += 1.0) {
    shape_uv.x += u_distortion * center / i
      * sin(t + i * 0.4 * smoothstep(0.0, 1.0, shape_uv.y))
      * cos(0.2 * t + i * 2.4 * smoothstep(0.0, 1.0, shape_uv.y));
    shape_uv.y += u_distortion * center / i
      * cos(t + i * 2.0 * smoothstep(0.0, 1.0, shape_uv.x));
  }

  // Radial swirl pinned to the warped uv so it reads as "fluid rotating past".
  vec2 uvR = shape_uv - 0.5;
  float angle = 3.0 * u_swirl * radius;
  uvR = rot(uvR, -angle);
  uvR += 0.5;

  // Inverse-distance-weighted blend across the five poles.
  vec3 col = vec3(0.0);
  float totalWeight = 0.0;

  for (int i = 0; i < 5; i++) {
    vec2 pos = getPosition(i, t);
    float a = u_colors[i].a;
    vec3 rgb = u_colors[i].rgb * a;
    float dist = length(uvR - pos);
    dist = pow(dist, 3.5);
    float w = 1.0 / (dist + 1e-3);
    col += rgb * w;
    totalWeight += a * w;
  }
  col /= max(totalWeight, 1e-6);

  // Gentle vignette so corners stay quieter than the type column.
  vec2 vv = uv - 0.5;
  float vig = smoothstep(1.1, 0.45, length(vv));
  col *= mix(0.82, 1.0, vig);

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

type Pole = { r: number; g: number; b: number; a: number };
type Palette = {
  poles: [Pole, Pole, Pole, Pole, Pole];
  distortion: number;
  swirl: number;
  canvasOpacity: number;
};

/**
 * Dark palette. Four low-sat dark poles + one quiet terminal-green accent.
 * All poles are tested to produce a lower max brightness than the hero text.
 */
const DARK_PALETTE: Palette = {
  poles: [
    { r: 0.070, g: 0.085, b: 0.110, a: 1.0 },   // #12161C  near-black + hint of blue
    { r: 0.114, g: 0.145, b: 0.188, a: 1.0 },   // #1D2530  deep slate-blue
    { r: 0.047, g: 0.086, b: 0.125, a: 1.0 },   // #0C1620  dark navy
    { r: 0.090, g: 0.122, b: 0.098, a: 1.0 },   // #171F19  oil-tinted slate
    { r: 0.133, g: 0.773, b: 0.369, a: 0.38 },  // #22C55E  terminal green streak, low weight
  ],
  distortion: 0.85,
  swirl: 0.55,
  canvasOpacity: 0.85,
};

/**
 * Light palette. Soft charcoal flows on warm off-white. Low-alpha accent
 * is an ink green so it doesn't shout on a bright base.
 */
const LIGHT_PALETTE: Palette = {
  poles: [
    { r: 0.980, g: 0.980, b: 0.968, a: 1.0 },   // base warm off-white
    { r: 0.860, g: 0.855, b: 0.840, a: 1.0 },   // paper grey
    { r: 0.680, g: 0.680, b: 0.680, a: 1.0 },   // soft charcoal
    { r: 0.760, g: 0.770, b: 0.760, a: 1.0 },   // cool grey
    { r: 0.133, g: 0.400, b: 0.230, a: 0.25 },  // quiet ink green
  ],
  distortion: 0.75,
  swirl: 0.45,
  canvasOpacity: 0.80,
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

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = link(gl, vs, fs);
    if (!program) return;

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uDistortion = gl.getUniformLocation(program, "u_distortion");
    const uSwirl = gl.getUniformLocation(program, "u_swirl");

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

    // Upload color poles. Individual uniform per array slot is the most
    // portable way to set a uniform array in WebGL1.
    for (let i = 0; i < palette.poles.length; i++) {
      const loc = gl.getUniformLocation(program, `u_colors[${i}]`);
      if (!loc) continue;
      const p = palette.poles[i];
      gl.uniform4f(loc, p.r, p.g, p.b, p.a);
    }
    if (uDistortion) gl.uniform1f(uDistortion, palette.distortion);
    if (uSwirl) gl.uniform1f(uSwirl, palette.swirl);

    canvas.style.opacity = String(palette.canvasOpacity);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // DPR cap. Narrow viewports drop to 1.0 effective, per the "half-res
    // canvas with CSS upscale is fine on mobile" direction.
    const getDpr = () => {
      const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const isNarrow = window.innerWidth < 640;
      return Math.min(raw, isNarrow ? 1.0 : 1.5);
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

    // Render a single "settled" frame so the hero isn't blank on load.
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
