import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4177/local-proofreader/";
const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Local Proofreader" }).waitFor();
await page
  .getByText("Repository: https://github.com/baditaflorin/local-proofreader")
  .waitFor();
await page.getByText(/Version v0\.1\.0 .* commit/).waitFor();

const editor = page.getByLabel("Draft text");
await editor.fill(
  "this are alot of writting that could of been made better better",
);
await page.getByRole("button", { name: "Analyze" }).click();
await page.getByText('Use "a lot"').waitFor();
await page.getByText("Subject and verb agreement").waitFor();

if (consoleErrors.length > 0) {
  throw new Error(`Console errors found: ${consoleErrors.join("\n")}`);
}

await browser.close();
