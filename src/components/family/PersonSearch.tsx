"use client";

import { useId, useMemo, useState } from "react";
import { useFamily } from "./context";
import { years } from "@/lib/family/format";
import styles from "./family.module.css";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/["“”]/g, "")
    .toLowerCase();

/** Type a name (or maiden name, or place) to jump to someone. */
export function PersonSearch() {
  const { people, select, relLabel } = useFamily();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return [];
    return Object.entries(people)
      .filter(([, p]) => norm(`${p.n} ${p.maiden ?? ""} ${p.bp ?? ""}`).includes(t))
      .slice(0, 8);
  }, [q, people]);

  const go = (id: string) => {
    select(id, { scroll: true });
    setQ("");
    setActive(0);
  };

  return (
    <div className={styles.search}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Find a person
      </label>
      <input
        id={`${listId}-input`}
        className={`field ${styles.searchInput}`}
        type="search"
        placeholder="Find someone by name or place"
        value={q}
        autoComplete="off"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={results[active] ? `${listId}-${results[active][0]}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + results.length) % results.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(results[active][0]);
          } else if (e.key === "Escape") {
            setQ("");
          }
        }}
      />
      {results.length > 0 && (
        <ul id={listId} role="listbox" className={styles.searchList}>
          {results.map(([id, p], i) => (
            <li
              key={id}
              id={`${listId}-${id}`}
              role="option"
              aria-selected={i === active}
              className={styles.searchItem}
              data-line={p.line}
              onMouseDown={(e) => {
                e.preventDefault();
                go(id);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className={styles.searchName}>{p.n}</span>
              <span className={styles.searchMeta}>
                {years(p)}
                {relLabel(id) ? ` · ${relLabel(id)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {q.trim() && !results.length && <p className={styles.searchEmpty}>No one by that name yet.</p>}
    </div>
  );
}
