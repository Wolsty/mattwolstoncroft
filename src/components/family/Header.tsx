"use client";

import { useMemo } from "react";
import { useFamily } from "./context";
import { PersonSearch } from "./PersonSearch";
import styles from "./family.module.css";

export function Header({ viewerKnown }: { viewerKnown: boolean }) {
  const { data, select, owner } = useFamily();
  return (
    <header className={styles.header}>
      <p className="meta">Family · shared privately</p>
      <h1 className={`display ${styles.title}`}>{data.meta.title}</h1>
      <p className={styles.intro}>{data.meta.intro}</p>
      <ul className={styles.origins} aria-label="Where the family came from">
        {data.origins.map((o) => (
          <li key={o.place}>
            <button type="button" className={styles.origin} data-line={o.line} onClick={() => select(o.person, { scroll: true })}>
              <span className={styles.originPlace}>{o.place}</span>
              <span className={styles.originDetail}>{o.detail}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.toolbar}>
        <PersonSearch />
        {viewerKnown && <ViewerControl />}
        {owner && (
          <a className={`${styles.textButton} link-underline`} href="/family/review">
            Review submissions
          </a>
        )}
      </div>
      {!viewerKnown && <Welcome />}
    </header>
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

function ViewerSelect({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const { viewer, setViewer } = useFamily();
  const options = useViewerOptions();
  return (
    <select
      id={id}
      autoFocus={autoFocus}
      className={styles.select}
      value={viewer ?? "guest"}
      onChange={(e) => setViewer(e.target.value === "guest" ? null : e.target.value)}
    >
      <option value="guest">I&rsquo;m not on the tree</option>
      {options.map(([pid, p]) => (
        <option key={pid} value={pid}>
          {p.n}
        </option>
      ))}
    </select>
  );
}

function ViewerControl() {
  return (
    <label className={styles.viewer}>
      <span className="meta">Viewing as</span>
      <ViewerSelect id="viewer-select" />
    </label>
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
          Pick your name and every card will show how that person is related to you. You can change it any time.
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
