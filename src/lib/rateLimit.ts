// Fixed-window rate limiter. Uses Upstash Redis (shared across serverless
// instances) when configured, else an in-memory Map (fine for a single
// instance / local dev). Env-gated like the rest of the integrations.

export type RateResult = {
  success: boolean;
  remaining: number;
  retryAfter: number; // seconds until the window resets
};

const isUpstash = () =>
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// ── in-memory (per-instance) ─────────────────────────────────────────────────
const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { success: true, remaining: limit - entry.count, retryAfter: 0 };
}

// ── Upstash Redis (shared) ───────────────────────────────────────────────────
async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const windowSec = Math.ceil(windowMs / 1000);

  // INCR the counter, and set the window expiry only when it's newly created.
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSec, "NX"],
    ]),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const data = (await res.json()) as { result: number }[];
  const count = Number(data?.[0]?.result ?? 0);

  if (count > limit) {
    return { success: false, remaining: 0, retryAfter: windowSec };
  }
  return { success: true, remaining: Math.max(0, limit - count), retryAfter: 0 };
}

/** Consume one token for `key`. Returns whether the request is allowed. */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateResult> {
  if (isUpstash()) {
    try {
      return await upstashLimit(key, limit, windowMs);
    } catch {
      // Redis unreachable → fail open to the in-memory limiter.
    }
  }
  return memoryLimit(key, limit, windowMs);
}
