const STAGING_PREFIXES = [
  "test/",
  "content/staging/",
  "data/test/",
];

const STAGING_EXACT = new Set([
  "test/index.html",
  "test/version.json",
  "test/manifest.json",
  "manifest-staging.json",
]);

function normalizePath(filePath) {
  return String(filePath || "").replace(/\\/g, "/").replace(/^\.?\//, "");
}

function isStagingOnlyPath(filePath) {
  const normalized = normalizePath(filePath);
  if (STAGING_EXACT.has(normalized)) return true;
  return STAGING_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function assertCodexDeployTarget(files, options = {}) {
  const deployTarget = String(
    options.deployTarget || process.env.CODEX_DEPLOY_TARGET || "test"
  ).trim().toLowerCase();
  const liveApproved = String(
    options.liveApproved || process.env.CODEX_LIVE_APPROVED || ""
  ).trim() === "1";

  const normalizedFiles = (Array.isArray(files) ? files : [files])
    .map(normalizePath)
    .filter(Boolean);

  const nonStagingFiles = normalizedFiles.filter((filePath) => !isStagingOnlyPath(filePath));

  if (deployTarget !== "visitor" && deployTarget !== "live" && deployTarget !== "test") {
    throw new Error(
      `Unbekanntes CODEX_DEPLOY_TARGET: ${deployTarget}. Erlaubt sind test oder visitor.`
    );
  }

  if (deployTarget === "test") {
    if (nonStagingFiles.length) {
      throw new Error(
        [
          "Codex-Deploy blockiert: Standardziel ist Dar Test.",
          "Diese Dateien betreffen Besucher-App oder gemeinsame Live-Dateien:",
          ...nonStagingFiles.map((filePath) => `- ${filePath}`),
          "Setze nur bei ausdruecklicher Live-Freigabe: CODEX_DEPLOY_TARGET=visitor und CODEX_LIVE_APPROVED=1",
        ].join("\n")
      );
    }
    return { deployTarget, liveApproved: false, files: normalizedFiles };
  }

  if (!liveApproved) {
    throw new Error(
      "Live-Deploy blockiert: Fuer Besucher-App ist CODEX_LIVE_APPROVED=1 zusaetzlich erforderlich."
    );
  }

  return { deployTarget, liveApproved, files: normalizedFiles };
}

export {
  assertCodexDeployTarget,
  isStagingOnlyPath,
  normalizePath,
  STAGING_EXACT,
  STAGING_PREFIXES,
};
