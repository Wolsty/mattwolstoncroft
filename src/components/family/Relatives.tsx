"use client";

import { useFamily } from "./context";
import { PersonRow } from "./PersonCard";
import styles from "./family.module.css";

/** Aunts, uncles and cousins: everyone off the direct line, in titled groups. */
export function Relatives() {
  const { data } = useFamily();
  return (
    <section className={styles.block} aria-labelledby="relatives-title">
      <h2 id="relatives-title" className={styles.blockTitle}>
        Aunts, uncles and cousins
      </h2>
      <div className={styles.groups}>
        {data.groups.map((g) => (
          <div key={g.t} className={styles.group}>
            <h3 className={styles.groupTitle}>{g.t}</h3>
            {g.note && <p className={styles.groupNote}>{g.note}</p>}
            <ul className={styles.groupList}>
              {g.ids.map((id) => (
                <li key={id}>
                  <PersonRow id={id} standalone />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
