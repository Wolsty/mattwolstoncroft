#!/usr/bin/env node
/**
 * One-time Strava sign-in for the Atlas.
 *
 *   node scripts/strava-auth.mjs
 *
 * Reads STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET from .env.local, opens Strava's
 * approval page, catches the reply on http://localhost:8723, and writes
 * STRAVA_REFRESH_TOKEN back into .env.local. Nothing leaves your machine except
 * the calls to Strava.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";

const ENV = path.join(process.cwd(), ".env.local");
const PORT = 8723;
const REDIRECT = `http://localhost:${PORT}/callback`;

const env = fs.existsSync(ENV) ? fs.readFileSync(ENV, "utf8") : "";
const read = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const id = read("STRAVA_CLIENT_ID");
const secret = read("STRAVA_CLIENT_SECRET");

if (!id || !secret) {
  console.error("\nAdd STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET to .env.local first (from strava.com/settings/api).\n");
  process.exit(1);
}

const authUrl =
  "https://www.strava.com/oauth/authorize?" +
  new URLSearchParams({
    client_id: id,
    redirect_uri: REDIRECT,
    response_type: "code",
    approval_prompt: "force",
    scope: "read,activity:read_all",
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  const scope = url.searchParams.get("scope") || "";
  const done = (msg, ok) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<body style="font:18px Georgia,serif;padding:48px;background:#0b0b0c;color:#ececee"><p>${msg}</p><p>You can close this tab.</p></body>`);
    console.log(`\n${msg}\n`);
    server.close();
    process.exit(ok ? 0 : 1);
  };
  if (!code) return done("Strava didn't send an approval code. Run the script again and click Authorize.", false);
  if (!scope.includes("activity:read")) return done("Activity access wasn't granted. Run it again and leave the activity box checked.", false);

  try {
    const r = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: id, client_secret: secret, code, grant_type: "authorization_code" }),
    });
    const json = await r.json();
    if (!r.ok || !json.refresh_token) return done(`Strava refused the code: ${JSON.stringify(json)}`, false);

    let next = fs.readFileSync(ENV, "utf8");
    const line = `STRAVA_REFRESH_TOKEN=${json.refresh_token}`;
    next = /^STRAVA_REFRESH_TOKEN=.*$/m.test(next)
      ? next.replace(/^STRAVA_REFRESH_TOKEN=.*$/m, line)
      : next.replace(/\n?$/, "\n") + line + "\n";
    fs.writeFileSync(ENV, next);
    const who = json.athlete ? `${json.athlete.firstname} ${json.athlete.lastname}` : "your account";
    done(`Connected to Strava as ${who}. STRAVA_REFRESH_TOKEN is saved in .env.local.`, true);
  } catch (e) {
    done(`Something went wrong talking to Strava: ${e.message}`, false);
  }
});

server.listen(PORT, () => {
  console.log("\nOpening Strava in your browser. Click Authorize.\nIf it doesn't open, visit:\n\n" + authUrl + "\n");
  exec(`open "${authUrl}"`);
});
