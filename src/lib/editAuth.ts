/**
 * Edit access for the Atlas: a third password (ATLAS_EDIT_PASSWORD), only for Matthew.
 * Viewing needs the Atlas password; changing anything also needs this one.
 */
export const EDIT_COOKIE = "atlas-edit";
export const EDIT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function editToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`atlas-edit:v1:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** True when the request carries a valid edit cookie. */
export async function canEdit(req: Request): Promise<boolean> {
  const expected = process.env.ATLAS_EDIT_PASSWORD;
  if (!expected) return false;
  const cookie = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${EDIT_COOKIE}=`))
    ?.slice(EDIT_COOKIE.length + 1);
  return Boolean(cookie) && cookie === (await editToken(expected));
}
