#!/usr/bin/env node
/**
 * Upload Atlas photos from public/atlas-photos/ to Vercel Blob, at the SAME
 * paths (atlas-photos/<place>/<file>.jpg). next.config.mjs serves
 * /atlas-photos/* from Blob, so places.json, edits saved on the site and the
 * Atlas password are unaffected.
 *
 * Why: every Vercel deploy stored its own copy of ~375 MB of photos, and a day
 * of map work (20 deploys) filled the Hobby plan's 10 GB of deployment storage.
 *
 * Runs automatically before every `git push` (.githooks/pre-push), so new
 * photos are uploaded without anyone remembering to. It is cheap to run often:
 * a local list of what has already been uploaded (.atlas-photos-uploaded.json,
 * not committed) means a push with no new photos makes no calls to Blob at all.
 * Only new photos count against Blob's 2,000 included operations a month.
 *
 *   node scripts/atlas-photos-to-blob.mjs            upload anything new
 *   node scripts/atlas-photos-to-blob.mjs --dry-run  report only
 *   node scripts/atlas-photos-to-blob.mjs --resync   re-check Blob (2 operations)
 *
 * Credentials: BLOB_READ_WRITE_TOKEN in .env.production.local (git-ignored),
 * copied from Vercel > Storage > mattwolstoncroft-blob > .env.local tab.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { list, put } from "@vercel/blob";

const ROOT = process.cwd();
const SRC = join(ROOT, "public", "atlas-photos");
const CONFIG = join(ROOT, "atlas-photos.config.json");
const MANIFEST = join(ROOT, ".atlas-photos-uploaded.json");
const PREFIX = "atlas-photos/";
const CONCURRENCY = 6; // well under Hobby's 900 advanced operations per minute
const LIMIT = 1500;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

// Load env files without overriding anything already set. The read-write token
// is passed to Blob explicitly: with BLOB_STORE_ID present the library would
// otherwise try Vercel's OIDC sign-in, which this store only allows from deploys.
for (const f of [".env.production.local", ".env.local"]) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;

if (!existsSync(SRC)) {
  console.log("Atlas photos: no local photos folder, nothing to upload.");
  process.exit(0);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const contentTypeOf = (f) =>
  f.endsWith(".png") ? "image/png" : f.endsWith(".webp") ? "image/webp" : "image/jpeg";

const files = walk(SRC)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .map((f) => ({ file: f, size: statSync(f).size, pathname: PREFIX + relative(SRC, f).split(sep).join("/") }));

let manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : null;
const saveManifest = () => writeFileSync(MANIFEST, JSON.stringify(manifest) + "\n");

function needCreds() {
  if (token && !/^\*+$/.test(token)) return;
  console.error(
    token
      ? "Atlas photos: BLOB_READ_WRITE_TOKEN is the masked placeholder (****). Copy it again with 'Show secret'."
      : "Atlas photos: no BLOB_READ_WRITE_TOKEN in .env.production.local.\n" +
          "  Copy it from Vercel > Storage > mattwolstoncroft-blob > .env.local tab.",
  );
  process.exit(1);
}

// First run on this machine (or --resync): learn what is already in Blob.
if (!manifest || args.has("--resync")) {
  needCreds();
  manifest = {};
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000, token });
    for (const b of page.blobs) manifest[b.pathname] = b.size;
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  if (!dryRun) saveManifest();
}

const todo = files.filter((f) => manifest[f.pathname] !== f.size);
if (todo.length === 0) {
  console.log(`Atlas photos: all ${files.length} already in Blob.`);
  process.exit(0);
}
const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`Atlas photos: ${todo.length} new (${mb(todo.reduce((s, f) => s + f.size, 0))} MB) to upload.`);
if (dryRun) process.exit(0);
if (todo.length > LIMIT && !args.has("--yes")) {
  console.error(`That's more than ${LIMIT} uploads. Re-run with --yes if you're sure.`);
  process.exit(1);
}
needCreds();

let base = existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, "utf8")).base : null;
let done = 0;
const failed = [];
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const f = queue.shift();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const blob = await put(f.pathname, readFileSync(f.file), {
          access: "public",
          addRandomSuffix: false, // keep the path identical to the site's
          allowOverwrite: true,   // a re-run replaces a half-finished upload
          contentType: contentTypeOf(f.file),
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          token,
        });
        if (!base) base = new URL(blob.url).origin;
        manifest[f.pathname] = f.size;
        break;
      } catch (e) {
        if (attempt === 3) failed.push(`${f.pathname}: ${e.message}`);
        else await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    done++;
    if (done % 50 === 0 || done === todo.length) {
      saveManifest();
      console.log(`  ${done}/${todo.length}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
saveManifest();

if (failed.length) {
  console.error(`\n${failed.length} failed (run again to retry just these):\n  ` + failed.slice(0, 10).join("\n  "));
  process.exit(1);
}
if (!existsSync(CONFIG) && base) {
  writeFileSync(CONFIG, JSON.stringify({ base, prefix: PREFIX }, null, 2) + "\n");
  console.log(`Wrote ${relative(ROOT, CONFIG)}.`);
}
console.log(`Atlas photos: uploaded ${todo.length}. All ${files.length} are in Blob.`);
