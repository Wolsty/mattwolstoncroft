#!/usr/bin/env node
// Checks the Strava keys in .env.local: can we get a token, and how many activities come back?
//   node scripts/strava-check.mjs
import fs from "node:fs";
const env = fs.readFileSync(".env.local", "utf8");
const read = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const r = await fetch("https://www.strava.com/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: read("STRAVA_CLIENT_ID"),
    client_secret: read("STRAVA_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: read("STRAVA_REFRESH_TOKEN"),
  }),
});
const t = await r.json();
if (!r.ok) {
  console.log("Token step failed:", r.status, JSON.stringify(t));
  process.exit(1);
}
console.log("Token step OK. Scopes granted at sign-in are checked next.");
const a = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=200&page=1", {
  headers: { Authorization: `Bearer ${t.access_token}` },
});
const acts = await a.json();
if (!a.ok) {
  console.log("Activities step failed:", a.status, JSON.stringify(acts));
  process.exit(1);
}
const kinds = {};
for (const x of acts) kinds[x.sport_type] = (kinds[x.sport_type] || 0) + 1;
console.log(`Activities step OK: ${acts.length} on the first page.`, kinds);
console.log("Refresh token matches .env.local:", t.refresh_token === read("STRAVA_REFRESH_TOKEN"));
