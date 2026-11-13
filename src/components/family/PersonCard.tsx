"use client";

import { useFamily } from "./context";
import { initials, shortPlace, years } from "@/lib/family/format";
import styles from "./family.module.css";

/** Portrait if family have shared one, otherwise initials in the line's color. */
export function Avatar({ id, size = 32 }: { id: string; size?: number }) {
  const { people, portraitOf } = useFamily();
  const p = people[id];
  const url = portraitOf(id);
  return (
    <span className={styles.avatar} data-line={p.line} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {url ? <img src={url} alt="" loading="lazy" /> : initials(p)}
    </span>
  );
}

/** Relationship without the "(likely)" suffix: the Likely tag says it. */
const cleanRel = (r: string | null) => r?.replace(/\s*\(likely\)/i, "") ?? null;

/**
 * One person. Used inside couple units in the tree and on its own in the
 * relatives section. The whole row is the button.
 */
export function PersonRow({ id, standalone = false }: { id: string; standalone?: boolean }) {
  const { people, selected, select, pathIds, relLabel, itemsFor } = useFamily();
  const p = people[id];
  if (!p) return null;
  // In the tree the row says the generation, so the relationship only shows on standalone cards.
  const rel = standalone ? cleanRel(relLabel(id)) : null;
  const place = shortPlace(p.bp);
  const memories = itemsFor(id).length;
  return (
    <button
      type="button"
      id={`card-${id}`}
      className={`${styles.person} ${standalone ? styles.personStandalone : ""}`}
      data-line={p.line}
      data-selected={selected === id || undefined}
      data-onpath={(pathIds.has(id) && selected !== id) || undefined}
      aria-pressed={selected === id}
      onClick={() => select(id)}
    >
      <Avatar id={id} />
      <span className={styles.personText}>
        <span className={styles.personName}>{p.n}</span>
        {p.maiden && <span className={styles.personMaiden}>née {p.maiden}</span>}
        <span className={styles.personMeta}>
          {years(p)}
          {place && !p.living ? ` · ${place}` : ""}
        </span>
        {(rel || p.imm || p.likely || memories > 0) && (
          <span className={styles.tags}>
            {rel && <span className={styles.rel}>{rel}</span>}
            {p.imm && <span className={styles.tag}>Immigrant</span>}
            {p.likely && <span className={`${styles.tag} ${styles.tagLikely}`}>Likely</span>}
            {memories > 0 && (
              <span className={styles.tag} title={`${memories} shared by family`}>
                {memories} {memories === 1 ? "memory" : "memories"}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}

/** A couple (or single person) as one card. */
export function Unit({ ids, label }: { ids: string[]; label?: string }) {
  const { people } = useFamily();
  const line = people[ids[0]]?.line;
  return (
    <div className={styles.unitWrap}>
      {label && <p className={styles.unitLabel}>{label}</p>}
      <div className={styles.unit} data-line={line} role="group" aria-label={ids.map((i) => people[i]?.n).join(" and ")}>
        {ids.map((id, i) => (
          <div key={id} className={styles.unitMember}>
            {i > 0 && (
              <span className={styles.amp} aria-hidden>
                &amp;
              </span>
            )}
            <PersonRow id={id} />
          </div>
        ))}
      </div>
    </div>
  );
}
