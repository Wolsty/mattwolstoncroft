"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./family.module.css";

export function FamilyLogin() {
  const params = useSearchParams();
  // Same-origin family paths only, so `next` can't be used as an open redirect.
  const raw = params.get("next") || "/family";
  const next = raw.startsWith("/family") && !raw.startsWith("//") ? raw : "/family";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "That’s not it. Check the message Matthew sent." : "The tree isn’t set up to sign in yet.");
        setLoading(false);
        return;
      }
      // A shared link to one person (#ed) survives the sign-in.
      window.location.href = next + window.location.hash;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <main className={styles.login}>
      <form className={styles.loginCard} onSubmit={onSubmit}>
        <p className="meta">Family · shared privately</p>
        <h1 className={`display ${styles.loginTitle}`}>The Wolstoncroft–Specht Family</h1>
        <p className={styles.intro}>Four family lines, from Lancashire, Hungary, Germany, Belgium and Italy, that met east of Pittsburgh.</p>
        <label htmlFor="family-password" className={styles.label}>
          Family password
        </label>
        <input
          id="family-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          className="field"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          aria-invalid={error ? true : false}
          aria-describedby="family-login-msg"
        />
        <div className={styles.loginRow}>
          <p id="family-login-msg" role={error ? "alert" : undefined} className={error ? styles.formError : "meta"}>
            {error || "Capital letters don’t matter"}
          </p>
          <button type="submit" className={styles.primary} disabled={!password || loading}>
            {loading ? "Opening…" : "Open the tree"}
          </button>
        </div>
      </form>
    </main>
  );
}
