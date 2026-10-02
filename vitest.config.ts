import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": fileURLToPath(
        new URL("./tests/helpers/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    maxWorkers: 1,
    testTimeout: 60000,
    hookTimeout: 30000,
    include: ["tests/**/*.test.ts"],
  },
});
