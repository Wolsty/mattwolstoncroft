"use client";

import { HeroObject } from "@/components/hero/HeroObject";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const params = useSearchParams();
  // Only allow same-origin paths. Reject protocol-relative ("//foo") and
  // absolute URLs to avoid an open-redirect through the `next` param.
  const rawNext = params.get("next") || "/";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || password.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password");
        setLoading(false);
        return;
      }
      // Full reload so middleware re-runs with the new cookie.
      window.location.href = nextPath;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate min-h-[80vh] pt-24 md:pt-36">
      <HeroObject />
      <div className="relative" style={{ zIndex: 1 }}>
        <h1 className="display" style={{ lineHeight: 0.95 }}>
          <span className="block">Matthew</span>
          <span className="block">Wolstoncroft</span>
        </h1>
        <form onSubmit={onSubmit} className="mt-8 max-w-prose">
          <label htmlFor="site-password" className="meta mb-2 block">
            Password
          </label>
          <div className="flex items-center gap-3">
            <input
              id="site-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent font-body outline-none"
              style={{
                border: "1px solid var(--rule)",
                color: "var(--fg)",
                padding: "0.65rem 0.9rem",
                borderRadius: 4,
                fontSize: "var(--type-tension)",
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
            <button
              type="submit"
              disabled={loading || password.length === 0}
              className="font-body"
              style={{
                border: "1px solid var(--rule)",
                color: "var(--fg)",
                padding: "0.65rem 1.1rem",
                borderRadius: 4,
                fontSize: "var(--type-tension)",
                opacity: loading || password.length === 0 ? 0.5 : 1,
                cursor:
                  loading || password.length === 0 ? "not-allowed" : "pointer",
                background: "transparent",
              }}
            >
              {loading ? "…" : "Enter"}
            </button>
          </div>
          {error ? (
            <p
              id="login-error"
              role="alert"
              className="meta mt-3"
              style={{ color: "var(--fg-muted)" }}
            >
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
