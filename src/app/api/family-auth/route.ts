import { NextResponse } from "next/server";
import { FAMILY_COOKIE, FAMILY_COOKIE_MAX_AGE, familyToken, sameToken } from "@/lib/familyAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Family sign-in. Sets the family cookie when the password matches FAMILY_PASSWORD. */
export async function POST(req: Request) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body?.password === "string") password = body.password.trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const expected = process.env.FAMILY_PASSWORD;
  if (!expected) return NextResponse.json({ ok: false, error: "FAMILY_PASSWORD is not set." }, { status: 500 });
  // Family will type this on phones: ignore case and surrounding spaces.
  const [given, want] = await Promise.all([familyToken(password.toLowerCase()), familyToken(expected.trim().toLowerCase())]);
  if (!sameToken(given, want)) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FAMILY_COOKIE, await familyToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: FAMILY_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
