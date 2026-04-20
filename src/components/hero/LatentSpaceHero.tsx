"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

/**
 * LatentSpaceHero — cursor-reactive "points crystallizing out of noise".
 *
 * A field of points drifts slowly in 3D latent space. Points far from the
 * cursor remain dim, disconnected noise. Points near the cursor brighten
 * and connect to their nearest neighbors, forming transient wireframe
 * structure that dissolves again as the cursor moves on.
 *
 * Shares the same visual language and lifecycle concerns as HeroObject:
 *  - Transparent canvas, theme-aware line color.
 *  - Paused when off-screen, when the tab is hidden, or under reduced motion.
 *  - Horizontal offset so the wireframe sits right-of-center on desktop.
 */

const N = 26; // point count — balance between density and shader cost

const VERT = `
attribute vec3 a_position;
attribute vec2 a_uv;
varying vec2 v_texcoord;
void main() {
  gl_Position = vec4(a_position, 1.0);
  v_texcoord = a_uv;
}
`;

const FRAG = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_time;
uniform vec3 u_lineColor;
uniform float u_mouseActive; // 0 = no user cursor, 1 = user is driving

#define N ${N}
#define RADIUS 0.42   // cursor influence radius in normalized coords
#define EDGE_MAX 0.34 // only connect points closer than this in 2D

mat3 rotateX(float a){float s=sin(a),c=cos(a);return mat3(1.,0.,0., 0.,c,-s, 0.,s,c);}
mat3 rotateY(float a){float s=sin(a),c=cos(a);return mat3(c,0.,s, 0.,1.,0., -s,0.,c);}

vec2 coord(in vec2 p){
  p = p / u_resolution.xy;
  if (u_resolution.x > u_resolution.y){
    p.x *= u_resolution.x / u_resolution.y;
    p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
  } else {
    p.y *= u_resolution.y / u_resolution.x;
    p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
  }
  p -= 0.5;
  return p;
}

vec2 project(vec3 p){
  float persp = 2.0 / (2.5 - p.z);
  return p.xy * persp;
}

