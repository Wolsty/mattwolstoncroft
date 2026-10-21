import { NextResponse } from "next/server";
import { canEdit } from "@/lib/editAuth";
import { applyEdits, baseList, basePlace, getPlaces, readEditsFresh, storeConfigured, writeEdits, type PlaceEdit } from "@/lib/atlasStore";
import { TYPES, type Place } from "@/components/atlas/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPE_IDS = new Set(TYPES.map((t) => t.id));

/** Everything a viewer needs: the places with edits applied, and whether this viewer can edit. */
export async function GET(req: Request) {
  const [places, editable] = await Promise.all([getPlaces(), canEdit(req)]);
  return NextResponse.json(
    { places, canEdit: editable, storeReady: storeConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Keep only known fields, with sane types, so a bad request can't corrupt the store.
function cleanEdit(raw: Record<string, unknown>): PlaceEdit & { photos?: string[] } {
  const e: PlaceEdit & { photos?: string[] } = {};
  const str = (k: string, max = 4000) => (typeof raw[k] === "string" ? (raw[k] as string).slice(0, max) : undefined);
  const num = (k: string) => (typeof raw[k] === "number" && Number.isFinite(raw[k]) ? (raw[k] as number) : undefined);
  const urls = (k: string) =>
    Array.isArray(raw[k]) ? (raw[k] as unknown[]).filter((u): u is string => typeof u === "string").slice(0, 200) : undefined;
  for (const k of ["name", "date", "dateText", "region"] as const) if (str(k, 200) !== undefined) e[k] = str(k, 200);
  if (str("notes", 20000) !== undefined) e.notes = str("notes", 20000);
  if (typeof raw.type === "string" && TYPE_IDS.has(raw.type as never)) e.type = raw.type as PlaceEdit["type"];
  const lat = num("lat");
  const lng = num("lng");
  if (lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) Object.assign(e, { lat, lng });
  // The editor sends the full photo list it wants; the route works out what changed.
  if (urls("photos")) e.photos = urls("photos");
  return e;
}

/**
 * Changes, one at a time:
 *   { action: "update", id, edit }   change an existing pin
 *   { action: "add", place }         create a pin
 *   { action: "delete", id }         remove a pin
 * Responds with the full, updated list of places.
 */
export async function POST(req: Request) {
  if (!(await canEdit(req))) return NextResponse.json({ error: "Editing needs the edit password." }, { status: 401 });
  if (!storeConfigured())
    return NextResponse.json({ error: "Storage isn't connected yet. Connect a Blob store to this project in Vercel." }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const edits = await readEditsFresh();
  const action = body.action;

  if (action === "update" && typeof body.id === "string" && body.edit && typeof body.edit === "object") {
    const id = body.id;
    const { photos, ...fields } = cleanEdit(body.edit as Record<string, unknown>);
    const added = edits.added.find((p) => p.id === id);
    const base = basePlace(id);
    if (added) {
      // A pin created on the site: change it directly.
      Object.assign(added, fields);
      if (photos) added.photos = photos;
    } else if (base) {
      const edit: PlaceEdit = { ...edits.places[id], ...fields };
      if (photos) {
        // Stored relative to the shipped photos, so a later photo import can still add to this pin.
        const shipped = base.photos ?? [];
        edit.addedPhotos = photos.filter((u) => !shipped.includes(u));
        edit.removedPhotos = shipped.filter((u) => !photos.includes(u));
        edit.cover = photos[0];
      }
      edits.places[id] = edit;
    } else {
      return NextResponse.json({ error: "No such place." }, { status: 404 });
    }
  } else if (action === "add" && body.place && typeof body.place === "object") {
    const raw = body.place as Record<string, unknown>;
    const e = cleanEdit(raw);
    if (e.lat === undefined || e.lng === undefined) return NextResponse.json({ error: "A new place needs a location." }, { status: 400 });
    const place: Place = {
      id: `u-${crypto.randomUUID().slice(0, 10)}`,
      name: e.name ?? "",
      type: e.type ?? "kimbo",
      lat: e.lat,
      lng: e.lng,
      date: e.date ?? "",
      dateText: e.dateText ?? "",
      notes: e.notes ?? "",
      region: e.region ?? "",
      approx: false,
      photos: e.photos ?? [],
    };
    edits.added.push(place);
    body.id = place.id;
  } else if (action === "delete" && typeof body.id === "string") {
    const id = body.id;
    edits.added = edits.added.filter((p) => p.id !== id);
    delete edits.places[id];
    if (basePlace(id) && !edits.deleted.includes(id)) edits.deleted.push(id);
  } else {
    return NextResponse.json({ error: "Unknown change." }, { status: 400 });
  }

  await writeEdits(edits);
  const places = applyEdits(baseList(), edits);
  return NextResponse.json({ places, id: body.id ?? null });
}
