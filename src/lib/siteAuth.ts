/**
 * Portfolio password gate.
 *
 * The `site-auth` cookie holds a SHA-256 of SITE_PASSWORD rather than a fixed value,
 * so it can't be forged without knowing the password, and changing SITE_PASSWORD
 * signs everyone out. Works in both the middleware (edge) and route handlers.
 */
export const SITE_COOKIE = "site-auth";

export async function siteToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`site:v1:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
