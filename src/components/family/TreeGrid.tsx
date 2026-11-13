"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useFamily } from "./context";
import { Unit } from "./PersonCard";
import { birthYear, shortName } from "@/lib/family/format";
import { familyOf, generations } from "@/lib/family/kinship";
import type { Line, LineKey } from "@/lib/family/types";
import styles from "./family.module.css";

const ORD = ["", "", "2nd", "3rd", "4th", "5th", "6th", "7th"];

/** What to call a generation `diff` steps above (+) or below (−) the viewer. */
function genName(diff: number): string {
  if (diff === 0) return "Your generation";
  if (diff === 1) return "Parents";
  if (diff === 2) return "Grandparents";
  if (diff === 3) return "Great-grandparents";
  if (diff > 3) return `${ORD[diff - 2] ?? `${diff - 2}th`} great-grandparents`;
  if (diff === -1) return "Children";
  if (diff === -2) return "Grandchildren";
  return "Descendants";
}

/**
 * Newest generation at the top: the children, their parents, then the tree
 * branches into the four lines and runs back in time down the page. Every
 * generation sits on one row across all four lines. On phones it shows one
 * line at a time, chosen with the tabs.
 */
export function TreeGrid() {
  const { data, people, selected, viewer, openContribute } = useFamily();
  const lines = data.lines;
  const maxGens = Math.max(...lines.map((l) => l.gens.length));
  const [active, setActive] = useState<LineKey>(lines[0].key);
  const home = data.meta.home;

  // On phones, open on the viewer's own side: the first line holding one of their ancestors.
  useEffect(() => {
    if (!viewer) return;
    const mine = new Set<string>();
    const queue = [viewer];
    while (queue.length) {
      const id = queue.shift()!;
      for (const p of people[id]?.parents ?? []) if (!mine.has(p)) (mine.add(p), queue.push(p));
    }
    const line = lines.find((l) => l.gens.flat(2).some((id) => mine.has(id)));
    if (line) setActive(line.key);
  }, [viewer, people, lines]);

  // Then follow the selected person to their line.
  useEffect(() => {
    const line = lines.find((l) => l.gens.some((g) => g.some((u) => u.includes(selected))));
    if (line) setActive(line.key);
  }, [selected, lines]);

  const fam = familyOf(people, home);
  const parents = fam.parents;
  const children = [home, ...fam.siblings];

  // Row labels are from the viewer's point of view. Generations are counted from the children's row.
  const gens = useMemo(() => generations(people, home), [people, home]);
  const viewerGen = viewer ? gens.get(viewer) ?? 0 : 0;
  const label = (rowGen: number) => {
    if (!viewer && rowGen === 0) return "Rod and Yvonne’s children";
    return genName(rowGen - viewerGen);
  };

  /** Unit at row r (0 = grandparents) for a line, or null. */
  const cellAt = (line: Line, r: number) => line.gens[line.gens.length - 1 - r] ?? null;

  const eras = useMemo(() => {
    const out: string[] = [];
    for (let r = 0; r < maxGens; r++) {
      const ys = lines
        .flatMap((l) => l.gens[l.gens.length - 1 - r] ?? [])
        .flat()
        .map((id) => people[id] && birthYear(people[id]))
        .filter((y): y is number => Boolean(y));
      const lo = Math.min(...ys);
      const hi = Math.max(...ys);
      out.push(ys.length ? `Born ${lo}${hi !== lo ? `–${hi}` : ""}` : "");
    }
    return out;
  }, [lines, people, maxGens]);

  /** "Fay's parents" when a generation holds more than one couple. */
  const unitLabel = (line: Line, r: number, unit: string[]) => {
    const younger = cellAt(line, r - 1)?.flat() ?? [];
    const child = younger.find((id) => people[id]?.parents?.some((p) => unit.includes(p)));
    return child ? `${shortName(people[child])}'s parents` : undefined;
  };

  const activeLine = lines.find((l) => l.key === active)!;

  return (
    <div className={styles.tree}>
      <div className={styles.grid}>
        {/* Children */}
        <div className={styles.rail}>
          <span className={styles.railName}>{label(0)}</span>
        </div>
        <div className={styles.children}>
          {children.map((id) => (
            <Unit key={id} ids={[id]} />
          ))}
        </div>

        {/* Parents */}
        <div className={styles.rail}>
          <span className={styles.railName}>{label(1)}</span>
        </div>
        <div className={styles.parents}>
          {parents.map((id) => (
            <div key={id} className={styles.parentSlot}>
              <Unit ids={[id]} />
            </div>
          ))}
        </div>

        {/* Each parent splits into their father's and mother's sides */}
        <div className={`${styles.rail} ${styles.hideOnPhone}`} aria-hidden />
        <div className={`${styles.bracket} ${styles.hideOnPhone}`} style={{ gridColumn: "2 / span 2" }} aria-hidden />
        <div className={`${styles.bracket} ${styles.hideOnPhone}`} style={{ gridColumn: "4 / span 2" }} aria-hidden />

        {/* Phones: pick a side */}
        <div className={styles.tabs} role="tablist" aria-label="Family sides">
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

        {/* Whose side each column is */}
        <div className={`${styles.rail} ${styles.hideOnPhone}`} aria-hidden />
        {lines.map((l) => (
          <div key={l.key} className={`${styles.colHead} ${active !== l.key ? styles.inactive : ""}`} data-line={l.key}>
            <p className={styles.colSide}>{l.side}</p>
            <h2 className={styles.colTitle}>{l.title}</h2>
            <p className={styles.colSub}>From {l.from}</p>
            <details className={styles.story}>
              <summary>The story</summary>
              <p>{data.story[l.key]}</p>
            </details>
          </div>
        ))}

        {/* Back in time, one row per generation */}
        {Array.from({ length: maxGens + 1 }, (_, r) => r).map((r) => {
          const activeEmpty = !cellAt(activeLine, r) && activeLine.gens.length !== r;
          const anyContent = lines.some((l) => cellAt(l, r) || l.gens.length === r);
          if (!anyContent) return null;
          return (
            <Fragment key={r}>
              <div className={`${styles.rail} ${activeEmpty ? styles.emptyOnPhone : ""}`}>
                {r < maxGens ? (
                  <>
                    <span className={styles.railName}>{label(r + 2)}</span>
                    {eras[r] && <span className={styles.railEra}>{eras[r]}</span>}
                  </>
                ) : null}
              </div>
              {lines.map((l) => {
                const cell = cellAt(l, r);
                const cls = `${styles.cell} ${active !== l.key ? styles.inactive : ""}`;
                if (cell) {
                  // Carry the line on down if there's anything below: more generations, or the "who came before" card.
                  const hasBelow = r < l.gens.length - 1 || l.gens.length < maxGens + 1;
                  return (
                    <div key={l.key} className={`${cls} ${styles.cellFilled} ${hasBelow ? styles.hasBelow : ""}`} data-line={l.key}>
                      {cell.map((unit) => (
                        <Unit key={unit.join("+")} ids={unit} label={cell.length > 1 ? unitLabel(l, r, unit) : undefined} />
                      ))}
                    </div>
                  );
                }
                if (l.gens.length === r) {
                  // Where the line runs out: invite what family know.
                  const top = l.gens[0];
                  const names = top.length === 1 ? top[0].map((id) => shortName(people[id])).join(" and ") : null;
                  return (
                    <div key={l.key} className={`${cls} ${styles.cellGhost}`} data-line={l.key}>
                      <button type="button" className={styles.ghost} onClick={() => openContribute({ kind: "person", personId: top[0][0] })}>
                        <span className={styles.ghostTitle}>{names ? `Who were ${names}’s parents?` : "Who came before?"}</span>
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

        <div className={styles.rail} aria-hidden />
        <p className={styles.meet}>
          <span className="meta">How the families met</span>
          {data.story.meet}
        </p>
      </div>
    </div>
  );
}
