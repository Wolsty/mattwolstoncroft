import type { Person } from "./types";

/**
 * Relationships, worked out from each person's `parents` and `spouse`.
 *
 * Blood relatives are found through their nearest common ancestor: how many
 * generations up from the viewer (up) and from the other person (down) gives
 * the term, the same way genealogy relationship charts do. Relatives by
 * marriage go through a spouse. Anything the data can't connect returns null.
 */
type People = Record<string, Person>;

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
const ORD_WORD = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth"];
const TIMES = ["", "once", "twice", "three times", "four times", "five times"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ord = (n: number) => ORD[n] ?? `${n}th`;

function ancestors(people: People, id: string): Map<string, number> {
  const depth = new Map<string, number>([[id, 0]]);
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const p of people[cur]?.parents ?? []) {
      if (!depth.has(p) && people[p]) {
        depth.set(p, depth.get(cur)! + 1);
        queue.push(p);
      }
    }
  }
  return depth;
}

/** Generations from viewer up to the common ancestor, and from target up to it. */
function bloodDistance(people: People, viewer: string, target: string): { up: number; down: number } | null {
  const a = ancestors(people, viewer);
  const b = ancestors(people, target);
  let best: { up: number; down: number } | null = null;
  for (const [id, up] of a) {
    const down = b.get(id);
    if (down === undefined) continue;
    if (!best || up + down < best.up + best.down) best = { up, down };
  }
  return best;
}

/** The word for someone `down` generations below a shared ancestor `up` generations above the viewer. */
export function termFor(up: number, down: number, sex: "m" | "f"): string {
  const m = sex === "m";
  if (up === 0 && down === 0) return "You";
  if (up === 0) {
    const base = m ? "son" : "daughter";
    if (down === 1) return cap(base);
    if (down === 2) return cap(`grand${base}`);
    if (down === 3) return cap(`great-grand${base}`);
    return `${ord(down - 2)} great-grand${base}`;
  }
  if (down === 0) {
    const base = m ? "father" : "mother";
    if (up === 1) return cap(base);
    if (up === 2) return cap(`grand${base}`);
    if (up === 3) return cap(`great-grand${base}`);
    return `${ord(up - 2)} great-grand${base}`;
  }
  if (up === 1 && down === 1) return m ? "Brother" : "Sister";
  if (up === 1) {
    const base = m ? "nephew" : "niece";
    if (down === 2) return cap(base);
    if (down === 3) return cap(`grand${base}`);
    if (down === 4) return cap(`great-grand${base}`);
    return `${ord(down - 3)} great-grand${base}`;
  }
  if (down === 1) {
    const base = m ? "uncle" : "aunt";
    if (up === 2) return cap(base);
    if (up === 3) return cap(`great-${base}`);
    if (up === 4) return cap(`great-grand-${base}`);
    return `${ord(up - 2)} great-${base}`;
  }
  const degree = Math.min(up, down) - 1;
  const removed = Math.abs(up - down);
  const cousin = `${ORD_WORD[degree] ?? `${ord(degree)}`} cousin`;
  return removed ? `${cousin} ${TIMES[removed] ?? `${removed} times`} removed` : cousin;
}

/** How `target` is related to `viewer`, in plain words, or null if the data doesn't connect them. */
export function relationship(people: People, viewer: string, target: string): string | null {
  const t = people[target];
  const v = people[viewer];
  if (!t || !v) return null;
  if (viewer === target) return "You";

  const blood = bloodDistance(people, viewer, target);
  if (blood) return termFor(blood.up, blood.down, t.sex);

  if (v.spouse === target) return t.sex === "m" ? "Husband" : "Wife";

  // Married to one of the viewer's blood relatives.
  if (t.spouse && people[t.spouse]) {
    const via = bloodDistance(people, viewer, t.spouse);
    if (via) {
      const { up, down } = via;
      if (up === 1 && down === 0) return t.sex === "m" ? "Stepfather" : "Stepmother";
      if (up === 0 && down === 1) return t.sex === "m" ? "Son-in-law" : "Daughter-in-law";
      if (up === 1 && down === 1) return t.sex === "m" ? "Brother-in-law" : "Sister-in-law";
      return `${termFor(up, down, t.sex)} (by marriage)`;
    }
  }

  // A blood relative of the viewer's spouse.
  if (v.spouse && people[v.spouse]) {
    const via = bloodDistance(people, v.spouse, target);
    if (via) {
      const { up, down } = via;
      if (up === 1 && down === 0) return t.sex === "m" ? "Father-in-law" : "Mother-in-law";
      if (up === 1 && down === 1) return t.sex === "m" ? "Brother-in-law" : "Sister-in-law";
      if (up === 0 && down === 1) return t.sex === "m" ? "Stepson" : "Stepdaughter";
      return `${termFor(up, down, t.sex)} (by marriage)`;
    }
  }
  return null;
}

