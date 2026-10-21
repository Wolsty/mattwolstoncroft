import { NextResponse } from "next/server";
import { EDIT_COOKIE, EDIT_COOKIE_MAX_AGE, editToken } from "@/lib/editAuth";

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
  const expected = process.env.ATLAS_EDIT_PASSWORD;
  if (!expected) return NextResponse.json({ ok: false, error: "ATLAS_EDIT_PASSWORD is not set." }, { status: 500 });
  const [given, want] = await Promise.all([editToken(password), editToken(expected)]);
  let mismatch = 0;
  for (let i = 0; i < want.length; i++) mismatch |= given.charCodeAt(i) ^ want.charCodeAt(i);
  if (mismatch !== 0) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(EDIT_COOKIE, want, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: EDIT_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
