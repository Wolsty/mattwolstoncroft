"use client";

import { useEffect, useRef, useState } from "react";

const ROTATING_QUESTIONS = [
  "How did LabNotes balance helpfulness and pedagogical integrity?",
  "What are the LabNotes integrity flags?",
  "What did you ship at Cengage?",
  "How do you approach AI UX design?",
];

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "streaming"; text: string }
  | { kind: "done"; text: string }
  | { kind: "error"; message: string };

export function HomepageChat() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cycle the placeholder every 4s — but only while the input is empty and
  // unfocused. Otherwise it distracts from the user's intent.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (query === "" && document.activeElement !== inputRef.current) {
        setPlaceholderIdx((i) => (i + 1) % ROTATING_QUESTIONS.length);
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [query]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: "loading" });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 429) {
          setState({
            kind: "error",
            message: "You've hit the rate limit for this hour. Try again later.",
          });
        } else {
          setState({
            kind: "error",
            message: body || "Something went wrong. Try again.",
          });
        }
        return;
      }

      // Stream response as text/plain chunks
      const reader = res.body?.getReader();
      if (!reader) {
        const text = await res.text();
        setState({ kind: "done", text });
        return;
      }
      const decoder = new TextDecoder();
      let acc = "";
      setState({ kind: "streaming", text: "" });
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setState({ kind: "streaming", text: acc });
      }
      setState({ kind: "done", text: acc });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({
        kind: "error",
        message:
          "I couldn't reach the assistant. If you're running the site locally, make sure ANTHROPIC_API_KEY is set.",
      });
    }
  };

  return (
    <section
      aria-label="Ask about Matthew's work"
      className="mt-12 md:mt-16"
    >
      <form onSubmit={onSubmit} className="rule-top pt-6">
        <label htmlFor="homepage-chat-input" className="meta mb-2 block">
          Ask about my work
        </label>
        <div className="flex items-center gap-3">
          <input
            id="homepage-chat-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ROTATING_QUESTIONS[placeholderIdx]}
            autoComplete="off"
            className="w-full bg-transparent py-2 font-body outline-none"
            style={{
              color: "var(--fg)",
              fontSize: "1.125rem",
              borderBottom: "1px solid var(--rule)",
            }}
          />
          <button
            type="submit"
            disabled={state.kind === "loading" || state.kind === "streaming"}
            className="link-underline font-body whitespace-nowrap"
            aria-label="Send question"
          >
            Ask →
          </button>
        </div>
      </form>

      <ChatResult state={state} />
    </section>
  );
}

function ChatResult({ state }: { state: State }) {
  if (state.kind === "idle") return null;

  if (state.kind === "loading") {
    return (
      <div
        className="mt-6 max-w-prose font-body"
        style={{ color: "var(--fg-muted)" }}
        aria-live="polite"
      >
        Thinking…
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div
        role="alert"
        className="mt-6 max-w-prose font-body"
        style={{ color: "var(--fg-muted)" }}
      >
        {state.message}
      </div>
    );
  }

  return (
    <div
      className="mt-6 max-w-prose font-body whitespace-pre-wrap"
      style={{ color: "var(--fg)", lineHeight: 1.55 }}
      aria-live="polite"
    >
      {state.text}
      {state.kind === "streaming" ? (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.55ch",
            height: "1em",
            marginLeft: "1px",
            verticalAlign: "-0.12em",
            background: "var(--accent)",
            animation: "chat-blink 900ms steps(2, start) infinite",
          }}
        />
      ) : null}
      <style>{`@keyframes chat-blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
