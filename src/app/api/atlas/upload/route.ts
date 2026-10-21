import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { canEdit } from "@/lib/editAuth";
import { storeConfigured } from "@/lib/atlasStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // the browser resizes before upload; this is a safety net

/** One photo per request. Returns its public URL to add to a place. */
export async function POST(req: Request) {
  if (!(await canEdit(req))) return NextResponse.json({ error: "Editing needs the edit password." }, { status: 401 });
  if (!storeConfigured())
    return NextResponse.json({ error: "Storage isn't connected yet. Connect a Blob store to this project in Vercel." }, { status: 503 });
  const form = await req.formData();
  const file = form.get("file");
  const placeId = String(form.get("placeId") ?? "new").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "new";
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No photo in the upload." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is over 4 MB after resizing." }, { status: 413 });
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return NextResponse.json({ error: "Use a JPEG, PNG or WebP." }, { status: 415 });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`atlas/photos/${placeId}/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });
  return NextResponse.json({ url: blob.url });
}
