import { decodePolyline, type Route, type RouteKind } from "@/components/atlas/types";

/**
 * Strava → Atlas routes.
 *
 * Uses a long-lived refresh token (STRAVA_REFRESH_TOKEN, created once with
 * `node scripts/strava-auth.mjs`) to get a short-lived access token, pulls the
 * athlete's activities (every one with a GPS track), and trims the first and
 * last half mile of every track so home and other start points stay private.
 *
 * Activities set to "Only you" on Strava come through only if the token was created with
 * the `activity:read_all` scope (scripts/strava-auth.mjs asks for it).
 */

/**
 * Every Strava activity with a GPS track shows. This only decides its line color and label;
 * anything not listed falls back by name (…Ride → bike, …Ski → ski, and so on).
 */
const KIND: Record<string, RouteKind> = {
  BackcountrySki: "ski",
  AlpineSki: "ski",
  NordicSki: "ski",
  Snowboard: "ski",
  Snowshoe: "hike",
  IceSkate: "ski",
  Hike: "hike",
  Walk: "hike",
  Run: "hike",
  TrailRun: "hike",
  RockClimbing: "hike",
  MountainBikeRide: "bike",
  EMountainBikeRide: "bike",
  GravelRide: "bike",
  Ride: "bike",
  EBikeRide: "bike",
  Canoeing: "paddle",
  Kayaking: "paddle",
  StandUpPaddling: "paddle",
  Rowing: "paddle",
  Swim: "paddle",
  Surfing: "paddle",
  Kitesurf: "paddle",
  Windsurf: "paddle",
  Sail: "paddle",
};

/** Simulator worlds (Zwift and the like) aren't real places. */
const SKIP = new Set(["VirtualRide", "VirtualRun", "VirtualRow"]);

function kindFor(sport: string): RouteKind {
  if (KIND[sport]) return KIND[sport];
  if (/Ski|Snow|Skate/.test(sport)) return "ski";
  if (/Ride|Bike|Cycl|Wheelchair|Velomobile/.test(sport)) return "bike";
  if (/Paddl|Kayak|Canoe|Row|Swim|Surf|Sail|Kite|Wind/.test(sport)) return "paddle";
  return "hike";
}

/** How each sport reads in the Strava panel. */
const SPORT_LABEL: Record<string, string> = {
  BackcountrySki: "Backcountry ski",
  AlpineSki: "Resort ski",
  NordicSki: "Nordic ski",
  TrailRun: "Trail run",
  MountainBikeRide: "Mountain bike",
  EMountainBikeRide: "E-mountain bike",
  GravelRide: "Gravel ride",
  Ride: "Road ride",
  EBikeRide: "E-bike ride",
  Canoeing: "Canoe",
  Kayaking: "Kayak",
  StandUpPaddling: "Paddleboard",
  Rowing: "Row",
  RockClimbing: "Climb",
};

const labelFor = (sport: string) =>
  SPORT_LABEL[sport] ?? sport.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^(\w)(.*)$/, (_, a, b) => a + b.toLowerCase());

/**
 * Photos cost one Strava request per activity, so they're collected a batch at a time and
 * remembered (see StravaStore). Strava allows 100 reads per 15 minutes and 1,000 a day.
 */
const PHOTO_BATCH = 45;
const DAILY_PHOTO_CALLS = 600;

const TRIM_METERS = 805; // half a mile off each end
const M_PER_MI = 1609.34;

type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  start_date_local: string;
  distance: number;
  total_elevation_gain: number;
  moving_time?: number;
  total_photo_count?: number;
  trainer?: boolean;
  manual?: boolean;
  map?: { summary_polyline?: string | null };
};

export type StravaPhotos = Record<string, { n: number; urls: string[] }>;

/** What's kept between syncs: the activities, and the photos found so far. */
export type StravaStore = {
  version: 2;
  syncedAt: string; // last full activity list
  routes: Route[]; // without photos
  photos: StravaPhotos;
  photoDay: { day: string; calls: number };
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

async function listRoutes(token: string): Promise<Route[]> {
  const acts = await allActivities(token);
  const routes: Route[] = [];
  for (const a of acts) {
    if (SKIP.has(a.sport_type) || !a.map?.summary_polyline) continue;
    const coords = trimEnds(decodePolyline(a.map.summary_polyline));
    if (coords.length < 2) continue;
    routes.push({
      id: `s${a.id}`,
      name: a.name,
      kind: kindFor(a.sport_type),
      date: a.start_date_local.slice(0, 10),
      miles: Math.round((a.distance / M_PER_MI) * 10) / 10,
      gainFt: Math.round(a.total_elevation_gain * 3.28084),
      coords: [],
      polyline: encodePolyline(coords),
      source: "strava",
      url: `https://www.strava.com/activities/${a.id}`,
      sport: labelFor(a.sport_type),
      startedAt: a.start_date_local,
      movingSec: a.moving_time,
      photoCount: a.total_photo_count ?? 0,
    });
  }
  return routes.sort((x, y) => (y.startedAt ?? "").localeCompare(x.startedAt ?? ""));
}

/** Activities whose photos haven't been collected yet, or have changed since. */
export function photosPending(store: StravaStore) {
  return store.routes.filter((r) => (r.photoCount ?? 0) > 0 && store.photos[r.id]?.n !== r.photoCount);
}

/**
 * One sync. Refreshes the activity list when `full` is set, then collects the next batch
 * of photos, newest activities first. Starts from the previous store so nothing is refetched.
 */
export async function syncStrava(prev: StravaStore | null, full: boolean): Promise<StravaStore> {
  const token = await accessToken();
  const today = new Date().toISOString().slice(0, 10);
  const store: StravaStore = {
    version: 2,
    syncedAt: prev?.syncedAt ?? "",
    routes: prev?.routes ?? [],
    photos: { ...(prev?.photos ?? {}) },
    photoDay: prev?.photoDay?.day === today ? { ...prev.photoDay } : { day: today, calls: 0 },
  };
  if (full || !store.routes.length) {
    store.routes = await listRoutes(token);
    store.syncedAt = new Date().toISOString();
  }
  const budget = Math.min(PHOTO_BATCH, DAILY_PHOTO_CALLS - store.photoDay.calls);
  for (const r of photosPending(store).slice(0, Math.max(0, budget))) {
    const res = await fetch(`https://www.strava.com/api/v3/activities/${r.id.slice(1)}/photos?size=1600&photo_sources=true`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    store.photoDay.calls++;
    if (res.status === 429) break; // over Strava's limit; the next sync picks up here
    if (!res.ok) continue;
    const list = (await res.json()) as { urls?: Record<string, string> }[];
    store.photos[r.id] = { n: r.photoCount ?? 0, urls: list.map((p) => (p.urls ? Object.values(p.urls)[0] : "")).filter(Boolean) };
  }
  return store;
}

/** Routes as the map wants them: photos attached. */
export function routesFrom(store: StravaStore): Route[] {
  return store.routes.map((r) => {
    const urls = store.photos[r.id]?.urls;
    return urls?.length ? { ...r, photos: urls } : r;
  });
}
