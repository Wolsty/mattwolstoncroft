"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Contribution, FamilyData, Status } from "@/lib/family/types";
import styles from "./family.module.css";

type Item = Contribution & { status: Status };
type State = { items: Item[]; portraits: Record<string, string>; resolved: string[]; storeReady: boolean };

const KIND: Record<Contribution["kind"], string> = {
  memory: "Memory",
  photo: "Photos",
  correction: "Correction",
  answer: "Answer",
  person: "New relative",
};

/** Matthew's queue: approve or hide what family sent, pick portraits, close questions. */
export function FamilyReview({ data }: { data: FamilyData }) {
  const [state, setState] = useState<State | null>(null);
  const [owner, setOwner] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Status>("pending");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/family/contributions", { cache: "no-store" });
    const j = await res.json();
    setOwner(Boolean(j.owner));
    if (j.owner) setState(j);
  }, []);

  useEffect(() => {
    load().catch(() => setOwner(false));
  }, [load]);

  const act = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/family/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) await load();
  };

  if (owner === null) return <main className={styles.review}><p className="meta">Loading…</p></main>;
  if (!owner) return <OwnerSignIn onDone={load} />;
  if (!state) return null;

  const people = data.people;
  const counts = { pending: 0, approved: 0, hidden: 0 } as Record<Status, number>;
  state.items.forEach((c) => counts[c.status]++);
  const shown = state.items.filter((c) => c.status === tab);

  const note = (c: Item) =>
    [
      `Family tree ${KIND[c.kind].toLowerCase()} from ${c.by}${c.byRelation ? ` (${c.byRelation})` : ""}`,
      c.personId ? `about ${people[c.personId]?.n} (id: ${c.personId})` : "",
      c.questionId ? `answering "${data.questions.find((q) => q.id === c.questionId)?.q}"` : "",
      `:\n${c.text}`,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <main className={styles.review}>
      <p className="meta">
        <a className="link-underline" href="/family">
          ← Back to the tree
        </a>
      </p>
      <h1 className={styles.reviewTitle}>What family sent</h1>
      {!state.storeReady && (
        <p className={styles.formError}>Storage isn&rsquo;t connected, so nothing can be saved yet. Connect the Blob store to this project in Vercel.</p>
      )}
      <div className={styles.tabsInline} role="tablist">
        {(["pending", "approved", "hidden"] as Status[]).map((s) => (
          <button key={s} role="tab" type="button" aria-selected={tab === s} className={styles.tab} onClick={() => setTab(s)}>
            {s === "pending" ? "Waiting" : s === "approved" ? "On the tree" : "Hidden"} ({counts[s]})
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className={styles.emptyNote}>{tab === "pending" ? "Nothing waiting. You’re all caught up." : "Nothing here."}</p>}

      <ul className={styles.reviewList}>
        {shown.map((c) => {
          const person = c.personId ? people[c.personId] : undefined;
          const q = c.questionId ? data.questions.find((x) => x.id === c.questionId) : undefined;
          return (
            <li key={c.id} className={styles.reviewItem}>
              <p className="meta">
                {KIND[c.kind]}
                {person && (
                  <>
                    {" · "}
                    <a className="link-underline" href={`/family#${c.personId}`}>
                      {person.n}
                    </a>
                  </>
                )}
                {" · "}
                {new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
              {q && <p className={styles.dialogQuestion}>{q.q}</p>}
              {c.text && <p className={styles.memoryText}>{c.text}</p>}
              {c.photos.length > 0 && (
                <div className={styles.reviewPhotos}>
                  {c.photos.map((u) => (
                    <figure key={u}>
                      <a href={u} target="_blank" rel="noreferrer">
                        <img src={u} alt="" loading="lazy" />
                      </a>
                      {c.personId && c.status === "approved" && (
                        <button
                          type="button"
                          className={`${styles.textButton} link-underline`}
                          onClick={() => act({ action: "portrait", personId: c.personId, url: state.portraits[c.personId!] === u ? null : u })}
                        >
                          {state.portraits[c.personId] === u ? "Portrait ✓" : "Make portrait"}
                        </button>
                      )}
                    </figure>
                  ))}
                </div>
              )}
              <p className={styles.memoryBy}>
                From {c.by}
                {c.byRelation ? `, ${c.byRelation}` : ""}
                {c.contact ? ` · ${c.contact}` : ""}
              </p>
              <div className={styles.reviewActions}>
                {c.status !== "approved" && (
                  <button type="button" className={styles.primary} onClick={() => act({ action: "status", id: c.id, status: "approved" })}>
                    Put on the tree
                  </button>
                )}
                {c.status !== "hidden" && (
                  <button type="button" className={styles.secondary} onClick={() => act({ action: "status", id: c.id, status: "hidden" })}>
                    Hide
                  </button>
                )}
                {c.status !== "pending" && (
                  <button type="button" className={styles.secondary} onClick={() => act({ action: "status", id: c.id, status: "pending" })}>
                    Back to waiting
                  </button>
                )}
                {c.text && (
                  <button
                    type="button"
                    className={`${styles.textButton} link-underline`}
                    onClick={() => {
                      navigator.clipboard.writeText(note(c)).then(() => setCopied(c.id));
                    }}
                    title="Copy as a note you can paste to Claude to update the tree's data"
                  >
                    {copied === c.id ? "Copied" : "Copy as a data update"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className={styles.blockTitle}>Open questions</h2>
      <ul className={styles.reviewQuestions}>
        {data.questions.map((q) => {
          const done = state.resolved.includes(q.id);
          return (
            <li key={q.id}>
              <label>
                <input type="checkbox" checked={done} onChange={() => act({ action: "resolve", questionId: q.id, resolved: !done })} />{" "}
                {q.q}
              </label>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function OwnerSignIn({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/family/owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) onDone();
    else setError(res.status === 401 ? "Wrong password." : "FAMILY_EDIT_PASSWORD isn’t set.");
  };
  return (
    <main className={styles.login}>
      <form className={styles.loginCard} onSubmit={submit}>
        <h1 className={styles.reviewTitle}>Review</h1>
        <p className={styles.intro}>Only Matthew can approve what family send in.</p>
        <label htmlFor="owner-pw" className={styles.label}>
          Edit password
        </label>
        <input id="owner-pw" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        <div className={styles.loginRow}>
          <p className={error ? styles.formError : "meta"} role={error ? "alert" : undefined}>
            {error || " "}
          </p>
          <button type="submit" className={styles.primary} disabled={!password}>
            Sign in
          </button>
        </div>
      </form>
    </main>
  );
}
