import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertCodexDeployTarget } from "./lib/codex-deploy-target-guard.mjs";

const repoRoot = process.cwd();
const owner = "Sero91ak";
const repo = "dar-al-tawhid-site";
const branch = process.env.CODEX_BRANCH || "main";
const filePath = process.env.CODEX_FILE_PATH;
const message = process.env.CODEX_PUSH_MESSAGE || `Update ${filePath}`;

if (!filePath) {
  throw new Error("CODEX_FILE_PATH fehlt");
}

assertCodexDeployTarget([filePath]);

function gh(path, options = {}) {
  const args = ["api", path];
  if (options.method) {
    args.push("--method", options.method);
  }
  if (options.input) {
    args.push("--input", "-");
  }
  const output = execFileSync("gh", args, {
    cwd: repoRoot,
    input: options.input ? JSON.stringify(options.input) : undefined,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return output ? JSON.parse(output) : null;
}

function ghMaybe(path) {
  try {
    return gh(path);
  } catch (error) {
    const text = String(error?.stdout || error?.stderr || error?.message || "");
    if (text.includes('"status":"404"') || text.includes("HTTP 404")) return null;
    throw error;
  }
}

const apiPath = `/repos/${owner}/${repo}/contents/${filePath}`;
const current = ghMaybe(`${apiPath}?ref=${branch}`);
const content = readFileSync(resolve(repoRoot, filePath));

const result = gh(apiPath, {
  method: "PUT",
  input: {
    message,
    content: content.toString("base64"),
    branch,
    ...(current?.sha ? { sha: current.sha } : {}),
  },
});

process.stdout.write(`${result.commit.sha}\n`);
