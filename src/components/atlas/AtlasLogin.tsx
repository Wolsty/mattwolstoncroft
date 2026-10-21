"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./atlasLogin.module.css";

export function AtlasLogin() {
  const params = useSearchParams();
  // Same-origin Atlas paths only, so `next` can't be used as an open redirect.
  const raw = params.get("next") || "/atlas";
  const next = raw.startsWith("/atlas") && !raw.startsWith("//") ? raw : "/atlas";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/atlas-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Wrong password." : "The Atlas isn't set up to sign in yet.");
        setLoading(false);
        return;
      }
      window.location.href = next;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.title}>Atlas</h1>
        <p className={styles.lede}>Places I&rsquo;ve slept, skied, climbed and wandered.</p>
        <label htmlFor="atlas-password" className={styles.label}>
          Password
        </label>
        <input
          id="atlas-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          className={styles.input}
          aria-invalid={error ? true : false}
          aria-describedby="atlas-login-msg"
        />
        <div className={styles.row}>
          <p id="atlas-login-msg" role={error ? "alert" : undefined} className={error ? styles.error : styles.hint}>
            {error || "Press Enter"}
          </p>
          <button type="submit" className={styles.enter} disabled={!password || loading}>
            {loading ? "…" : "Enter →"}
          </button>
        </div>
      </form>
    </main>
  );
}
