import { NextResponse } from "next/server";
import { SITE_COOKIE, siteToken } from "@/lib/siteAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: Request) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body?.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = process.env.SITE_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SITE_PASSWORD is not configured on the server." },
      { status: 500 },
    );
  }

  // Compare hashes so the check takes the same time whatever was typed.
  const [given, want] = await Promise.all([siteToken(password), siteToken(expected)]);
  let mismatch = 0;
  for (let i = 0; i < want.length; i++) mismatch |= given.charCodeAt(i) ^ want.charCodeAt(i);
  const ok = mismatch === 0;

  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_COOKIE, want, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
