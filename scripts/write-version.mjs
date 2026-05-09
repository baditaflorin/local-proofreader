import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

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
const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const version = `v${packageVersion}`;
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
      version,
      commit: sourceCommit,
      dirty,
      builtAt,
    },
    null,
    2,
  )}\n`,
);
