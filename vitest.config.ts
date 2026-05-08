import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      reporter: ["text", "html"],
      include: ["src/features/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
      exclude: ["src/features/**/worker/**"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
