import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Mirror the `@/*` path alias from tsconfig so tests can import modules the
// same way the app does.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
