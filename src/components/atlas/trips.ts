import type { Place } from "./types";

/**
 * Kimbo road trips, worked out from the camps themselves: dated Kimbo nights no more than
 * MAX_GAP_DAYS apart belong to the same trip, joined in date order. Legs are drawn as gentle
 * arcs, not real roads, so they read as "we drove from here to here" without pretending to
 * be the exact route.
 */
const MAX_GAP_DAYS = 3;
const MAX_LEG_KM = 1500; // longer than this, it wasn't one drive
const ARC_POINTS = 24;

export type Trip = { id: string; start: string; end: string; camps: Place[] };

const DAY = 86_400_000;
const dayOf = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10)) / DAY);

function km(a: Place, b: Place) {
  const R = 6371;
  const r = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function buildTrips(places: Place[]): Trip[] {
  const camps = places
    .filter((p) => p.type === "kimbo" && p.date)
    .sort((a, b) => a.date!.localeCompare(b.date!) || a.id.localeCompare(b.id));
  const trips: Trip[] = [];
  let cur: Place[] = [];
  const close = () => {
    if (cur.length > 1) trips.push({ id: `trip-${cur[0].date}`, start: cur[0].date!, end: cur[cur.length - 1].date!, camps: cur });
    cur = [];
  };
  for (const c of camps) {
    const prev = cur[cur.length - 1];
    if (prev && (dayOf(c.date!) - dayOf(prev.date!) > MAX_GAP_DAYS || km(prev, c) > MAX_LEG_KM)) close();
    cur.push(c);
  }
  close();
  return trips;
}

/** A soft arc from a to b, bowed to one side by a fraction of its length. */
function arc(a: Place, b: Place): [number, number][] {
  const [x0, y0, x1, y1] = [a.lng, a.lat, b.lng, b.lat];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const bow = 0.18;
  const cx = (x0 + x1) / 2 - dy * bow;
  const cy = (y0 + y1) / 2 + dx * bow;
  const pts: [number, number][] = [];
  for (let i = 0; i <= ARC_POINTS; i++) {
    const t = i / ARC_POINTS;
    const u = 1 - t;
    pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
  }
  return pts;
}

export function tripLabel(t: Trip) {
  const fmt = (iso: string, withYear: boolean) =>
    new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });
  const sameYear = t.start.slice(0, 4) === t.end.slice(0, 4);
  return `Kimbo road trip · ${fmt(t.start, !sameYear)} – ${fmt(t.end, true)} · ${t.camps.length} camps`;
}

/** One feature per leg, dated by the night it arrives, so the timeline draws trips leg by leg. */
export function tripsGeoJSON(trips: Trip[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const t of trips) {
    const label = tripLabel(t);
    for (let i = 1; i < t.camps.length; i++) {
      const a = t.camps[i - 1];
      const b = t.camps[i];
      if (a.lat === b.lat && a.lng === b.lng) continue;
      features.push({
        type: "Feature",
        properties: { trip: t.id, date: b.date, label },
        geometry: { type: "LineString", coordinates: arc(a, b) },
      });
    }
  }
  return { type: "FeatureCollection", features };
}
