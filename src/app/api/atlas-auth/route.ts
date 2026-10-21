import { NextResponse } from "next/server";
import { ATLAS_COOKIE, ATLAS_COOKIE_MAX_AGE, atlasToken } from "@/lib/atlasAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body?.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = process.env.ATLAS_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "ATLAS_PASSWORD is not configured on the server." }, { status: 500 });
  }

  // Compare hashes so the check takes the same time whatever was typed.
  const [given, want] = await Promise.all([atlasToken(password), atlasToken(expected)]);
  let mismatch = 0;
  for (let i = 0; i < want.length; i++) mismatch |= given.charCodeAt(i) ^ want.charCodeAt(i);
  if (mismatch !== 0) return NextResponse.json({ ok: false }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ATLAS_COOKIE, want, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ATLAS_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
