import { NextResponse, after } from "next/server";
import { unstable_cache } from "next/cache";
import { photosPending, routesFrom, stravaConfigured, syncStrava, type StravaStore } from "@/lib/strava";
import { storeConfigured } from "@/lib/atlasStore";
import { readStrava, writeStrava } from "@/lib/stravaStore";
import { canEdit } from "@/lib/editAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FULL_EVERY = 6 * 60 * 60 * 1000; // new activities: every 6 hours
const PHOTOS_EVERY = 30 * 60 * 1000; // while photos are still being collected: every 30 minutes

// One sync at a time per server instance.
let syncing = false;
let lastTry = 0;

async function sync(prev: StravaStore | null, full: boolean) {
  syncing = true;
  lastTry = Date.now();
  try {
    const next = await syncStrava(prev, full);
    await writeStrava(next);
    return next;
  } finally {
    syncing = false;
  }
}

// Without a Blob store: the old way, cached for 6 hours.
const uncachedFallback = unstable_cache(
  async () => routesFrom(await syncStrava(null, true)),
  ["strava-routes-v4"],
  { revalidate: 6 * 60 * 60 },
);

export async function GET() {
  if (!stravaConfigured()) return NextResponse.json({ routes: [], configured: false });
  try {
    if (!storeConfigured()) return NextResponse.json({ routes: await uncachedFallback(), configured: true });

    const stored = await readStrava();
    if (!stored) {
      // First run: get the activities now (photos follow over the next syncs).
      return NextResponse.json({ routes: routesFrom(await sync(null, true)), configured: true });
    }
    const age = Date.now() - Date.parse(stored.syncedAt || "0");
    const full = age > FULL_EVERY;
    const photos = photosPending(stored).length > 0 && Date.now() - lastTry > PHOTOS_EVERY;
    if ((full || photos) && !syncing && Date.now() - lastTry > 60_000) {
      // Answer right away with what's stored; sync after the response is sent.
      after(() => sync(stored, full).catch((e) => console.error("[strava] sync", e)));
    }
    return NextResponse.json({ routes: routesFrom(stored), configured: true });
  } catch (e) {
    console.error("[strava]", e);
    // The map still works without Strava; it just shows the saved routes.
    // The message names the failing step and Strava's status code; it never contains a key.
    const detail = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ routes: [], configured: true, error: "unavailable", detail }, { status: 200 });
  }
}

/** "Sync now" from the Strava panel (owner only): pulls new activities and the next batch of photos right away. */
export async function POST(req: Request) {
  if (!(await canEdit(req))) return NextResponse.json({ error: "Syncing needs the edit password." }, { status: 401 });
  if (!stravaConfigured() || !storeConfigured()) return NextResponse.json({ error: "Strava isn't connected." }, { status: 503 });
  try {
    const stored = await readStrava();
    // A second tap within a minute just returns what the first one fetched.
    if (stored && Date.now() - Date.parse(stored.syncedAt || "0") < 60_000) {
      return NextResponse.json({ routes: routesFrom(stored), syncedAt: stored.syncedAt });
    }
    const next = await sync(stored, true);
    return NextResponse.json({ routes: routesFrom(next), syncedAt: next.syncedAt });
  } catch (e) {
    console.error("[strava] sync now", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Sync failed." }, { status: 502 });
  }
}
