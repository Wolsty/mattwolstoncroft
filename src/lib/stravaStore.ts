import { BlobNotFoundError, head, put } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import type { StravaStore } from "./strava";

/**
 * Strava activities and photos are kept in Vercel Blob between syncs, so a visit never
 * waits on Strava and photos collected over many syncs are never fetched twice.
 */
const PATH = "atlas/strava.json";

// The file's address never changes once written, so it's looked up once a day.
const blobUrl = unstable_cache(async () => (await head(PATH)).url, ["atlas-strava-url"], { revalidate: 86400 });

export async function readStrava(): Promise<StravaStore | null> {
  try {
    const res = await fetch(await blobUrl(), { cache: "no-store" });
    if (!res.ok) return null;
    const store = (await res.json()) as StravaStore;
    return store.version === 2 ? store : null;
  } catch (e) {
    if (!(e instanceof BlobNotFoundError)) console.error("[strava] read", e);
    return null;
  }
}

export async function writeStrava(store: StravaStore) {
  await put(PATH, JSON.stringify(store), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}
