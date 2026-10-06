import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    pool: "threads",
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
