import { NextResponse } from "next/server";
import { FAMILY_EDIT_COOKIE, familyEditPassword, familyEditToken, sameToken } from "@/lib/familyAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Matthew's sign-in for reviewing what family send in. */
export async function POST(req: Request) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body?.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const expected = familyEditPassword();
  if (!expected) return NextResponse.json({ ok: false, error: "FAMILY_EDIT_PASSWORD is not set." }, { status: 500 });
  const [given, want] = await Promise.all([familyEditToken(password), familyEditToken(expected)]);
  if (!sameToken(given, want)) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FAMILY_EDIT_COOKIE, want, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
