import type { Person } from "./types";

/** "1923", "c. 1893" or "1950s" pulled out of a free-text date. */
function year(s?: string): string | null {
  if (!s) return null;
  const m = s.match(/(c\.\s*)?(\d{4}s?)/);
  return m ? `${m[1] ? "c. " : ""}${m[2]}` : null;
}

/** "1923–2014", "Living", "b. 1938" or "Dates unknown". */
export function years(p: Person): string {
  if (p.living) return "Living";
  const b = year(p.b);
  const d = year(p.d);
  if (b && d) return `${b}–${d}`;
  if (b) return `b. ${b}`;
  if (d) return `d. ${d}`;
  return "Dates unknown";
}

/** First part of a place: "Grove City, Mercer County, PA" → "Grove City". */
export function shortPlace(place?: string): string | undefined {
  return place?.split(",")[0]?.trim() || undefined;
}

/** First name, as family would say it: "Irvin Clyde Wolstoncroft Jr." → "Irvin". Nicknames in quotes win. */
export function firstName(p: Person): string {
  const nick = p.n.match(/"([^"]+)"/);
  return nick ? nick[1] : p.n.split(" ")[0];
}

export function initials(p: Person): string {
  const parts = p.n.replace(/"[^"]*"/g, "").replace(/\b(Jr|Sr)\.?/g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Plain-language confidence note shown on a person. */
export function confidence(p: Person): { tone: "living" | "likely" | "records"; text: string } {
  if (p.living) return { tone: "living", text: "Living. Only name and relationship are shown, to keep their details private." };
  if (p.likely) return { tone: "likely", text: "Likely, not proven. The records point this way, but no single document confirms the link." };
  return { tone: "records", text: "From records: obituaries, cemetery and census entries, and enlistment files." };
}

/** First name plus Sr./Jr., so the two Irvins stay distinct: "Irvin Sr." */
export function shortName(p: Person): string {
  const suffix = p.n.match(/\b(Sr|Jr)\.?$/);
  return suffix ? `${firstName(p)} ${suffix[1]}.` : firstName(p);
}

/** A birth year as a number, for sorting and eras. */
export function birthYear(p: Person): number | null {
  const m = p.b?.match(/\d{4}/);
  return m ? Number(m[0]) : null;
}
