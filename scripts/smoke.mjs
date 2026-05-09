import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4177/local-proofreader/";
const root = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(
  root,
  "..",
  "test",
  "fixtures",
  "realdata",
  "rd02-hn-missing-space.txt",
);
const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Local Proofreader" }).waitFor();
await page
  .getByText("Repository: https://github.com/baditaflorin/local-proofreader")
  .waitFor();
await page.getByText(/Version v\d+\.\d+\.\d+ .* commit/).waitFor();

const editor = page.getByLabel("Draft text");
await page.getByRole("button", { name: "Start fresh" }).click();
await page.getByRole("button", { name: "Import files" }).click();
await page.setInputFiles('input[type="file"]', fixturePath);
await page.getByText(/Imported .*rd02-hn-missing-space\.txt/).waitFor();
await page.waitForFunction(
  () => {
    const editorNode = document.querySelector(
      'textarea[aria-label="Draft text"]',
    );
    return (
      editorNode instanceof HTMLTextAreaElement && editorNode.value.length > 40
    );
  },
  { timeout: 5000 },
);
await page.locator(".suggestionCard").first().waitFor();

if (consoleErrors.length > 0) {
  throw new Error(`Console errors found: ${consoleErrors.join("\n")}`);
}

await browser.close();
