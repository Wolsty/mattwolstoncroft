"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Mesh } from "three";
import { useTheme } from "@/lib/theme";

/**
 * HeroObject — a single thin torus-knot wire rotating slowly behind the hero
 * name. One continuous curve bent through space, no surface shading, no fill.
 *
 * - Geometry: TorusKnotGeometry(radius=1, tube=0.01, tubularSegments=400,
 *   radialSegments=8, p=2, q=3). Tube radius is tiny so the knot reads as a
 *   line rather than a solid.
 * - Motion: constant angular velocity around a tilted axis; one revolution
 *   every 25 seconds. No easing, no bob.
 * - Layout: canvas offset to the right third on desktop so the left-aligned
 *   hero name breathes. Full-bleed on mobile.
 * - Palette: muted slate in dark, dark charcoal in light. MeshBasicMaterial,
 *   no fresnel rim (kept simple and honest — no glow).
 * - Paused when reduced-motion is requested, when the hero scrolls offscreen,
 *   or when the tab is hidden. frameloop="demand" freezes the last frame.
 */

const ROTATION_AXIS = new Vector3(0.5, 1, 0.2).normalize();
const ANGULAR_VELOCITY = (Math.PI * 2) / 25; // 25s per revolution

function Knot({
  color,
  paused,
  scale,
}: {
  color: string;
  paused: boolean;
  scale: number;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (paused || !meshRef.current) return;
    meshRef.current.rotateOnAxis(ROTATION_AXIS, ANGULAR_VELOCITY * delta);
  });

  return (
    <mesh ref={meshRef} rotation={[0.35, 0.45, 0]} scale={scale}>
      <torusKnotGeometry args={[1, 0.01, 400, 8, 2, 3]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export function HeroObject() {
  const { theme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(true);
  const [desktop, setDesktop] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dm = window.matchMedia("(min-width: 768px)");
    setReducedMotion(rm.matches);
    setDesktop(dm.matches);
    const onRm = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const onDm = (e: MediaQueryListEvent) => setDesktop(e.matches);
    rm.addEventListener("change", onRm);
    dm.addEventListener("change", onDm);
    return () => {
      rm.removeEventListener("change", onRm);
      dm.removeEventListener("change", onDm);
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "0px" },
    );
    io.observe(el);
    const onVis = () => {
      if (document.hidden) setInView(false);
      else {
        // re-check intersection when tab becomes visible again
        const rect = el.getBoundingClientRect();
        setInView(rect.bottom > 0 && rect.top < window.innerHeight);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const color = theme === "dark" ? "#525a64" : "#2a2e33";
  const paused = reducedMotion || !inView;
  const scale = desktop ? 0.85 : 1.1;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 md:left-auto md:right-0 md:w-[55%]"
      style={{ zIndex: 0 }}
    >
      <Canvas
        dpr={desktop ? [1, 2] : 1}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 35, position: [0, 0, 4] }}
        frameloop={paused ? "demand" : "always"}
      >
        <Knot color={color} paused={paused} scale={scale} />
      </Canvas>
    </div>
  );
}
