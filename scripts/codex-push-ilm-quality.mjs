import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { assertCodexDeployTarget } from "./lib/codex-deploy-target-guard.mjs";

const repoRoot = process.cwd();
const owner = "Sero91ak";
const repo = "dar-al-tawhid-site";
const branch = "main";
const message = process.env.CODEX_PUSH_MESSAGE || "Sharpen Ilm answer quality and add knowledge index";

const files = [
  "index.html",
  "test/index.html",
  "version.json",
  "test/version.json",
  "assets/premium-feed-app.js",
  "service-worker.js",
  "data/ilm-knowledge-index.json",
  "scripts/build-ilm-knowledge-index.js",
];

assertCodexDeployTarget(files);

function gh(path, options = {}) {
  const args = ["api", path];
  if (options.method) args.push("--method", options.method);
  if (options.input) args.push("--input", "-");
  const output = execFileSync("gh", args, {
    cwd: repoRoot,
    input: options.input ? JSON.stringify(options.input) : undefined,
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024,
  });
  return output ? JSON.parse(output) : null;
}

const ref = gh(`repos/${owner}/${repo}/git/ref/heads/${branch}`);
const headSha = ref.object.sha;
const headCommit = gh(`repos/${owner}/${repo}/git/commits/${headSha}`);
const baseTree = headCommit.tree.sha;

const tree = files.map((filePath) => ({
  path: filePath,
  mode: "100644",
  type: "blob",
  content: readFileSync(resolve(repoRoot, filePath), "utf8"),
}));

const createdTree = gh(`repos/${owner}/${repo}/git/trees`, {
  method: "POST",
  input: {
    base_tree: baseTree,
    tree,
  },
});

const commit = gh(`repos/${owner}/${repo}/git/commits`, {
  method: "POST",
  input: {
    message,
    tree: createdTree.sha,
    parents: [headSha],
  },
});

gh(`repos/${owner}/${repo}/git/refs/heads/${branch}`, {
  method: "PATCH",
  input: {
    sha: commit.sha,
    force: false,
  },
});

process.stdout.write(`${commit.sha}\n`);
