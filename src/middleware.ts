import { NextRequest, NextResponse } from "next/server";
import { ATLAS_COOKIE, atlasToken, isAtlasPath } from "@/lib/atlasAuth";
import { SITE_COOKIE, siteToken } from "@/lib/siteAuth";

/**
 * Two password gates.
 *  - The Atlas (/atlas and its data, photos and Strava feed) uses ATLAS_PASSWORD and
 *    its own cookie. The portfolio password does not open it, and it does not open
 *    the portfolio.
 *  - Everything else uses SITE_PASSWORD, the `site-auth` cookie and /login.
 * Both cookies hold a hash of their password, so neither can be forged.
 * Static assets, the login page itself, and the auth API routes are excluded via
 * the matcher config below.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isAtlasPath(pathname)) {
    if (pathname === "/atlas/login" || pathname === "/api/atlas-auth") return NextResponse.next();
    const expected = process.env.ATLAS_PASSWORD;
    const cookie = req.cookies.get(ATLAS_COOKIE)?.value;
    if (expected && cookie && cookie === (await atlasToken(expected))) return NextResponse.next();
    if (pathname.startsWith("/api/") || pathname.startsWith("/atlas-data/") || pathname.startsWith("/atlas-photos/")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/atlas/login";
    url.search = "";
    if (pathname !== "/atlas") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const sitePassword = process.env.SITE_PASSWORD;
  const siteCookie = req.cookies.get(SITE_COOKIE)?.value;
  if (sitePassword && siteCookie && siteCookie === (await siteToken(sitePassword))) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  const from = pathname + search;
  if (from && from !== "/") url.searchParams.set("next", from);
  else url.searchParams.delete("next");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Everything except: _next internals, favicon, static folders, login page,
    // the auth API routes, and the public shareable readout page
    // (/seekwell/weekly-readout) which is intentionally accessible without
    // the site password.
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/|login|api/auth|seekwell/weekly-readout).*)",
  ],
};
