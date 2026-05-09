import { parseSavedSession } from "./state";
import type { SavedSession } from "../../shared/types";

export interface ImportedPayload {
  notice: string;
  source: string;
  text: string;
  session: SavedSession | null;
}

const textExtensions = new Set(["txt", "md", "markdown", "html", "htm"]);

export async function importFiles(files: File[]): Promise<ImportedPayload> {
  if (files.length === 0) {
    throw new Error(
      "No file was selected. Choose a text, HTML, Markdown, or saved session file.",
    );
  }

  if (files.some((file) => extensionOf(file.name) === "json")) {
    if (files.length !== 1) {
      throw new Error(
        "Import either one saved session JSON file or one or more text-like files, not both together.",
      );
    }

    const content = await files[0].text();
    const session = parseSavedSession(JSON.parse(content));

    return {
      notice: `Imported saved session from ${files[0].name}.`,
      source: `import:${files[0].name}`,
      text: session.text,
      session,
    };
  }

  const unsupported = files.filter(
    (file) => !textExtensions.has(extensionOf(file.name)),
  );

  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported file type for ${unsupported[0].name}. Use .txt, .md, .html, or a saved session .json file.`,
    );
  }

  const parts = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      text: normalizeImportedText(file.name, await file.text()),
    })),
  );
  const combined = parts
    .map((part) =>
      files.length === 1 ? part.text : `# ${part.name}\n\n${part.text}`.trim(),
    )
    .join("\n\n");

  return {
    notice:
      files.length === 1
        ? `Imported ${files[0].name}.`
        : `Imported ${files.length} files into one working draft.`,
    source: files.length === 1 ? `import:${files[0].name}` : "import:batch",
    text: combined.trim(),
    session: null,
  };
}

export async function importClipboardText(): Promise<ImportedPayload> {
  if (!navigator.clipboard?.readText) {
    throw new Error(
      "Clipboard read is unavailable in this browser. Paste into the editor or use a file import instead.",
    );
  }

  const text = await navigator.clipboard.readText();

  if (!text.trim()) {
    throw new Error(
      "Clipboard is empty. Copy some text first, then try again.",
    );
  }

  return {
    notice: "Imported text from the clipboard.",
    source: "clipboard",
    text: normalizeImportedPlainText(text),
    session: null,
  };
}

function normalizeImportedText(fileName: string, text: string): string {
  const extension = extensionOf(fileName);

  if (extension === "html" || extension === "htm") {
    const parsed = new DOMParser().parseFromString(text, "text/html");
    return normalizeImportedPlainText(parsed.body.textContent ?? "");
  }

  return normalizeImportedPlainText(text);
}

function normalizeImportedPlainText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extensionOf(fileName: string): string {
  return fileName.toLowerCase().split(".").pop() ?? "";
}
