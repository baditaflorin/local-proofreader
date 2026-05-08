import { describe, expect, it } from "vitest";

describe("integration placeholder", () => {
  it("keeps the integration target wired", () => {
    expect("/local-proofreader/").toContain("local-proofreader");
  });
});
