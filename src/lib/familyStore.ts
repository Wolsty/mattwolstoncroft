import { del, list, put } from "@vercel/blob";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Contribution, Moderation, PublicContributions, Status } from "@/lib/family/types";

/**
 * What family send in, kept in Vercel Blob (the same store as the Atlas).
 *
 * - Each contribution is its own never-changing file (family/contributions/<time>-<id>.json),
 *   so two relatives sending something at the same moment can't overwrite each other.
 * - Matthew's decisions (approve, hide, portrait, question answered) live in one small
 *   document saved as a new version each time, newest wins, like the Atlas edits.
 * - Photos are stored under family/photos/ and only ever served through /family-photos/,
 *   behind the family password, so the storage address never reaches the browser.
 */
const CONTRIB_DIR = "family/contributions/";
const MOD_DIR = "family/moderation/";
const KEEP_VERSIONS = 20;
const EMPTY: Moderation = { version: 1, updatedAt: "", status: {}, portraits: {}, resolved: [] };

export function storeConfigured() {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

async function listAll(prefix: string) {
  const out: { pathname: string; url: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => a.pathname.localeCompare(b.pathname));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`family fetch ${res.status}`);
  return (await res.json()) as T;
}

export async function readModeration(): Promise<Moderation> {
  if (!storeConfigured()) return structuredClone(EMPTY);
  const versions = await listAll(MOD_DIR);
  const latest = versions[versions.length - 1];
  if (!latest) return structuredClone(EMPTY);
  return { ...structuredClone(EMPTY), ...(await fetchJson<Moderation>(latest.url)) };
}

export async function writeModeration(m: Moderation) {
  m.updatedAt = new Date().toISOString();
  await put(`${MOD_DIR}${String(Date.now()).padStart(15, "0")}.json`, JSON.stringify(m), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  revalidateTag("family-contrib");
  try {
    const old = (await listAll(MOD_DIR)).slice(0, -KEEP_VERSIONS).map((b) => b.url);
    if (old.length) await del(old);
  } catch (e) {
    console.error("[family] tidy moderation", e);
  }
}

export async function readContributions(): Promise<Contribution[]> {
  if (!storeConfigured()) return [];
  const files = await listAll(CONTRIB_DIR);
  const items = await Promise.all(
    files.map((f) => fetchJson<Contribution>(f.url).catch(() => null)),
  );
  return items.filter((x): x is Contribution => Boolean(x));
}

export async function saveContribution(c: Contribution) {
  const stamp = String(Date.now()).padStart(15, "0");
  await put(`${CONTRIB_DIR}${stamp}-${c.id}.json`, JSON.stringify(c), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  revalidateTag("family-contrib");
}

export function statusOf(m: Moderation, id: string): Status {
  return m.status[id] ?? "pending";
}

async function readPublicFresh(): Promise<PublicContributions> {
  const [items, mod] = await Promise.all([readContributions(), readModeration()]);
  return {
    // Only what Matthew approved, with contact details stripped.
    items: items.filter((c) => statusOf(mod, c.id) === "approved").map(({ contact: _contact, ...c }) => c),
    portraits: mod.portraits,
    resolved: mod.resolved,
  };
}

const readPublicCached = unstable_cache(readPublicFresh, ["family-public-v1"], { tags: ["family-contrib"], revalidate: 3600 });

export async function getPublicContributions(): Promise<PublicContributions> {
  if (!storeConfigured()) return { items: [], portraits: {}, resolved: [] };
  try {
    return await readPublicCached();
  } catch (e) {
    console.error("[family] contributions unavailable", e);
    return { items: [], portraits: {}, resolved: [] }; // never let storage blank the tree
  }
}

/** Blob pathname for a photo served at /family-photos/<name>. */
export const photoPath = (name: string) => `family/photos/${name}`;
