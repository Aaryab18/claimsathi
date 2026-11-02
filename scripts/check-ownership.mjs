#!/usr/bin/env node
// Checks that a pull request's branch only changed files it owns.
//
// Usage:
//   node scripts/check-ownership.mjs <branch> <file> [file...]
//   git diff --name-only -z <range> | node scripts/check-ownership.mjs <branch>
import { readFileSync } from "node:fs";
import { posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// A path ending in "/" means a whole folder, which includes any package.json inside it.
const MEMBER_PATHS = {
  "member-a": ["api/", "worker/", "jobs/", "pdf-service/", "render.yaml"],
  "member-b": ["web/"],
  "member-c": ["rules/", "samples/", "templates/", "docs/"],
};
const ALLOWED_FOR_ALL_MEMBERS = ["package-lock.json"];
const ALLOWED_BRANCH_NAMES = [
  ...Object.keys(MEMBER_PATHS).map((member) => `${member}/*`),
  "shared/*",
].join(", ");

function normalizePath(file) {
  return posix.normalize(file.replaceAll("\\", "/"));
}

function matches(file, allowedPath) {
  return allowedPath.endsWith("/") ? file.startsWith(allowedPath) : file === allowedPath;
}

export function checkOwnership(branch, files) {
  const prefix = /^([^/]+)\/.+$/.exec(branch)?.[1];

  if (prefix === "shared") {
    return { ok: true, message: `Ownership check passed: ${branch} may change any file.` };
  }

  const ownedPaths = Object.hasOwn(MEMBER_PATHS, prefix ?? "") ? MEMBER_PATHS[prefix] : undefined;
  if (!ownedPaths) {
    return {
      ok: false,
      message: `Ownership check failed: unknown branch name "${branch}".\nAllowed names: ${ALLOWED_BRANCH_NAMES}`,
    };
  }

  const allowedPaths = [...ownedPaths, ...ALLOWED_FOR_ALL_MEMBERS];
  const blocked = files.filter(
    (file) => !allowedPaths.some((allowedPath) => matches(normalizePath(file), allowedPath)),
  );

  if (blocked.length > 0) {
    return {
      ok: false,
      message: [
        `Ownership check failed: ${branch} changed files outside its folders:`,
        ...blocked.map((file) => `  - ${file}`),
        `${prefix}/* may only change: ${allowedPaths.join(", ")}`,
        "Ask the member who owns those files to change them, or use a shared/* branch if the whole team agreed in chat.",
      ].join("\n"),
    };
  }

  return { ok: true, message: `Ownership check passed: ${branch} changed ${files.length} file(s), all allowed.` };
}

function readFilesFromStdin() {
  return readFileSync(0, "utf8")
    .split(/[\0\r\n]+/)
    .filter(Boolean);
}

function main() {
  const [branch, ...fileArgs] = process.argv.slice(2);

  if (!branch || (fileArgs.length === 0 && process.stdin.isTTY)) {
    console.error("Usage: node scripts/check-ownership.mjs <branch> <file> [file...]");
    console.error("The file list can also be piped in, one per line or separated by NUL.");
    process.exit(2);
  }

  const files = fileArgs.length > 0 ? fileArgs : readFilesFromStdin();
  const result = checkOwnership(branch, files);

  if (result.ok) {
    console.log(result.message);
  } else {
    console.error(result.message);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
