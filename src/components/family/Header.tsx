"use client";

import { useMemo } from "react";
import { useFamily } from "./context";
import styles from "./family.module.css";

export function Header({ viewerKnown }: { viewerKnown: boolean }) {
  const { data, owner } = useFamily();
  return (
    <>
      <div className={styles.topbar}>
        <label className={styles.viewer}>
          <span className={styles.viewerLabel}>Viewing as</span>
          <ViewerSelect id="viewer-select" />
        </label>
        <p className={styles.viewerHint}>Relationships are shown from this person&rsquo;s point of view.</p>
        {owner && (
          <a className={`${styles.topbarLink} link-underline`} href="/family/review">
            Review submissions
          </a>
        )}
      </div>
      <header className={styles.header}>
        <h1 className={`display ${styles.title}`}>{data.meta.title}</h1>
        <p className={styles.intro}>{data.meta.intro}</p>
        {!viewerKnown && <Welcome />}
      </header>
    </>
  );
}

/** Living people, who could be the one looking. */
function useViewerOptions() {
  const { people } = useFamily();
  return useMemo(
    () =>
      Object.entries(people)
        .filter(([, p]) => p.living)
        .sort((a, b) => a[1].n.localeCompare(b[1].n)),
    [people],
  );
}

function ViewerSelect({ id }: { id: string }) {
  const { viewer, setViewer, select } = useFamily();
  const options = useViewerOptions();
  return (
    <select
      id={id}
      className={styles.select}
      value={viewer ?? "guest"}
      onChange={(e) => {
        const v = e.target.value === "guest" ? null : e.target.value;
        setViewer(v);
        if (v) select(v, { scroll: true, quiet: true });
      }}
    >
      <option value="guest">Someone not on the tree</option>
      {options.map(([pid, p]) => (
        <option key={pid} value={pid}>
          {p.n}
        </option>
      ))}
    </select>
  );
}

/** First visit: ask who's looking, so every relationship on the page is theirs. Skippable. */
function Welcome() {
  const { setViewer } = useFamily();
  return (
    <div className={styles.welcome} role="region" aria-label="Welcome">
      <div>
        <h2 className={styles.welcomeTitle}>Welcome. Who&rsquo;s looking?</h2>
        <p className={styles.welcomeText}>
          Pick your name and every card will say how that person is related to you. You can change it any time at the top
          of the page.
        </p>
      </div>
      <div className={styles.welcomeActions}>
        <label htmlFor="welcome-viewer" className="meta">
          I am
        </label>
        <ViewerSelect id="welcome-viewer" />
        <button type="button" className={styles.textButton} onClick={() => setViewer(null)}>
          Skip
        </button>
      </div>
    </div>
  );
}
