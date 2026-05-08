import { readdirSync, rmSync } from "node:fs";

for (const path of [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/version.json",
  "docs/sw.js",
  "docs/sw.js.map",
  "docs/registerSW.js",
  "docs/manifest.webmanifest",
]) {
  rmSync(path, { force: true, recursive: true });
}

for (const file of readdirSync("docs", { withFileTypes: true })) {
  if (file.isFile() && file.name.startsWith("workbox-")) {
    rmSync(`docs/${file.name}`, { force: true });
  }
}
