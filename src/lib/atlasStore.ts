import { BlobNotFoundError, head, put } from "@vercel/blob";
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

/** Always-fresh read, used before writing so two saves never overwrite each other's changes. */
export async function readEditsFresh(): Promise<AtlasEdits> {
  if (!storeConfigured()) return structuredClone(EMPTY);
  try {
    const meta = await head(EDITS_PATH);
    const res = await fetch(`${meta.url}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`edits fetch ${res.status}`);
    return { ...structuredClone(EMPTY), ...((await res.json()) as AtlasEdits) };
  } catch (e) {
    if (e instanceof BlobNotFoundError) return structuredClone(EMPTY);
    throw e;
  }
}

/** Cached read for page loads; a save clears it. */
const readEditsCached = unstable_cache(readEditsFresh, ["atlas-edits-v1"], { tags: ["atlas-edits"], revalidate: 3600 });

export async function writeEdits(edits: AtlasEdits) {
  edits.updatedAt = new Date().toISOString();
  await put(EDITS_PATH, JSON.stringify(edits), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  revalidateTag("atlas-edits");
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
