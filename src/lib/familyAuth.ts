/**
 * The family tree has its own password (FAMILY_PASSWORD), separate from the
 * portfolio's and the Atlas's, so family can be given the tree and nothing else.
 *
 * Reviewing what family send in needs a second password, only for Matthew:
 * FAMILY_EDIT_PASSWORD, or ATLAS_EDIT_PASSWORD if that isn't set.
 *
 * Cookies hold a SHA-256 of the password, as with the other gates, so they
 * can't be forged and changing a password signs everyone out.
 */
export const FAMILY_COOKIE = "family-auth";
export const FAMILY_EDIT_COOKIE = "family-edit";
export const FAMILY_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days: family shouldn't keep re-entering it

export function isFamilyPath(pathname: string) {
  return (
    pathname === "/family" ||
    pathname.startsWith("/family/") ||
    pathname.startsWith("/family-photos/") ||
    pathname.startsWith("/api/family/") ||
    pathname === "/api/family-auth"
  );
}

async function sha(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const familyToken = (password: string) => sha(`family:v1:${password}`);
export const familyEditToken = (password: string) => sha(`family-edit:v1:${password}`);
export const familyEditPassword = () => process.env.FAMILY_EDIT_PASSWORD || process.env.ATLAS_EDIT_PASSWORD;

function cookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function isFamily(req: Request): Promise<boolean> {
  const expected = process.env.FAMILY_PASSWORD;
  const got = cookie(req, FAMILY_COOKIE);
  return Boolean(expected && got && got === (await familyToken(expected)));
}

export async function isFamilyOwner(req: Request): Promise<boolean> {
  const expected = familyEditPassword();
  const got = cookie(req, FAMILY_EDIT_COOKIE);
  return Boolean(expected && got && got === (await familyEditToken(expected)));
}

/** Compare two hex tokens in constant time. */
export function sameToken(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
