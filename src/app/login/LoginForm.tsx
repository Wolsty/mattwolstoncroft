"use client";

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

  const canSubmit = !loading && password.length > 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password.");
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
    <main
      id="main"
      className="mx-auto w-full max-w-content px-6 md:px-10"
    >
      <section className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-16">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <h1 className="display" style={{ lineHeight: 0.95 }}>
            <span className="block">Matthew</span>
            <span className="block">Wolstoncroft</span>
          </h1>

          <p
            className="mt-8 italic font-body"
            style={{
              fontSize: "var(--type-tension)",
              color: "var(--fg-muted)",
              lineHeight: 1.3,
            }}
          >
            This site is password-protected. Enter to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-10 w-full text-left">
            <label htmlFor="site-password" className="meta block">
              Password
            </label>
            <input
              id="site-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="••••••••"
              className="field mt-2"
              style={{
                fontFamily:
                  '"SFMono-Regular", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: "var(--type-tension)",
                letterSpacing: 0,
              }}
              aria-invalid={error ? true : false}
              aria-describedby={error ? "login-error" : "login-hint"}
            />

            <div className="mt-3 flex items-baseline justify-between gap-6">
              <p
                id={error ? "login-error" : "login-hint"}
                role={error ? "alert" : undefined}
                className="meta"
                style={{ color: error ? "var(--fg-error)" : "var(--fg-muted)" }}
              >
                {error || "Press Enter"}
              </p>
              <button
                type="submit"
                disabled={!canSubmit}
                className="link-underline font-body"
                style={{
                  fontSize: "var(--type-tension)",
                  color: "var(--fg)",
                  opacity: canSubmit ? 1 : 0.35,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  background: "transparent",
                  border: 0,
                  padding: 0,
                }}
              >
                {loading ? "…" : "Enter →"}
              </button>
            </div>
          </form>

          <p className="meta mt-10" style={{ color: "var(--fg-muted)" }}>
            <span className="italic">Don&rsquo;t have access?</span>{" "}
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("contact:open"))
              }
              className="link-underline"
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                letterSpacing: "inherit",
              }}
            >
              Get in touch
            </button>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
