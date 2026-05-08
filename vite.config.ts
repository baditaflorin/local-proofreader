import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/local-proofreader/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Local Proofreader",
        short_name: "Proofreader",
        description:
          "Local-first grammar, spelling, style, and rewrite assistant for the browser.",
        start_url: "/local-proofreader/",
        scope: "/local-proofreader/",
        display: "standalone",
        background_color: "#f3f1ea",
        theme_color: "#28614f",
        icons: [
          {
            src: "/local-proofreader/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        sourcemap: false,
        globPatterns: ["**/*.{js,css,html,svg,json,aff,dic}"],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
      },
    }),
  ],
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
