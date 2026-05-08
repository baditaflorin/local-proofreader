import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "extension/dist",
    emptyOutDir: true,
    lib: {
      entry: "extension/src/content.ts",
      formats: ["iife"],
      name: "LocalProofreaderContent",
    },
    rollupOptions: {
      output: {
        entryFileNames: "content.js",
      },
    },
  },
});
