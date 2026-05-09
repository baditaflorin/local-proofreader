import { describe, expect, it } from "vitest";
import { importFiles } from "./importers";
import { serializeSavedSession, defaultAppSettings } from "./state";
import { createSavedSession } from "./state";

describe("session importers", () => {
  it("imports multiple text files into one draft", async () => {
    const payload = await importFiles([
      new File(["hello"], "a.txt", { type: "text/plain" }),
      new File(["world"], "b.md", { type: "text/markdown" }),
    ]);

    expect(payload.text).toContain("# a.txt");
    expect(payload.text).toContain("# b.md");
    expect(payload.source).toBe("import:batch");
  });

  it("imports a saved session json file", async () => {
    const session = createSavedSession({
      text: "saved",
      activeCategory: "style",
      customWords: ["local"],
      settings: defaultAppSettings,
      source: "export",
      createdAt: "2026-05-09T12:00:00.000Z",
    });
    const payload = await importFiles([
      new File([serializeSavedSession(session)], "session.json", {
        type: "application/json",
      }),
    ]);

    expect(payload.session).toEqual(session);
    expect(payload.text).toBe("saved");
  });
});
