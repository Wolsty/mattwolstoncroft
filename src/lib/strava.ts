import { decodePolyline, type Route, type RouteKind } from "@/components/atlas/types";

/**
 * Strava → Atlas routes.
 *
 * Uses a long-lived refresh token (STRAVA_REFRESH_TOKEN, created once with
 * `node scripts/strava-auth.mjs`) to get a short-lived access token, pulls the
 * athlete's activities, keeps the outdoor sports below, and trims the first and
 * last half mile of every track so home and other start points stay private.
 *
 * Scope is `activity:read`, so activities set to "Only you" on Strava never come through.
 */

/** Which Strava sports show on the map, and how they're drawn. Edit freely. */
const SPORTS: Record<string, { kind: RouteKind; minMiles?: number }> = {
  BackcountrySki: { kind: "ski" },
  AlpineSki: { kind: "ski" }, // resort days, lift lines included
  NordicSki: { kind: "ski" },
  Snowshoe: { kind: "hike" },
  Hike: { kind: "hike" },
  TrailRun: { kind: "hike", minMiles: 4 },
  Walk: { kind: "hike", minMiles: 4 },
  MountainBikeRide: { kind: "bike" },
  EMountainBikeRide: { kind: "bike" },
  GravelRide: { kind: "bike" },
  Ride: { kind: "bike", minMiles: 20 },
  Canoeing: { kind: "paddle" },
  Kayaking: { kind: "paddle" },
  StandUpPaddling: { kind: "paddle" },
  Rowing: { kind: "paddle" },
};

const TRIM_METERS = 805; // half a mile off each end
const M_PER_MI = 1609.34;

type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  start_date_local: string;
  distance: number;
  total_elevation_gain: number;
  trainer?: boolean;
  manual?: boolean;
  map?: { summary_polyline?: string | null };
};

export function stravaConfigured() {
  return Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET && process.env.STRAVA_REFRESH_TOKEN);
}

async function accessToken(): Promise<string> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: process.env.STRAVA_REFRESH_TOKEN!,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function allActivities(token: string): Promise<StravaActivity[]> {
  const out: StravaActivity[] = [];
  // 200 per page is Strava's maximum; 30 pages covers 6,000 activities.
  for (let page = 1; page <= 30; page++) {
    const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Strava activities failed: ${res.status}`);
    const batch = (await res.json()) as StravaActivity[];
    out.push(...batch);
    if (batch.length < 200) break;
  }
  return out;
}

function meters(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** [lng, lat][] → Google encoded polyline (5 decimals). Keeps the cached payload small. */
export function encodePolyline(coords: [number, number][]): string {
  let out = "";
  let pLat = 0;
  let pLng = 0;
  const enc = (v: number) => {
    let n = v < 0 ? ~(v << 1) : v << 1;
    let s = "";
    while (n >= 0x20) {
      s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return s + String.fromCharCode(n + 63);
  };
  for (const [lng, lat] of coords) {
    const la = Math.round(lat * 1e5);
    const ln = Math.round(lng * 1e5);
    out += enc(la - pLat) + enc(ln - pLng);
    pLat = la;
    pLng = ln;
  }
  return out;
}

/** Drop the first and last `m` meters of a line. */
export function trimEnds(coords: [number, number][], m = TRIM_METERS): [number, number][] {
  const cut = (pts: [number, number][]) => {
    let d = 0;
    for (let i = 1; i < pts.length; i++) {
      d += meters(pts[i - 1], pts[i]);
      if (d >= m) return pts.slice(i);
    }
    return [];
  };
  return cut(cut(coords).reverse()).reverse();
}

export async function fetchStravaRoutes(): Promise<Route[]> {
  if (!stravaConfigured()) return [];
  const token = await accessToken();
  const acts = await allActivities(token);
  const routes: Route[] = [];
  for (const a of acts) {
    const sport = SPORTS[a.sport_type];
    if (!sport || a.trainer || a.manual || !a.map?.summary_polyline) continue;
    const miles = a.distance / M_PER_MI;
    if (sport.minMiles && miles < sport.minMiles) continue;
    const coords = trimEnds(decodePolyline(a.map.summary_polyline));
    if (coords.length < 2) continue;
    routes.push({
      id: `s${a.id}`,
      name: a.name,
      kind: sport.kind,
      date: a.start_date_local.slice(0, 10),
      miles: Math.round(miles * 10) / 10,
      gainFt: Math.round(a.total_elevation_gain * 3.28084),
      coords: [],
      polyline: encodePolyline(coords),
      source: "strava",
      url: `https://www.strava.com/activities/${a.id}`,
    });
  }
  return routes;
}
