import { head } from "@vercel/blob";
import { photoPath } from "@/lib/familyStore";

export const runtime = "nodejs";

/**
 * Family photos, served from Blob behind the family password (the middleware
 * checks it before this runs). The storage address never reaches the browser.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const meta = await head(photoPath(name));
    const res = await fetch(meta.url);
    if (!res.ok || !res.body) return new Response("Not found", { status: 404 });
    return new Response(res.body, {
      headers: {
        "Content-Type": meta.contentType,
        // Private: the browser may keep it, shared caches may not. Names never change.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
