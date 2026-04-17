"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

/**
 * HeroObject — geometric wireframe with mouse-driven blur.
 *
 * Port of the 21st.dev "geometric-blur-mesh" reference. A single 3D
 * icosahedron (30 edges) projected to 2D, rotating slowly on time, with a
 * subtle mouse-influenced rotation nudge and an inverted blur effect: lines
 * near the cursor become softer/thicker, lines far from the cursor stay
 * crisp.
 *
 * Differences from the reference:
 *  - One shape only (icosahedron). No click-to-switch, no shape menu.
 *  - Theme-aware line color: muted slate in dark, charcoal in light.
 *  - Transparent canvas: the page background shows through everywhere the
 *    wireframe isn't.
 *  - Paused when off-screen, when the tab is hidden, or when the user
 *    requests reduced motion (static frame).
 *  - Offset to the right 55% on desktop so the left-aligned hero name has
 *    room; full-bleed on mobile.
 */

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

mat3 rotateX(float a){float s=sin(a),c=cos(a);return mat3(1.,0.,0., 0.,c,-s, 0.,s,c);}
mat3 rotateY(float a){float s=sin(a),c=cos(a);return mat3(c,0.,s, 0.,1.,0., -s,0.,c);}
mat3 rotateZ(float a){float s=sin(a),c=cos(a);return mat3(c,-s,0., s,c,0., 0.,0.,1.);}

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
  float persp = 2.0 / (2.0 - p.z);
  return p.xy * persp;
}

float distToSegment(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float drawLine(vec2 p, vec2 a, vec2 b, float thickness, float blur){
  float d = distToSegment(p, a, b);
  return smoothstep(thickness + blur, thickness - blur, d);
}

float drawIcosahedron(vec2 p, mat3 rotation, float scale, float thickness, float blur){
  float t = (1.0 + sqrt(5.0)) / 2.0;
  float s = 1.0 / sqrt(1.0 + t * t);
  vec3 v[12];
  v[0]  = vec3(-s,  t*s, 0.0);
  v[1]  = vec3( s,  t*s, 0.0);
  v[2]  = vec3(-s, -t*s, 0.0);
  v[3]  = vec3( s, -t*s, 0.0);
  v[4]  = vec3(0.0, -s,  t*s);
  v[5]  = vec3(0.0,  s,  t*s);
  v[6]  = vec3(0.0, -s, -t*s);
  v[7]  = vec3(0.0,  s, -t*s);
  v[8]  = vec3( t*s, 0.0, -s);
  v[9]  = vec3( t*s, 0.0,  s);
  v[10] = vec3(-t*s, 0.0, -s);
  v[11] = vec3(-t*s, 0.0,  s);
  for (int i = 0; i < 12; i++) { v[i] = rotation * (v[i] * scale); }

  float r = 0.0;
  r += drawLine(p, project(v[0]),  project(v[1]),  thickness, blur);
  r += drawLine(p, project(v[0]),  project(v[5]),  thickness, blur);
  r += drawLine(p, project(v[0]),  project(v[7]),  thickness, blur);
  r += drawLine(p, project(v[0]),  project(v[10]), thickness, blur);
  r += drawLine(p, project(v[0]),  project(v[11]), thickness, blur);
  r += drawLine(p, project(v[1]),  project(v[5]),  thickness, blur);
  r += drawLine(p, project(v[1]),  project(v[7]),  thickness, blur);
  r += drawLine(p, project(v[1]),  project(v[8]),  thickness, blur);
  r += drawLine(p, project(v[1]),  project(v[9]),  thickness, blur);
  r += drawLine(p, project(v[2]),  project(v[3]),  thickness, blur);
  r += drawLine(p, project(v[2]),  project(v[4]),  thickness, blur);
  r += drawLine(p, project(v[2]),  project(v[6]),  thickness, blur);
  r += drawLine(p, project(v[2]),  project(v[10]), thickness, blur);
  r += drawLine(p, project(v[2]),  project(v[11]), thickness, blur);
  r += drawLine(p, project(v[3]),  project(v[4]),  thickness, blur);
  r += drawLine(p, project(v[3]),  project(v[6]),  thickness, blur);
  r += drawLine(p, project(v[3]),  project(v[8]),  thickness, blur);
  r += drawLine(p, project(v[3]),  project(v[9]),  thickness, blur);
  r += drawLine(p, project(v[4]),  project(v[5]),  thickness, blur);
  r += drawLine(p, project(v[4]),  project(v[11]), thickness, blur);
  r += drawLine(p, project(v[4]),  project(v[9]),  thickness, blur);
  r += drawLine(p, project(v[5]),  project(v[11]), thickness, blur);
  r += drawLine(p, project(v[5]),  project(v[9]),  thickness, blur);
  r += drawLine(p, project(v[6]),  project(v[7]),  thickness, blur);
  r += drawLine(p, project(v[6]),  project(v[8]),  thickness, blur);
  r += drawLine(p, project(v[6]),  project(v[10]), thickness, blur);
  r += drawLine(p, project(v[7]),  project(v[10]), thickness, blur);
  r += drawLine(p, project(v[7]),  project(v[8]),  thickness, blur);
  r += drawLine(p, project(v[8]),  project(v[9]),  thickness, blur);
  r += drawLine(p, project(v[10]), project(v[11]), thickness, blur);
  return clamp(r, 0.0, 1.0);
}

void main(){
  vec2 st = coord(gl_FragCoord.xy);
  vec2 mouse = coord(u_mouse * u_pixelRatio) * vec2(1.0, -1.0);

  float mouseDist = length(st - mouse);
  float mouseInfluence = 1.0 - smoothstep(0.0, 0.5, mouseDist);

  float time = u_time * 0.2;
  mat3 rotation =
    rotateY(time + (mouse.x - 0.5) * mouseInfluence * 0.6) *
    rotateX(time * 0.7 + (mouse.y - 0.5) * mouseInfluence * 0.6) *
    rotateZ(time * 0.1);

  float scale = 0.62;
  // Inverted blur: lines near cursor feather out; lines far stay crisp.
  float blur = mix(0.0001, 0.05, mouseInfluence);
  float thickness = mix(0.002, 0.003, mouseInfluence);

  // Horizontal offset so the wireframe sits right-of-center.
  vec2 sp = st - vec2(0.12, 0.0);
  float shape = drawIcosahedron(sp, rotation, scale, thickness, blur);

  float dimming = 1.0 - mouseInfluence * 0.25;
  // Global alpha damp — keep the wireframe subtle enough to sit behind
  // the hero text without competing with it.
  float a = shape * dimming * 0.55;
  gl_FragColor = vec4(u_lineColor, a);
}
`;

export function HeroObject() {
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

    const resize = () => {
      const dpr = getDpr();
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Seed the mouse at center so the rest shape doesn't start skewed.
      mouse.x = w / 2;
      mouse.y = h / 2;
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

    const lineColor = theme === "dark" ? [0.42, 0.45, 0.50] : [0.16, 0.18, 0.20];

    const draw = (tSeconds: number) => {
      const dpr = getDpr();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uMouse, smooth.x, smooth.y);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uTime, tSeconds);
      gl.uniform3f(uLineColor, lineColor[0], lineColor[1], lineColor[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    function animate(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const k = 8;
      smooth.x += (mouse.x - smooth.x) * k * dt;
      smooth.y += (mouse.y - smooth.y) * k * dt;

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
      // Single static frame, no loop.
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
