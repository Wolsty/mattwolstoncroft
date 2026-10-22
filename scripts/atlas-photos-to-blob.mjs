#!/usr/bin/env node
/**
 * Upload Atlas photos from public/atlas-photos/ to Vercel Blob, at the SAME
 * paths (atlas-photos/<place>/<file>.jpg), and record the store's base URL in
 * atlas-photos.config.json so next.config.mjs can send /atlas-photos/* there.
 *
 * Why: every Vercel deploy stored its own copy of ~375 MB of photos, and a day
 * of map work (20 deploys) filled the Hobby plan's 10 GB of deployment storage.
 * In Blob they are stored once. Because the paths do not change, places.json,
 * edits saved on the site (covers, removed photos) and the Atlas password all
 * keep working untouched.
 *
 * Safe to re-run: photos already in Blob are skipped, so after a new photo
 * import, run it again and it uploads only the new ones.
 *
 *   node scripts/atlas-photos-to-blob.mjs            upload
 *   node scripts/atlas-photos-to-blob.mjs --dry-run  count only, upload nothing
 *
 * Credentials, either of these in .env.local:
 *   BLOB_READ_WRITE_TOKEN   (Vercel > Storage > your Blob store > .env.local tab)
 *   or what `npx vercel env pull .env.local` writes (BLOB_STORE_ID + VERCEL_OIDC_TOKEN)
 *
 * Each upload is one Blob "advanced operation"; Hobby includes 2,000 a month.
 * The script refuses to start a run of more than LIMIT uploads without --yes.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { list, put } from "@vercel/blob";

const ROOT = process.cwd();
const SRC = join(ROOT, "public", "atlas-photos");
const CONFIG = join(ROOT, "atlas-photos.config.json");
const PREFIX = "atlas-photos/";
const CONCURRENCY = 6; // well under Hobby's 900 advanced operations per minute
const LIMIT = 1500;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

// Minimal .env.local loader, so this needs no extra packages.
for (const f of [".env.local", ".env"]) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

if (!existsSync(SRC)) {
  console.error(`No photos folder at ${SRC}. Run this from the mattwolstoncroft repo folder.`);
  process.exit(1);
}
const hasCreds =
  process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
if (!hasCreds && !dryRun) {
  console.error(
    "No Blob credentials found in .env.local.\n" +
      "  Run:  npx vercel env pull .env.local\n" +
      "  or copy BLOB_READ_WRITE_TOKEN from Vercel > Storage > your Blob store > .env.local tab.",
  );
  process.exit(1);
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
  .map((f) => ({ file: f, pathname: PREFIX + relative(SRC, f).split(sep).join("/") }));

// What is already in Blob, so a re-run only uploads new photos.
const existing = new Map();
let base = null;
if (hasCreds) {
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      existing.set(b.pathname, b.size);
      if (!base) base = new URL(b.url).origin;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

const todo = files.filter((f) => existing.get(f.pathname) !== statSync(f.file).size);
const mb = (n) => (n / 1024 / 1024).toFixed(1);
const todoBytes = todo.reduce((s, f) => s + statSync(f.file).size, 0);
console.log(
  `${files.length} photos on disk, ${files.length - todo.length} already in Blob, ` +
    `${todo.length} to upload (${mb(todoBytes)} MB).`,
);

if (dryRun) process.exit(0);
if (todo.length > LIMIT && !args.has("--yes")) {
  console.error(`That's more than ${LIMIT} uploads. Re-run with --yes if you're sure.`);
  process.exit(1);
}

let done = 0;
let failed = [];
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
          cacheControlMaxAge: 60 * 60 * 24 * 365, // photo files never change in place
        });
        if (!base) base = new URL(blob.url).origin;
        break;
      } catch (e) {
        if (attempt === 3) failed.push(`${f.pathname}: ${e.message}`);
        else await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    done++;
    if (done % 50 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (failed.length) {
  console.error(`\n${failed.length} failed (re-run to retry just these):\n  ` + failed.slice(0, 10).join("\n  "));
  process.exit(1);
}
if (!base) {
  console.error("Could not work out the Blob store's URL. Nothing to configure.");
  process.exit(1);
}

// Spot-check one photo through its public URL before anything points at Blob.
const sample = files[0];
const res = await fetch(`${base}/${sample.pathname}`, { method: "HEAD" });
if (!res.ok) {
  console.error(`Uploaded, but ${base}/${sample.pathname} returned ${res.status}. Not writing config.`);
  process.exit(1);
}

writeFileSync(CONFIG, JSON.stringify({ base, prefix: PREFIX }, null, 2) + "\n");
console.log(`\nAll ${files.length} photos are in Blob. Wrote ${relative(ROOT, CONFIG)} (base ${base}).`);
