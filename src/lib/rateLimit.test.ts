import { describe, it, expect } from "vitest";
import { rateLimit } from "./rateLimit";

describe("rateLimit (in-memory)", () => {
  it("allows up to the limit, then blocks with a retry-after", async () => {
    const key = `rl-${Date.now()}-a`;
    const a = await rateLimit(key, 2, 60_000);
    const b = await rateLimit(key, 2, 60_000);
    const c = await rateLimit(key, 2, 60_000);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(c.success).toBe(false);
    expect(c.remaining).toBe(0);
    expect(c.retryAfter).toBeGreaterThan(0);
  });

  it("tracks each key independently", async () => {
    const k1 = `rl-${Date.now()}-b`;
    const k2 = `rl-${Date.now()}-c`;
    await rateLimit(k1, 1, 60_000); // exhaust k1
    const blocked = await rateLimit(k1, 1, 60_000);
    const fresh = await rateLimit(k2, 1, 60_000);
    expect(blocked.success).toBe(false);
    expect(fresh.success).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const key = `rl-${Date.now()}-d`;
    await rateLimit(key, 1, 1); // 1ms window
    await new Promise((r) => setTimeout(r, 5));
    const afterWindow = await rateLimit(key, 1, 1);
    expect(afterWindow.success).toBe(true);
  });
});
