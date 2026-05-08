import { z } from "zod";
import type { VersionInfo } from "../../shared/types";
import { fromBasePath } from "../../shared/staticPath";

const versionSchema = z.object({
  name: z.string(),
  version: z.string(),
  commit: z.string(),
  dirty: z.boolean(),
  builtAt: z.string(),
});

export async function fetchVersionInfo(): Promise<VersionInfo> {
  const response = await fetch(fromBasePath("version.json"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Version metadata is unavailable.");
  }

  return versionSchema.parse(await response.json());
}
