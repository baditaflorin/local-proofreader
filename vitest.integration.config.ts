import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "test/integration/**/*.test.ts",
      "test/integration/**/*.test.tsx",
    ],
    globals: true,
  },
});