float distToSegment(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Stable 3D hash — each point seeded by its index.
vec3 hash3(float n){
  return fract(sin(vec3(n, n + 1.7, n + 5.3)) * vec3(43758.5453, 22578.1459, 19642.3490));
}

// Drifted latent-space position for point i at time t.
// Base position is deterministic; drift is low-frequency noise so the field
// feels alive but never frantic.
vec3 pointPos(float i, float t){
  vec3 h = hash3(i * 11.1) * 2.0 - 1.0;         // base position in [-1,1]^3
  float phase = i * 2.39996;                    // golden-angle phase offset
  vec3 drift = vec3(
    sin(t * 0.30 + phase),
    cos(t * 0.23 + phase * 1.31),
    sin(t * 0.19 + phase * 0.77)
  ) * 0.18;
  return h * 0.85 + drift;
}

void main(){
  vec2 st = coord(gl_FragCoord.xy);
  vec2 mouse = coord(u_mouse * u_pixelRatio) * vec2(1.0, -1.0);

  float t = u_time * 0.5;
  // Slow global rotation so the field has motion even without cursor input.
  mat3 rot = rotateY(t * 0.10) * rotateX(t * 0.07);

  // Horizontal offset so the field sits right-of-center like the old mesh.
  vec2 sp = st - vec2(0.12, 0.0);
  vec2 smouse = mouse - vec2(0.12, 0.0);

  // Ambient activation point — a slow orbit that makes structure crystallize
  // across the field even when no user cursor is present. When the user
  // starts interacting, u_mouseActive crossfades the real cursor in.
  float ambT = u_time * 0.18;
  vec2 ambient = vec2(sin(ambT) * 0.22, cos(ambT * 0.83) * 0.16);

  // Pass 1: compute projected positions + cursor activation per point.
  // Activation combines ambient + user cursor (user dominates when active).
  vec2 proj[N];
  float act[N];
  for (int i = 0; i < N; i++) {
    vec3 p = rot * (pointPos(float(i), t) * 0.55);
    vec2 pp = project(p);
    proj[i] = pp;
    float dA = distance(pp, ambient);
    float dM = distance(pp, smouse);
    float aAmb = (1.0 - smoothstep(0.0, RADIUS, dA)) * 0.65;
    float aUser = 1.0 - smoothstep(0.0, RADIUS, dM);
    act[i] = mix(aAmb, max(aAmb * 0.4, aUser), u_mouseActive);
  }

  float alpha = 0.0;

  // Pass 2: draw each point as a small dot. Brighter baseline so the noise
  // field reads clearly at rest, and pops further when activated.
  for (int i = 0; i < N; i++) {
    float baseline = 0.48;
    float lit = baseline + act[i] * 0.80;
    float d = distance(sp, proj[i]);
    float dot = smoothstep(0.014, 0.005, d);
    // A soft halo when fully lit — makes activation feel energetic.
    float halo = smoothstep(0.050, 0.010, d) * act[i] * 0.45;
    alpha += dot * lit + halo;
  }

  // Pass 3: draw edges between points that are BOTH cursor-activated AND
  // spatially close. This is the "crystallization" — structure appears only
  // where the cursor is looking.
  for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
      if (j <= i) continue;
      float pairAct = min(act[i], act[j]);
      if (pairAct < 0.04) continue;
      float d2 = distance(proj[i], proj[j]);
      if (d2 > EDGE_MAX) continue;
      float line = 1.0 - smoothstep(0.0015, 0.0045, distToSegment(sp, proj[i], proj[j]));
      // Edges fade with both cursor activation and pair distance — short,
      // strong pairs pop; long, weak pairs stay ghostly.
      float falloff = 1.0 - smoothstep(EDGE_MAX * 0.5, EDGE_MAX, d2);
      alpha += line * pairAct * falloff * 0.85;
    }
  }

  // Global damp so the hero text stays dominant.
  alpha = clamp(alpha, 0.0, 1.0) * 0.85;
  gl_FragColor = vec4(u_lineColor, alpha);
}
`;

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

    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        // eslint-disable-next-line no-console
        console.warn("Shader compile failed:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uDpr = gl.getUniformLocation(prog, "u_pixelRatio");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uLineColor = gl.getUniformLocation(prog, "u_lineColor");
    const uMouseActive = gl.getUniformLocation(prog, "u_mouseActive");

    const positions = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(prog, "a_uv");
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const maxDpr = mobile ? 1 : 2;
    const getDpr = () => Math.min(window.devicePixelRatio || 1, maxDpr);

    const mouse = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    const startTime = Date.now();
    let rafId: number | null = null;
    let lastFrame = 0;
    let inView = true;
    let tabVisible = !document.hidden;
    let lastTime = performance.now();
    const frameMs = 1000 / 30;
    // Crossfade between ambient orbit and real cursor. Rises to 1 while the
    // user is moving their mouse, decays back to 0 after they stop so the
    // ambient crystallization smoothly resumes.
    let mouseActive = 0;
    let lastMouseMoveAt = 0;

    const resize = () => {
      const dpr = getDpr();
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Seed mouse off-screen so the field starts in its calm "noise" state.
      mouse.x = -9999;
      mouse.y = -9999;
      smooth.x = mouse.x;
      smooth.y = mouse.y;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = "touches" in e ? e.touches[0] : e;
      if (!t) return;
      mouse.x = t.clientX - rect.left;
      mouse.y = t.clientY - rect.top;
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

    const lineColor = theme === "dark" ? [0.88, 0.86, 0.80] : [0.16, 0.18, 0.20];

    const draw = (tSeconds: number) => {
      const dpr = getDpr();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uMouse, smooth.x, smooth.y);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uTime, tSeconds);
      gl.uniform3f(uLineColor, lineColor[0], lineColor[1], lineColor[2]);
      gl.uniform1f(uMouseActive, mouseActive);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    function animate(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const k = 8;
      smooth.x += (mouse.x - smooth.x) * k * dt;
      smooth.y += (mouse.y - smooth.y) * k * dt;

      // mouseActive ramps up while the user has moved recently, decays back
      // to 0 over ~1.5s of stillness so the ambient orbit smoothly takes over.
      const sinceMove = now - lastMouseMoveAt;
      const target = sinceMove < 100 ? 1 : sinceMove > 1500 ? 0 : 1 - (sinceMove - 100) / 1400;
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
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
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
