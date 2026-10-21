import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchStravaRoutes, stravaConfigured } from "@/lib/strava";

// Strava is asked at most every 6 hours; everyone in between gets the cached copy.
const getRoutes = unstable_cache(fetchStravaRoutes, ["strava-routes-v3"], { revalidate: 6 * 60 * 60 });

export const dynamic = "force-dynamic";

export async function GET() {
  if (!stravaConfigured()) return NextResponse.json({ routes: [], configured: false });
  try {
    const routes = await getRoutes();
    return NextResponse.json({ routes, configured: true });
  } catch (e) {
    console.error("[strava]", e);
    // The map still works without Strava; it just shows the saved routes.
    // The message names the failing step and Strava's status code; it never contains a key.
    const detail = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ routes: [], configured: true, error: "unavailable", detail }, { status: 200 });
  }
}
