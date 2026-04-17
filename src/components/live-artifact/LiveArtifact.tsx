"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHEMISTRY_SCRIPT, type Turn } from "./script";

type RenderedTurn =
  | { role: "student"; text: string; typing: boolean; done: boolean }
  | { role: "tutor"; text: string; visible: boolean };

// Timing constants
const STUDENT_CHAR_MS = 55;
const STUDENT_PRE_ROLL_MS = 280;
const TUTOR_FADE_MS = 220;
const TUTOR_PRE_ROLL_MS = 500;
// After any line finishes, pause before the next begins. Gives the reader
// time to absorb tutor responses (which carry the pedagogical weight).
const POST_STUDENT_GAP_MS = 600;
const POST_TUTOR_GAP_MS = 1500;
const HOLD_BEFORE_REPLAY_MS = 4000;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function LiveArtifact() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const reducedMotion = usePrefersReducedMotion();

  const [started, setStarted] = useState(false);
  const [turns, setTurns] = useState<RenderedTurn[]>(() =>
    CHEMISTRY_SCRIPT.map((t): RenderedTurn =>
      t.role === "student"
        ? { role: "student", text: "", typing: false, done: false }
        : { role: "tutor", text: t.text, visible: false },
    ),
  );
  const [finished, setFinished] = useState(false);
  const [runKey, setRunKey] = useState(0);

  // IntersectionObserver — start once on viewport entry
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (started) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setStarted(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  // Reset machine when runKey changes (replay)
  useEffect(() => {
    // Clear any outstanding timeouts from a previous run.
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];

    // Reset turn state to initial.
    setTurns(
      CHEMISTRY_SCRIPT.map((t): RenderedTurn =>
        t.role === "student"
          ? { role: "student", text: "", typing: false, done: false }
          : { role: "tutor", text: t.text, visible: false },
      ),
    );
    setFinished(false);
    // Cleanup on unmount / run change
    return () => {
      for (const t of timeoutsRef.current) clearTimeout(t);
      timeoutsRef.current = [];
    };
  }, [runKey]);

  // Drive the sequence once started
  useEffect(() => {
    if (!started) return;

    // Reduced motion: reveal everything immediately.
    if (reducedMotion) {
      setTurns(
        CHEMISTRY_SCRIPT.map((t): RenderedTurn =>
          t.role === "student"
            ? { role: "student", text: t.text, typing: false, done: true }
            : { role: "tutor", text: t.text, visible: true },
        ),
      );
      setFinished(true);
      return;
    }

    let cursor = 0; // elapsed ms offset
    const schedule = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, cursor + ms);
      timeoutsRef.current.push(id);
    };

    CHEMISTRY_SCRIPT.forEach((turn: Turn, idx) => {
      if (turn.role === "student") {
        // Pre-roll
        cursor += STUDENT_PRE_ROLL_MS;
        // Mark typing start
        schedule(0, () =>
          setTurns((prev) =>
            prev.map((p, i) =>
              i === idx && p.role === "student"
                ? { ...p, typing: true }
                : p,
            ),
          ),
        );
        // Type character-by-character
        const chars = Array.from(turn.text);
        chars.forEach((_, ci) => {
          const delay = (ci + 1) * STUDENT_CHAR_MS;
          schedule(delay, () =>
            setTurns((prev) =>
              prev.map((p, i) =>
                i === idx && p.role === "student"
                  ? { ...p, text: turn.text.slice(0, ci + 1) }
                  : p,
              ),
            ),
          );
        });
        cursor += chars.length * STUDENT_CHAR_MS;
        // Mark done (cursor off)
        schedule(0, () =>
          setTurns((prev) =>
            prev.map((p, i) =>
              i === idx && p.role === "student"
                ? { ...p, typing: false, done: true }
                : p,
            ),
          ),
        );
        cursor += POST_STUDENT_GAP_MS;
      } else {
        // Tutor line: pre-roll, then fade in
        cursor += TUTOR_PRE_ROLL_MS;
        schedule(0, () =>
          setTurns((prev) =>
            prev.map((p, i) =>
              i === idx && p.role === "tutor"
                ? { ...p, visible: true }
                : p,
            ),
          ),
        );
        cursor += TUTOR_FADE_MS + POST_TUTOR_GAP_MS;
      }
    });

    // After final line, wait HOLD_BEFORE_REPLAY_MS then show replay
    schedule(HOLD_BEFORE_REPLAY_MS, () => setFinished(true));

    return () => {
      for (const t of timeoutsRef.current) clearTimeout(t);
      timeoutsRef.current = [];
    };
  }, [started, reducedMotion, runKey]);

  const replay = () => setRunKey((k) => k + 1);

  const totalEstMs = useMemo(() => {
    let ms = 0;
    for (const t of CHEMISTRY_SCRIPT) {
      if (t.role === "student") {
        ms += STUDENT_PRE_ROLL_MS + t.text.length * STUDENT_CHAR_MS + POST_STUDENT_GAP_MS;
      } else {
        ms += TUTOR_PRE_ROLL_MS + TUTOR_FADE_MS + POST_TUTOR_GAP_MS;
      }
    }
    return ms;
  }, []);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="LabNotes tutor — live walkthrough"
      className="w-full max-w-[700px] mx-auto rounded p-6 md:p-8"
      style={{
        border: "1px solid var(--rule)",
        background: "var(--bg)",
        minHeight: 420,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="meta">LabNotes · Tutor session</span>
        <span className="meta" aria-hidden>
          Chemistry · Electron configuration
        </span>
      </div>

      <div className="space-y-5 font-body" style={{ fontSize: "1rem", lineHeight: 1.5 }}>
        {turns.map((t, i) => {
          if (t.role === "student") {
            const showCursor = t.typing || (started && !t.done && t.text === "");
            return (
              <div key={i}>
                <div className="meta mb-1">[Student]</div>
                <div style={{ color: "var(--fg)", whiteSpace: "pre-wrap" }}>
                  {t.text}
                  {showCursor ? <Cursor /> : null}
                </div>
              </div>
            );
          }
          return (
            <div
              key={i}
              style={{
                opacity: t.visible ? 1 : 0,
                transform: t.visible ? "none" : "translateY(4px)",
                transition: `opacity ${TUTOR_FADE_MS}ms ease-out, transform ${TUTOR_FADE_MS}ms ease-out`,
              }}
            >
              <div className="meta mb-1">[Tutor]</div>
              <div style={{ color: "var(--fg-muted)", whiteSpace: "pre-wrap" }}>
                {t.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end">
        {finished ? (
          <button
            type="button"
            onClick={replay}
            className="link-underline font-body"
            style={{ color: "var(--accent)" }}
          >
            Replay →
          </button>
        ) : started ? (
          <span className="meta" aria-hidden>
            Playing…
          </span>
        ) : null}
      </div>

      {/* Screen-reader accessible fallback — the script as a hidden transcript.
          Ensures the tension is consumable without motion/audio. */}
      <details className="sr-only">
        <summary>Full transcript</summary>
        {CHEMISTRY_SCRIPT.map((t, i) => (
          <p key={i}>
            <strong>{t.role === "student" ? "Student" : "Tutor"}:</strong> {t.text}
          </p>
        ))}
      </details>

      {/* Tell readers this exists to signal intent; hidden from AT. */}
      <span className="sr-only" aria-hidden>
        Estimated runtime {(totalEstMs / 1000).toFixed(0)} seconds.
      </span>
    </div>
  );
}

function Cursor() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: "0.55ch",
        height: "1em",
        marginLeft: "1px",
        verticalAlign: "-0.12em",
        background: "var(--accent)",
        animation: "la-blink 900ms steps(2, start) infinite",
      }}
    >
      <style>{`@keyframes la-blink { 50% { opacity: 0; } }`}</style>
    </span>
  );
}
