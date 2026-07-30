/**
 * Zakāt-Konfiguration — Server (GitHub commit)
 */
const DEFAULT_ZAKAT_CONFIG_PATH = "content/admin/zakat-config.json";

export async function readZakatConfig(env, githubGet, base64ToUtf8) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = String(env.ZAKAT_CONFIG_PATH || DEFAULT_ZAKAT_CONFIG_PATH).replace(/^\/+/, "");
  const file = await githubGet(env, owner, repo, path, branch);
  if (!file?.content) {
    return {
      config: { version: 1, prices: {}, sources: [], rules: [] },
      sha: "",
      path
    };
  }
  return { config: JSON.parse(base64ToUtf8(file.content)), sha: file.sha || "", path };
}

export async function saveZakatPrices(env, input, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const { config, sha, path } = await readZakatConfig(env, githubGet, base64ToUtf8);
  const registrySha = String(input.configSha || sha || "").trim();
  if (registrySha && sha && registrySha !== sha) {
    throw new Error("Konfiguration wurde zwischenzeitlich geändert — bitte neu laden");
  }

  const gold = Number(input.goldPerGramEur);
  const silver = Number(input.silverPerGramEur);
  if (!Number.isFinite(gold) || gold <= 0) throw new Error("Goldpreis fehlt oder ungültig");
  if (!Number.isFinite(silver) || silver <= 0) throw new Error("Silberpreis fehlt oder ungültig");

  const now = new Date().toISOString();
  const prev = config.prices || {};
  const nextPrices = {
    ...prev,
    goldPerGramEur: gold,
    silverPerGramEur: silver,
    currency: String(input.currency || prev.currency || "EUR"),
    source: String(input.source || "Admin geprüft"),
    verifiedAt: now,
    verifiedBy: String(input.verifiedBy || "admin"),
    active: true,
    apiFallback: false
  };

  const history = Array.isArray(config.priceHistory) ? [...config.priceHistory] : [];
  if (prev.goldPerGramEur || prev.silverPerGramEur) {
    history.unshift({
      goldPerGramEur: prev.goldPerGramEur,
      silverPerGramEur: prev.silverPerGramEur,
      verifiedAt: prev.verifiedAt || "",
      source: prev.source || ""
    });
  }

  const nextConfig = {
    ...config,
    updatedAt: now,
    prices: nextPrices,
    priceHistory: history.slice(0, 30)
  };

  const content = `${JSON.stringify(nextConfig, null, 2)}\n`;
  let commitSha = "";
  if (githubCommitBatch) {
    const batch = await githubCommitBatch(env, owner, repo, branch, [{ path, content }], `Zakāt-Preise geprüft (${gold}/${silver} EUR/g)`);
    commitSha = batch.commitSha || "";
  } else {
    const saved = await githubPut(env, owner, repo, path, content, "Zakāt-Preise", branch, sha);
    commitSha = saved.commit?.sha || "";
  }

  return { ok: true, config: nextConfig, sha: commitSha, commitSha };
}
