/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Caveats for production:
 *   - In-memory state does NOT persist across serverless cold starts, and
 *     is NOT shared between regional instances. For real enforcement,
 *     swap this to Vercel KV or Upstash Redis. The interface is the same
 *     (takeToken returns { ok, remaining, resetAt }) so the call site
 *     doesn't need to change.
 *
 * This is adequate for local development, small single-region traffic,
 * and as a soft ceiling while KV is provisioned.
 */

type Entry = { timestamps: number[] };

const stores = new Map<string, Entry>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch ms
};

export function takeToken(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - windowMs;
  const entry = stores.get(key) ?? { timestamps: [] };
  // Drop expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    stores.set(key, entry);
    return {
      ok: false,
      remaining: 0,
      resetAt: oldest + windowMs,
    };
  }

  entry.timestamps.push(now);
  stores.set(key, entry);
  return {
    ok: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

/**
 * Best-effort IP extraction for rate-limit keys. Vercel sets
 * x-forwarded-for; fall back to x-real-ip; finally to a static string so
 * we always have a bucket.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonymous";
}
