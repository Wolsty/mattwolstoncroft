import { BlobNotFoundError, del, head, list, put } from "@vercel/blob";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Place, PlaceType } from "@/components/atlas/types";
import basePlaces from "../../public/atlas-data/places.json";

/**
 * Atlas edits made on the site.
 *
 * The base list of places ships with the site (public/atlas-data/places.json, which the
 * photo import updates). Everything Matthew changes in the browser is kept separately, as
 * one small JSON document in Vercel Blob, and layered on top when the page loads:
 *   - places: per-pin changes (name, type, date, story, location, photos added/removed, cover)
 *   - added:  pins created on the site
 *   - deleted: pins removed on the site
 * Keeping edits as a layer means a later photo import can still update a pin you've edited.
 */
export type PlaceEdit = {
  name?: string;
  type?: PlaceType;
  lat?: number;
  lng?: number;
  date?: string;
  dateText?: string;
  notes?: string;
  region?: string;
  addedPhotos?: string[];
  removedPhotos?: string[];
  cover?: string;
};

export type AtlasEdits = {
  version: 1;
  updatedAt: string;
  places: Record<string, PlaceEdit>;
  added: Place[];
  deleted: string[];
};

const EDITS_PATH = "atlas/edits.json";
const EMPTY: AtlasEdits = { version: 1, updatedAt: "", places: {}, added: [], deleted: [] };

/**
 * A Blob store connected in the Vercel dashboard provides BLOB_STORE_ID and signs in with
 * Vercel's built-in OIDC token; older setups provide BLOB_READ_WRITE_TOKEN. Either works.
 */
export function storeConfigured() {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Every save is written as a new, never-changing file (atlas/edits/<time>.json) and the
 * newest one wins. Overwriting a single file didn't work: Blob's CDN kept serving the old
 * copy for a minute, so a reload, or the next save, could bring back what was just removed.
 */
const EDITS_DIR = "atlas/edits/";
const KEEP_VERSIONS = 20;

async function versions() {
  const { blobs } = await list({ prefix: EDITS_DIR, limit: 1000 });
  return blobs.sort((a, b) => b.pathname.localeCompare(a.pathname)); // newest first
}

/** Always-fresh read, used before writing so two saves never overwrite each other's changes. */
export async function readEditsFresh(): Promise<AtlasEdits> {
  if (!storeConfigured()) return structuredClone(EMPTY);
  const [latest] = await versions();
  let url = latest?.url;
  if (!url) {
    // Before versioned saves: the single file from earlier.
    try {
      url = (await head(EDITS_PATH)).url;
    } catch (e) {
      if (e instanceof BlobNotFoundError) return structuredClone(EMPTY);
      throw e;
    }
  }
  const res = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`edits fetch ${res.status}`);
  return { ...structuredClone(EMPTY), ...((await res.json()) as AtlasEdits) };
}

/** Cached read for page loads; a save clears it. */
const readEditsCached = unstable_cache(readEditsFresh, ["atlas-edits-v2"], { tags: ["atlas-edits"], revalidate: 3600 });

export async function writeEdits(edits: AtlasEdits) {
  edits.updatedAt = new Date().toISOString();
  await put(`${EDITS_DIR}${String(Date.now()).padStart(15, "0")}.json`, JSON.stringify(edits), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  revalidateTag("atlas-edits");
  // Tidy up: keep the last few versions as a safety net.
  try {
    const old = (await versions()).slice(KEEP_VERSIONS).map((b) => b.url);
    if (old.length) await del(old);
  } catch (e) {
    console.error("[atlas] tidy edits", e);
  }
}

export function applyEdits(base: Place[], edits: AtlasEdits): Place[] {
  const gone = new Set(edits.deleted);
  const out: Place[] = [];
  for (const p of [...base, ...edits.added]) {
    if (gone.has(p.id)) continue;
    const e = edits.places[p.id];
    if (!e) {
      out.push(p);
      continue;
    }
    const { addedPhotos = [], removedPhotos = [], cover, ...fields } = e;
    const removed = new Set(removedPhotos);
    let photos = [...(p.photos ?? []), ...addedPhotos].filter((u, i, a) => !removed.has(u) && a.indexOf(u) === i);
    if (cover && photos.includes(cover)) photos = [cover, ...photos.filter((u) => u !== cover)];
    out.push({ ...p, ...fields, photos });
  }
  return out;
}

export async function getPlaces(): Promise<Place[]> {
  const base = basePlaces as unknown as Place[];
  if (!storeConfigured()) return base;
  try {
    return applyEdits(base, await readEditsCached());
  } catch (e) {
    console.error("[atlas] edits unavailable", e);
    return base; // never let a storage hiccup blank the map
  }
}

export function baseList(): Place[] {
  return basePlaces as unknown as Place[];
}

export function basePlace(id: string): Place | undefined {
  return (basePlaces as unknown as Place[]).find((p) => p.id === id);
}
