"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useFamily } from "./context";
import { Unit } from "./PersonCard";
import { birthYear, shortName } from "@/lib/family/format";
import { familyOf } from "@/lib/family/kinship";
import type { Line, LineKey } from "@/lib/family/types";
import styles from "./family.module.css";

const ORD = ["", "", "2nd", "3rd", "4th", "5th", "6th"];
const rowName = (r: number) => (r === 0 ? "Grandparents" : r === 1 ? "Great-grandparents" : `${ORD[r] ?? `${r}th`} great-grandparents`);

/**
 * The four lines as columns, oldest at the top, each generation on the same
 * row across all four, converging into the parents and then the children.
 * On phones it shows one line at a time, chosen with the tabs.
 */
export function TreeGrid() {
  const { data, people, selected, openContribute } = useFamily();
  const lines = data.lines;
  const maxGens = Math.max(...lines.map((l) => l.gens.length));
  const [active, setActive] = useState<LineKey>(lines[0].key);

  // On phones, follow the selected person to their line.
  useEffect(() => {
    const line = lines.find((l) => l.gens.some((g) => g.some((u) => u.includes(selected))));
    if (line) setActive(line.key);
  }, [selected, lines]);

  const home = data.meta.home;
  const fam = familyOf(people, home);
  const parents = fam.parents;
  const children = [home, ...fam.siblings];

  /** Unit at row r (0 = grandparents) for a line, or null. */
  const cellAt = (line: Line, r: number) => line.gens[line.gens.length - 1 - r] ?? null;

  const eras = useMemo(() => {
    const out: string[] = [];
    for (let r = 0; r < maxGens; r++) {
      const ys = lines
        .flatMap((l) => cellAt(l, r) ?? [])
        .flat()
        .map((id) => people[id] && birthYear(people[id]))
        .filter((y): y is number => Boolean(y));
      out.push(ys.length ? `Born ${Math.min(...ys)}${Math.max(...ys) !== Math.min(...ys) ? `–${Math.max(...ys)}` : ""}` : "");
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, people, maxGens]);

  /** "Fay's parents" when a generation holds more than one couple. */
  const unitLabel = (line: Line, r: number, unit: string[]) => {
    const younger = cellAt(line, r - 1)?.flat() ?? [];
    const child = younger.find((id) => people[id]?.parents?.some((p) => unit.includes(p)));
    return child ? `${shortName(people[child])}'s parents` : undefined;
  };

  return (
    <div className={styles.tree}>
      <div className={styles.tabs} role="tablist" aria-label="Family lines">
        {lines.map((l) => (
          <button
            key={l.key}
            role="tab"
            type="button"
            aria-selected={active === l.key}
            className={styles.tab}
            data-line={l.key}
            onClick={() => setActive(l.key)}
          >
            {l.title}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Column heads */}
        <div className={styles.rail} aria-hidden />
        {lines.map((l) => (
          <div key={l.key} className={`${styles.colHead} ${active !== l.key ? styles.inactive : ""}`} data-line={l.key}>
            <h2 className={styles.colTitle}>{l.title}</h2>
            <p className={styles.colSub}>{l.sub}</p>
            <details className={styles.story}>
              <summary>The story</summary>
              <p>{data.story[l.key]}</p>
            </details>
          </div>
        ))}

        {/* Generations, oldest first */}
        {Array.from({ length: maxGens }, (_, i) => maxGens - 1 - i).map((r) => {
          const activeLine = lines.find((l) => l.key === active)!;
          const activeEmpty = !cellAt(activeLine, r) && activeLine.gens.length !== r;
          return (
            <Fragment key={r}>
              <div className={`${styles.rail} ${activeEmpty ? styles.emptyOnPhone : ""}`}>
                <span className={styles.railName}>{rowName(r)}</span>
                {eras[r] && <span className={styles.railEra}>{eras[r]}</span>}
              </div>
              {lines.map((l) => {
                const cell = cellAt(l, r);
                // Draw the line up into this cell unless it's the very top of a fully traced column.
                const hasAbove = r !== l.gens.length - 1 || l.gens.length < maxGens;
                const cls = `${styles.cell} ${active !== l.key ? styles.inactive : ""}`;
                if (cell)
                  return (
                    <div key={l.key} className={`${cls} ${styles.cellFilled} ${hasAbove ? styles.hasAbove : ""}`} data-line={l.key}>
                      {cell.map((unit) => (
                        <Unit key={unit.join("+")} ids={unit} label={cell.length > 1 ? unitLabel(l, r, unit) : undefined} />
                      ))}
                    </div>
                  );
                if (l.gens.length === r) {
                  // Just above where the line runs out: invite what family know.
                  const top = l.gens[0];
                  const names = top.length === 1 ? top[0].map((id) => shortName(people[id])).join(" and ") : null;
                  return (
                    <div key={l.key} className={`${cls} ${styles.cellGhost}`} data-line={l.key}>
                      <button
                        type="button"
                        className={styles.ghost}
                        onClick={() => openContribute({ kind: "person", personId: top[0][0] })}
                      >
                        <span className={styles.ghostTitle}>{names ? `${names}’s parents` : "Earlier generations"}</span>
                        <span className={styles.ghostText}>Not found yet. Know a name?</span>
                      </button>
                    </div>
                  );
                }
                return <div key={l.key} className={`${cls} ${styles.emptyOnPhone}`} aria-hidden />;
              })}
            </Fragment>
          );
        })}

        {/* Where the lines meet */}
        <div className={`${styles.rail} ${styles.hideOnPhone}`} aria-hidden />
        <div className={`${styles.bracket} ${styles.hideOnPhone}`} style={{ gridColumn: "2 / span 2" }} aria-hidden />
        <div className={`${styles.bracket} ${styles.hideOnPhone}`} style={{ gridColumn: "4 / span 2" }} aria-hidden />

        <div className={styles.rail}>
          <span className={styles.railName}>Parents</span>
        </div>
        <div className={styles.parents}>
          {parents.map((id) => (
            <div key={id} className={styles.parentSlot}>
              <Unit ids={[id]} />
            </div>
          ))}
        </div>

        <div className={styles.rail}>
          <span className={styles.railName}>Children</span>
        </div>
        <div className={styles.children}>
          {children.map((id) => (
            <Unit key={id} ids={[id]} />
          ))}
        </div>

        <div className={styles.rail} aria-hidden />
        <p className={styles.meet}>
          <span className="meta">How the lines met</span>
          {data.story.meet}
        </p>
      </div>
    </div>
  );
}
