/**
 * The Atlas has its own password, separate from the portfolio's.
 *
 * The cookie holds a SHA-256 of the password rather than a fixed value, so it
 * can't be forged without knowing the password, and changing ATLAS_PASSWORD
 * signs everyone out. Works in both the middleware (edge) and route handlers.
 */
export const ATLAS_COOKIE = "atlas-auth";
export const ATLAS_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/** Paths that belong to the Atlas and use the Atlas password instead of the site one. */
export function isAtlasPath(pathname: string) {
  return (
    pathname === "/atlas" ||
    pathname.startsWith("/atlas/") ||
    pathname.startsWith("/atlas-data/") ||
    pathname.startsWith("/atlas-photos/") ||
    pathname.startsWith("/api/strava/") ||
    pathname.startsWith("/api/atlas/") ||
    pathname === "/api/atlas-auth"
  );
}

export async function atlasToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`atlas:v1:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
