"use client";

import { useFamily } from "./context";
import styles from "./family.module.css";

export function Sources() {
  const { data } = useFamily();
  return (
    <section className={styles.block} aria-labelledby="sources-title">
      <h2 id="sources-title" className={styles.blockTitle}>
        Sources
      </h2>
      <ul className={styles.sources}>
        {data.sources.map((s) => (
          <li key={s.url}>
            <a className="link-underline" href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.compiled}>{data.meta.compiled}</p>
    </section>
  );
}
