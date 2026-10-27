import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contract } from "./contract";

/**
 * Regression guard for a bug that shipped silently: the contract declared
 * `PATCH /api/debts/:id`, `DELETE /api/debts/:id` and `PATCH /api/notifications`,
 * but the catch-all route only exported GET and POST. Next answers 405 for any
 * method it has no export for — before ts-rest ever runs — so editing a debt,
 * deleting a debt, and saving notification preferences were all dead in
 * production. Nothing caught it: types passed, lint passed, tests passed.
 */

type Route = { method?: string; path?: string };

function methodsIn(node: unknown, out = new Set<string>()): Set<string> {
  if (!node || typeof node !== "object") return out;
  const maybe = node as Route;
  if (typeof maybe.method === "string" && typeof maybe.path === "string") {
    out.add(maybe.method.toUpperCase());
    return out;
  }
  for (const child of Object.values(node)) methodsIn(child, out);
  return out;
}

describe("API contract ↔ route handler exports", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/api/[...ts-rest]/route.ts"),
    "utf8",
  );

  it("exports a Next handler for every HTTP method the contract declares", () => {
    const declared = methodsIn(contract);
    expect(declared.size).toBeGreaterThan(0);

    const missing = [...declared].filter(
      (m) => !new RegExp(`handler as ${m}\\b`).test(source),
    );

    expect(
      missing,
      `Contract declares ${[...declared].sort().join(", ")} but ` +
        `src/app/api/[...ts-rest]/route.ts does not export: ${missing.join(", ")}. ` +
        "Next returns 405 for un-exported methods.",
    ).toEqual([]);
  });

  it("covers the methods the debt and notification editing flows depend on", () => {
    const declared = methodsIn(contract);
    expect(declared.has("PATCH")).toBe(true);
    expect(declared.has("DELETE")).toBe(true);
  });
});
