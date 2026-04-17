import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "site-auth";
const AUTH_VALUE = "1";

/**
 * Site-wide password gate. Anyone without a valid `site-auth` cookie is
 * redirected to /login. Static assets, the login page itself, and the
 * auth API routes are excluded via the matcher config below.
 */
export function middleware(req: NextRequest) {
  const authed = req.cookies.get(COOKIE_NAME)?.value === AUTH_VALUE;
  if (authed) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  const from = req.nextUrl.pathname + req.nextUrl.search;
  if (from && from !== "/") url.searchParams.set("next", from);
  else url.searchParams.delete("next");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Everything except: _next internals, favicon, static folders, login page,
    // and the auth API routes.
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/|login|api/auth).*)",
  ],
};