/** Everyone's parents, children, spouse and siblings, derived once from the data. */
export function familyOf(people: People, id: string) {
  const p = people[id];
  const parents = (p?.parents ?? []).filter((x) => people[x]);
  const children = Object.keys(people).filter((k) => people[k].parents?.includes(id));
  const spouse = p?.spouse && people[p.spouse] ? p.spouse : undefined;
  const siblings = parents.length
    ? Object.keys(people).filter((k) => k !== id && people[k].parents?.some((x) => parents.includes(x)))
    : [];
  const known = new Set([id, ...parents, ...children, ...siblings, ...(spouse ? [spouse] : [])]);
  const other = (p?.links ?? []).filter((x) => people[x] && !known.has(x));
  return { parents, spouse, children, siblings, other };
}

export type PathStep = { id: string; label: string };

/**
 * The chain of people from viewer to target, each step labelled from the person
 * before it ("your mother", "her father"). Blood steps are preferred over marriage.
 */
export function relationshipPath(people: People, viewer: string, target: string): PathStep[] | null {
  if (!people[viewer] || !people[target]) return null;
  if (viewer === target) return [{ id: viewer, label: "" }];
  type Edge = { to: string; kind: "parent" | "child" | "spouse" };
  const edges = (id: string): Edge[] => {
    const f = familyOf(people, id);
    return [
      ...f.parents.map((to) => ({ to, kind: "parent" as const })),
      ...f.children.map((to) => ({ to, kind: "child" as const })),
      ...(f.spouse ? [{ to: f.spouse, kind: "spouse" as const }] : []),
    ];
  };
  const dist = new Map<string, number>([[viewer, 0]]);
  const prev = new Map<string, { from: string; kind: Edge["kind"] }>();
  const open = new Set([viewer]);
  while (open.size) {
    let cur = "";
    for (const id of open) if (!cur || dist.get(id)! < dist.get(cur)!) cur = id;
    open.delete(cur);
    if (cur === target) break;
    for (const e of edges(cur)) {
      const d = dist.get(cur)! + (e.kind === "spouse" ? 1.1 : 1);
      if (d < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, d);
        prev.set(e.to, { from: cur, kind: e.kind });
        open.add(e.to);
      }
    }
  }
  if (!prev.has(target)) return null;
  const chain: { id: string; kind?: Edge["kind"] }[] = [{ id: target }];
  let at = target;
  while (at !== viewer) {
    const step = prev.get(at)!;
    chain[0].kind = step.kind;
    chain.unshift({ id: step.from });
    at = step.from;
  }
  return chain.map((c, i) => {
    if (i === 0) return { id: c.id, label: "" };
    const before = chain[i - 1].id;
    const whose = before === viewer ? "your" : people[before].sex === "m" ? "his" : "her";
    const m = people[c.id].sex === "m";
    const word =
      c.kind === "parent" ? (m ? "father" : "mother") : c.kind === "child" ? (m ? "son" : "daughter") : m ? "husband" : "wife";
    return { id: c.id, label: `${whose} ${word}` };
  });
}

/** Generation of everyone relative to `root` (0): parents +1, children -1, spouses the same. */
export function generations(people: People, root: string): Map<string, number> {
  const gen = new Map<string, number>([[root, 0]]);
  const queue = [root];
  while (queue.length) {
    const id = queue.shift()!;
    const g = gen.get(id)!;
    const f = familyOf(people, id);
    const next: [string, number][] = [
      ...f.parents.map((p) => [p, g + 1] as [string, number]),
      ...f.children.map((c) => [c, g - 1] as [string, number]),
      ...(f.spouse ? [[f.spouse, g] as [string, number]] : []),
    ];
    for (const [n, ng] of next) {
      if (!gen.has(n)) {
        gen.set(n, ng);
        queue.push(n);
      }
    }
  }
  return gen;
}
