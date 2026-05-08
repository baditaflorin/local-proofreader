import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

function git(args, fallback) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

const sourceCommit = git(
  [
    "log",
    "-1",
    "--format=%h",
    "--abbrev=12",
    "--",
    ".",
    ":(exclude)docs",
    ":(exclude)public/version.json",
  ],
  "uncommitted",
);
const tag = git(["describe", "--tags", "--abbrev=0"], "v0.1.0");
const dirty =
  git(
    [
      "status",
      "--porcelain",
      "--",
      ".",
      ":(exclude)docs",
      ":(exclude)public/version.json",
    ],
    "",
  ) !== "";
const builtAt = git(
  ["show", "-s", "--format=%cI", sourceCommit],
  new Date().toISOString(),
);

mkdirSync("public", { recursive: true });
writeFileSync(
  "public/version.json",
  `${JSON.stringify(
    {
      name: "local-proofreader",
      version: tag,
      commit: sourceCommit,
      dirty,
      builtAt,
    },
    null,
    2,
  )}\n`,
);
