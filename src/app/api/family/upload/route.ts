import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isFamily, isFamilyOwner } from "@/lib/familyAuth";
import { photoPath, storeConfigured } from "@/lib/familyStore";
import { getClientIp, takeToken } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // the browser resizes first; this is a safety net

/** One photo per request. Returns the /family-photos/ address to attach to a contribution. */
export async function POST(req: Request) {
  if (!(await isFamily(req)) && !(await isFamilyOwner(req))) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!storeConfigured()) return NextResponse.json({ error: "Photo storage isn't connected yet." }, { status: 503 });
  if (!takeToken(`family-upload:${getClientIp(req)}`, 40, 10 * 60 * 1000).ok)
    return NextResponse.json({ error: "That's a lot of photos at once. Try again in a few minutes." }, { status: 429 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No photo in the upload." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return NextResponse.json({ error: "Use a JPEG, PNG or WebP photo." }, { status: 415 });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;
  await put(photoPath(name), file, { access: "public", addRandomSuffix: false, contentType: file.type });
  return NextResponse.json({ url: `/family-photos/${name}` });
}
