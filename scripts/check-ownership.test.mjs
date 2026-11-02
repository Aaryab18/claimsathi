import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkOwnership } from "./check-ownership.mjs";

const SCRIPT = fileURLToPath(new URL("./check-ownership.mjs", import.meta.url));

function runCli(args, input = "") {
  return spawnSync(process.execPath, [SCRIPT, ...args], { input, encoding: "utf8" });
}

describe("allowed files", () => {
  it.each([
    ["member-a/platform", "api/src/app.ts"],
    ["member-a/platform", "worker/src/index.ts"],
    ["member-a/platform", "jobs/src/index.ts"],
    ["member-a/platform", "pdf-service/README.md"],
    ["member-a/platform", "render.yaml"],
    ["member-b/frontend", "web/src/App.tsx"],
    ["member-c/rules", "rules/src/index.ts"],
    ["member-c/rules", "samples/a.pdf"],
    ["member-c/rules", "templates/a.html"],
    ["member-c/rules", "docs/a.md"],
  ])("%s may change %s", (branch, file) => {
    expect(checkOwnership(branch, [file]).ok).toBe(true);
  });

  it.each([
    ["member-a/platform", "api/package.json"],
    ["member-b/frontend", "web/package.json"],
    ["member-c/rules", "rules/package.json"],
  ])("%s may change the package.json in its own folder: %s", (branch, file) => {
    expect(checkOwnership(branch, [file]).ok).toBe(true);
  });

  it.each(["member-a/platform", "member-b/frontend", "member-c/rules"])(
    "%s may change the root package-lock.json",
    (branch) => {
      expect(checkOwnership(branch, ["package-lock.json"]).ok).toBe(true);
    },
  );

  it("lets shared/* branches change anything", () => {
    const files = ["package.json", "contracts/src/index.ts", "web/src/App.tsx", ".github/workflows/ci.yml"];
    expect(checkOwnership("shared/upgrade", files).ok).toBe(true);
  });

  it("passes a member branch with no changed files", () => {
    expect(checkOwnership("member-b/frontend", []).ok).toBe(true);
  });
});

describe("blocked files", () => {
  it.each([
    ["member-a/platform", "web/src/App.tsx"],
    ["member-a/platform", "rules/src/index.ts"],
    ["member-b/frontend", "api/src/app.ts"],
    ["member-b/frontend", "render.yaml"],
    ["member-c/rules", "worker/src/index.ts"],
    ["member-c/rules", "render.yaml"],
  ])("%s may not change %s", (branch, file) => {
    expect(checkOwnership(branch, [file]).ok).toBe(false);
  });

  it.each(["contracts/src/index.ts", "package.json", "CLAUDE.md", ".github/workflows/ci.yml", "scripts/check-ownership.mjs"])(
    "member branches may not change shared file %s",
    (file) => {
      expect(checkOwnership("member-a/platform", [file]).ok).toBe(false);
    },
  );

  it("blocks a package.json or package-lock.json in another member's folder", () => {
    expect(checkOwnership("member-b/frontend", ["api/package.json"]).ok).toBe(false);
    expect(checkOwnership("member-b/frontend", ["api/package-lock.json"]).ok).toBe(false);
  });

  it("does not confuse a similar folder name with an owned folder", () => {
    expect(checkOwnership("member-b/frontend", ["web-admin/index.ts"]).ok).toBe(false);
    expect(checkOwnership("member-a/platform", ["render.yaml.bak"]).ok).toBe(false);
  });

  it("does not let a path climb out of an owned folder", () => {
    expect(checkOwnership("member-b/frontend", ["web/../api/src/app.ts"]).ok).toBe(false);
    expect(checkOwnership("member-b/frontend", ["../web/App.tsx"]).ok).toBe(false);
  });

  it("names only the blocked files in its message", () => {
    const result = checkOwnership("member-b/frontend", ["web/src/App.tsx", "api/src/app.ts"]);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("api/src/app.ts");
    expect(result.message).not.toContain("web/src/App.tsx");
    expect(result.message).toContain("member-b/* may only change: web/, package-lock.json");
  });
});

describe("unknown branch names", () => {
  it.each(["main", "feature/login", "member-d/x", "member-a", "member-a/", "shared", "shared/", "constructor/x", ""])(
    "rejects %j and lists the allowed names",
    (branch) => {
      const result = checkOwnership(branch, ["web/src/App.tsx"]);
      expect(result.ok).toBe(false);
      expect(result.message).toContain("Allowed names: member-a/*, member-b/*, member-c/*, shared/*");
    },
  );
});

describe("command line", () => {
  it("exits 0 for allowed files given as arguments", () => {
    const result = runCli(["member-b/frontend", "web/src/App.tsx"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("passed");
  });

  it("exits 1 for a blocked file", () => {
    const result = runCli(["member-b/frontend", "api/src/app.ts"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("api/src/app.ts");
  });

  it("exits 1 for an unknown branch", () => {
    const result = runCli(["feature/login", "web/src/App.tsx"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Allowed names");
  });

  it("reads NUL-separated files from stdin, as CI passes them", () => {
    expect(runCli(["member-b/frontend"], "web/a.ts\0web/b c.ts\0").status).toBe(0);
    const blocked = runCli(["member-b/frontend"], "web/a.ts\0api/b c.ts\0");
    expect(blocked.status).toBe(1);
    expect(blocked.stderr).toContain("api/b c.ts");
  });
});
