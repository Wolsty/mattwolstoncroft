import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "site-auth";
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

  // Constant-time-ish comparison: compare same-length buffers.
  const ok =
    password.length === expected.length &&
    (() => {
      let mismatch = 0;
      for (let i = 0; i < expected.length; i++) {
        mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      return mismatch === 0;
    })();

  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
