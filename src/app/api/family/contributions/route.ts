import { NextResponse } from "next/server";
import data from "@/content/family.json";
import type { FamilyData, Status } from "@/lib/family/types";
import { isFamilyOwner } from "@/lib/familyAuth";
import { getPublicContributions, readContributions, readModeration, statusOf, storeConfigured, writeModeration } from "@/lib/familyStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const family = data as unknown as FamilyData;

/** Family get approved items. Matthew gets everything, with its status, for review. */
export async function GET(req: Request) {
  if (await isFamilyOwner(req)) {
    const [items, mod] = await Promise.all([readContributions(), readModeration()]);
    return NextResponse.json(
      {
        owner: true,
        storeReady: storeConfigured(),
        items: items.map((c) => ({ ...c, status: statusOf(mod, c.id) })).reverse(),
        portraits: mod.portraits,
        resolved: mod.resolved,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json({ owner: false, ...(await getPublicContributions()) }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Matthew's decisions:
 *   { action: "status", id, status }            approve or hide something
 *   { action: "portrait", personId, url|null }  use an approved photo as someone's portrait
 *   { action: "resolve", questionId, resolved } mark an open question answered
 */
export async function POST(req: Request) {
  if (!(await isFamilyOwner(req))) return NextResponse.json({ error: "Only Matthew can do that." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const mod = await readModeration();
  if (body.action === "status" && typeof body.id === "string" && ["pending", "approved", "hidden"].includes(String(body.status))) {
    mod.status[body.id] = body.status as Status;
  } else if (body.action === "portrait" && typeof body.personId === "string" && family.people[body.personId]) {
    if (typeof body.url === "string" && body.url.startsWith("/family-photos/")) mod.portraits[body.personId] = body.url;
    else delete mod.portraits[body.personId];
  } else if (body.action === "resolve" && typeof body.questionId === "string") {
    mod.resolved = mod.resolved.filter((q) => q !== body.questionId);
    if (body.resolved) mod.resolved.push(body.questionId);
  } else {
    return NextResponse.json({ error: "Unknown change." }, { status: 400 });
  }
  await writeModeration(mod);
  return NextResponse.json({ ok: true });
}
