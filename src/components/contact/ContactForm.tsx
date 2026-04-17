"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setState({
            kind: "error",
            message: "Too many messages from this address. Try again shortly.",
          });
          return;
        }
        setState({
          kind: "error",
          message: body?.error || "Couldn't send. Try again.",
        });
        return;
      }
      setState({ kind: "success" });
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setState({
        kind: "error",
        message: "Network error. Try again.",
      });
    }
  };

  if (state.kind === "success") {
    return (
      <p className="font-body" style={{ color: "var(--fg-muted)" }}>
        Got it — I&apos;ll get back to you.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="cf-name" className="meta block mb-1">Name</label>
        <input
          id="cf-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="w-full bg-transparent py-2 font-body outline-none"
          style={{ color: "var(--fg)", borderBottom: "1px solid var(--rule)" }}
        />
      </div>
      <div>
        <label htmlFor="cf-email" className="meta block mb-1">Email</label>
        <input
          id="cf-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full bg-transparent py-2 font-body outline-none"
          style={{ color: "var(--fg)", borderBottom: "1px solid var(--rule)" }}
        />
      </div>
      <div>
        <label htmlFor="cf-message" className="meta block mb-1">Message</label>
        <textarea
          id="cf-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-transparent py-2 font-body outline-none resize-y"
          style={{ color: "var(--fg)", borderBottom: "1px solid var(--rule)" }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="link-underline font-body"
        >
          {state.kind === "submitting" ? "Sending…" : "Send →"}
        </button>
        {state.kind === "error" ? (
          <p role="alert" className="meta" style={{ color: "var(--fg-muted)" }}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
