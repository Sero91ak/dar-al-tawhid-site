/**
 * Zakāt Preisquellen-Engine — serverseitig (Cloudflare Worker)
 * API-Keys nur in Worker-Secrets, niemals im Frontend.
 */
import { readZakatConfig, saveZakatPrices } from "./zakat-admin.js";

export const TROY_OZ_TO_GRAM = 31.1034768;
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;
export const DEFAULT_CACHE_PATH = "content/admin/zakat-prices-cache.json";
/** Echtzeit: mindestens alle 15 Minuten neu abrufen (Cron alle 5 Min). */
export const FETCH_MIN_INTERVAL_MS = 15 * 60 * 1000;
export const REALTIME_STALE_MS = 15 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function ounceToGram(ounceEur) {
  return roundMoney(Number(ounceEur) / TROY_OZ_TO_GRAM);
}

function buildMetalEntry(metal, ounceEur, meta = {}) {
  const pricePerGram = ounceToGram(ounceEur);
  const nisabGrams = metal === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  return {
    metal,
    currency: "EUR",
    pricePerOunce: roundMoney(ounceEur),
    pricePerGram,
    nisabGrams,
    nisabEur: roundMoney(pricePerGram * nisabGrams),
    source: meta.source || "",
    provider: meta.provider || "",
    fetchedAt: meta.fetchedAt || nowIso(),
    validUntil: meta.validUntil || "",
    status: meta.status || "ok",
    isManual: Boolean(meta.isManual),
    adminNote: meta.adminNote || ""
  };
}

export function priceFreshnessStatus(fetchedAt) {
  const ts = Date.parse(String(fetchedAt || ""));
  if (!Number.isFinite(ts)) {
    return {
      level: "missing",
      badge: "error",
      label: "❌ Keine geprüfte Preisquelle",
      canFinalize: false,
      ageHours: null
    };
  }
  const ageHours = (Date.now() - ts) / 3600000;
  const ageMinutes = ageHours * 60;
  if (ageMinutes <= 15) {
    return {
      level: "realtime",
      badge: "ok",
      label: "✅ Echtzeit geprüft",
      canFinalize: true,
      ageHours
    };
  }
  if (ageHours <= 6) {
    return {
      level: "current",
      badge: "ok",
      label: "✅ Preisquelle aktuell geprüft",
      canFinalize: true,
      ageHours
    };
  }
  if (ageHours <= 24) {
    return {
      level: "today",
      badge: "ok",
      label: "Heute geprüft",
      canFinalize: true,
      ageHours
    };
  }
  if (ageHours <= 48) {
    return {
      level: "stale",
      badge: "warn",
      label: "⚠️ Preis älter als 24 Stunden – Ergebnis mit Hinweis",
      canFinalize: false,
      ageHours
    };
  }
  return {
    level: "expired",
    badge: "error",
    label: "❌ Kein aktueller geprüfter Preis – nur Vorschau",
    canFinalize: false,
    ageHours
  };
}

function emptyCache() {
  return {
    version: 1,
    updatedAt: "",
    provider: "",
    active: false,
    gold: null,
    silver: null,
    standardNisabEur: 0,
    lastSuccessAt: "",
    lastError: "",
    lastFetchAt: "",
    fetchLogs: []
  };
}

export async function readPriceCache(env, githubGet, base64ToUtf8) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = String(env.ZAKAT_PRICES_CACHE_PATH || DEFAULT_CACHE_PATH).replace(/^\/+/, "");
  try {
    const file = await githubGet(env, owner, repo, path, branch);
    if (!file?.content) return { cache: emptyCache(), sha: "", path };
    return { cache: JSON.parse(base64ToUtf8(file.content)), sha: file.sha || "", path };
  } catch (err) {
    return { cache: emptyCache(), sha: "", path, error: err.message || String(err) };
  }
}

async function writePriceCache(env, cache, sha, deps) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = String(env.ZAKAT_PRICES_CACHE_PATH || DEFAULT_CACHE_PATH).replace(/^\/+/, "");
  const content = `${JSON.stringify(cache, null, 2)}\n`;
  if (deps.githubCommitBatch) {
    const batch = await deps.githubCommitBatch(env, owner, repo, branch, [{ path, content }], "Zakāt-Preiscache aktualisiert");
    return batch.commitSha || "";
  }
  const saved = await deps.githubPut(env, owner, repo, path, content, "Zakāt-Preiscache", branch, sha || undefined);
  return saved.commit?.sha || "";
}

function appendFetchLog(cache, entry) {
  const logs = Array.isArray(cache.fetchLogs) ? [...cache.fetchLogs] : [];
  logs.unshift(entry);
  cache.fetchLogs = logs.slice(0, 50);
}

function resolveProvider(env) {
  if (String(env.GOLDAPI_KEY || "").trim()) {
    return { id: "goldapi.io", name: "GoldAPI.io", type: "goldapi", tier: "premium", requiresKey: true };
  }
  if (String(env.METALS_API_KEY || "").trim()) {
    return { id: "metals-api.com", name: "Metals-API", type: "metals-api", tier: "premium", requiresKey: true };
  }
  return {
    id: "aurumrates.com",
    name: "AURUM Echtzeit (COMEX) + Frankfurter EUR",
    type: "realtime-free",
    tier: "realtime",
    requiresKey: false
  };
}

async function fetchAurumSpotPrices() {
  const res = await fetch("https://aurumrates.com/api/v1/spot?metals=gold,silver", {
    headers: { Accept: "application/json", "User-Agent": "DAR-AL-TAWHID-Zakat-Engine/1.0" }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== "ok") {
    throw new Error(data.error || `AURUM Echtzeit HTTP ${res.status}`);
  }
  const goldUsd = Number(data?.data?.gold?.price);
  const silverUsd = Number(data?.data?.silver?.price);
  if (!Number.isFinite(goldUsd) || goldUsd <= 0 || !Number.isFinite(silverUsd) || silverUsd <= 0) {
    throw new Error("AURUM: Gold/Silber Spot fehlen");
  }
  const usdEur = await fetchUsdEurRate();
  const marketTs = Number(data.ts || data?.data?.gold?.timestamp || 0);
  return {
    provider: {
      id: "aurumrates.com",
      name: "AURUM Echtzeit (COMEX) + Frankfurter EUR",
      type: "realtime-free",
      tier: "realtime",
      requiresKey: false
    },
    goldOunceEur: roundMoney(goldUsd * usdEur),
    silverOunceEur: roundMoney(silverUsd * usdEur),
    sourceLabel: "COMEX Spot (Echtzeit) · AURUM · EUR via Frankfurter/ECB",
    marketUpdatedAt: marketTs > 0 ? new Date(marketTs * 1000).toISOString() : nowIso()
  };
}

async function fetchUsdEurRate() {
  const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", {
    headers: { Accept: "application/json" }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Number.isFinite(Number(data?.rates?.EUR))) {
    throw new Error("EUR-Umrechnung fehlgeschlagen (Frankfurter/ECB)");
  }
  return Number(data.rates.EUR);
}

async function fetchMintedMetalLbmaPrices() {
  const res = await fetch("https://mintedmetal.com/api/prices.json", {
    headers: { Accept: "application/json", "User-Agent": "DAR-AL-TAWHID-Zakat-Engine/1.0" }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Minted Metal HTTP ${res.status}`);
  const goldUsd = Number(data?.metals?.gold?.price);
  const silverUsd = Number(data?.metals?.silver?.price);
  if (!Number.isFinite(goldUsd) || goldUsd <= 0 || !Number.isFinite(silverUsd) || silverUsd <= 0) {
    throw new Error("Minted Metal: Gold/Silber fehlen");
  }
  const usdEur = await fetchUsdEurRate();
  const goldLabel = data?.metals?.gold?.sourceLabel || "LBMA Gold Fix";
  const silverLabel = data?.metals?.silver?.sourceLabel || "LBMA Silver Fix";
  return {
    provider: {
      id: "mintedmetal.com",
      name: "Minted Metal (LBMA) + Frankfurter EUR",
      type: "lbma-free",
      tier: "fallback",
      requiresKey: false
    },
    goldOunceEur: roundMoney(goldUsd * usdEur),
    silverOunceEur: roundMoney(silverUsd * usdEur),
    sourceLabel: `${goldLabel} / ${silverLabel} · Minted Metal (LBMA, 2× täglich) · EUR via Frankfurter/ECB`,
    marketUpdatedAt: data.updatedAt || data?.metals?.gold?.fixedAt || ""
  };
}

async function fetchGoldApiMetal(key, symbol) {
  const res = await fetch(`https://www.goldapi.io/api/${symbol}/EUR`, {
    headers: { "x-access-token": key, Accept: "application/json" }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `GoldAPI ${symbol} HTTP ${res.status}`);
  }
  const ounce = Number(data.price);
  if (!Number.isFinite(ounce) || ounce <= 0) throw new Error(`GoldAPI ${symbol}: ungültiger Preis`);
  return ounce;
}

async function fetchMetalsApiPrices(key) {
  const url = `https://metals-api.com/api/latest?access_key=${encodeURIComponent(key)}&base=EUR&symbols=XAU,XAG`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error?.info || data.error || `Metals-API HTTP ${res.status}`);
  }
  const rates = data.rates || {};
  const xau = Number(rates.XAU);
  const xag = Number(rates.XAG);
  if (!Number.isFinite(xau) || xau <= 0 || !Number.isFinite(xag) || xag <= 0) {
    throw new Error("Metals-API: XAU/XAG fehlen");
  }
  return { goldOunceEur: 1 / xau, silverOunceEur: 1 / xag };
}

async function fetchLiveMetalPrices(env) {
  const provider = resolveProvider(env);

  if (provider.type === "goldapi") {
    const key = String(env.GOLDAPI_KEY).trim();
    const [goldOunceEur, silverOunceEur] = await Promise.all([
      fetchGoldApiMetal(key, "XAU"),
      fetchGoldApiMetal(key, "XAG")
    ]);
    return {
      provider,
      goldOunceEur,
      silverOunceEur,
      sourceLabel: `${provider.name} · Echtzeit EUR/Feinunze`,
      marketUpdatedAt: nowIso()
    };
  }

  if (provider.type === "metals-api") {
    const key = String(env.METALS_API_KEY).trim();
    const { goldOunceEur, silverOunceEur } = await fetchMetalsApiPrices(key);
    return {
      provider,
      goldOunceEur,
      silverOunceEur,
      sourceLabel: `${provider.name} · Echtzeit EUR/Feinunze`,
      marketUpdatedAt: nowIso()
    };
  }

  try {
    return await fetchAurumSpotPrices();
  } catch (aurumErr) {
    const lbma = await fetchMintedMetalLbmaPrices();
    return {
      ...lbma,
      sourceLabel: `${lbma.sourceLabel} · Echtzeit-Fallback (${aurumErr.message || "AURUM ausgefallen"})`
    };
  }
}

function buildPublicPayload(cache) {
  const gold = cache.gold || null;
  const silver = cache.silver || null;
  const fetchedAt = gold?.fetchedAt || silver?.fetchedAt || cache.lastSuccessAt || "";
  const freshness = priceFreshnessStatus(fetchedAt);
  const hasPrices = Boolean(gold?.pricePerGram > 0 && silver?.pricePerGram > 0);

  return {
    ok: hasPrices,
    active: cache.active !== false && hasPrices,
    provider: cache.provider || gold?.provider || silver?.provider || "",
    source: gold?.source || silver?.source || "",
    currency: "EUR",
    fetchedAt,
    lastSuccessAt: cache.lastSuccessAt || "",
    lastError: cache.lastError || "",
    freshness,
    gold: gold
      ? {
          pricePerOunce: gold.pricePerOunce,
          pricePerGram: gold.pricePerGram,
          nisabEur: gold.nisabEur,
          nisabGrams: gold.nisabGrams,
          source: gold.source,
          fetchedAt: gold.fetchedAt,
          isManual: gold.isManual
        }
      : null,
    silver: silver
      ? {
          pricePerOunce: silver.pricePerOunce,
          pricePerGram: silver.pricePerGram,
          nisabEur: silver.nisabEur,
          nisabGrams: silver.nisabGrams,
          source: silver.source,
          fetchedAt: silver.fetchedAt,
          isManual: silver.isManual
        }
      : null,
    standardNisabEur: cache.standardNisabEur || 0,
    prices: hasPrices
      ? {
          goldPerGramEur: gold.pricePerGram,
          silverPerGramEur: silver.pricePerGram,
          currency: "EUR",
          source: gold.source || silver.source || cache.provider,
          verifiedAt: fetchedAt,
          active: cache.active !== false,
          apiFallback: !gold?.isManual && !silver?.isManual,
          provider: cache.provider || gold?.provider || ""
        }
      : null
  };
}

export async function getPublicZakatPrices(env, deps, options = {}) {
  const { cache } = await readPriceCache(env, deps.githubGet, deps.base64ToUtf8);
  const hasPrices = Boolean(cache.gold?.pricePerGram > 0 && cache.silver?.pricePerGram > 0);
  const lastFetch = Date.parse(cache.lastFetchAt || cache.lastSuccessAt || "");
  const isStale = !Number.isFinite(lastFetch) || Date.now() - lastFetch >= REALTIME_STALE_MS;
  if ((!hasPrices || isStale) && options.fetchIfEmpty && deps.githubPut) {
    const fetched = await fetchAndStoreZakatPrices(env, deps, { force: true });
    return fetched.public || buildPublicPayload(cache);
  }
  return buildPublicPayload(cache);
}

export async function getAdminZakatPriceStatus(env, deps) {
  const { cache, sha, path } = await readPriceCache(env, deps.githubGet, deps.base64ToUtf8);
  const provider = resolveProvider(env);
  const payload = buildPublicPayload(cache);
  const lastLog = Array.isArray(cache.fetchLogs) ? cache.fetchLogs[0] : null;
  return {
    ok: true,
    cache,
    sha,
    path,
    public: payload,
    apiConfigured: true,
    apiProvider: provider?.name || "AURUM Echtzeit (COMEX) + Frankfurter EUR",
    apiTier: provider?.tier || "realtime",
    requiresUserKey: Boolean(provider?.requiresKey),
    lastLog,
    fetchLogs: (cache.fetchLogs || []).slice(0, 20)
  };
}

async function syncConfigPrices(env, goldGram, silverGram, meta, deps) {
  try {
    await saveZakatPrices(
      env,
      {
        goldPerGramEur: goldGram,
        silverPerGramEur: silverGram,
        currency: "EUR",
        source: meta.source || meta.provider || "API",
        verifiedBy: meta.isManual ? "admin-manual" : "price-engine"
      },
      deps
    );
  } catch (err) {
    console.warn("Zakāt config sync skipped:", err.message || err);
  }
}

export async function fetchAndStoreZakatPrices(env, deps, options = {}) {
  const force = Boolean(options.force);
  const start = Date.now();
  const { cache, sha } = await readPriceCache(env, deps.githubGet, deps.base64ToUtf8);

  if (!force && cache.lastFetchAt) {
    const elapsed = Date.now() - Date.parse(cache.lastFetchAt);
    if (Number.isFinite(elapsed) && elapsed < FETCH_MIN_INTERVAL_MS) {
      return {
        ok: true,
        skipped: true,
        reason: "fetch_interval",
        public: buildPublicPayload(cache)
      };
    }
  }

  let providerInfo = null;
  let goldOunceEur = 0;
  let silverOunceEur = 0;
  let sourceLabel = "";
  let errorMessage = "";

  try {
    const live = await fetchLiveMetalPrices(env);
    providerInfo = live.provider;
    goldOunceEur = live.goldOunceEur;
    silverOunceEur = live.silverOunceEur;
    sourceLabel = live.sourceLabel || `${providerInfo.name} · Echtzeit EUR/Feinunze`;
  } catch (err) {
    errorMessage = err.message || String(err);
    appendFetchLog(cache, {
      id: `log-${Date.now()}`,
      provider: cache.provider || resolveProvider(env)?.id || "",
      status: "error",
      errorMessage,
      fetchedAt: nowIso(),
      durationMs: Date.now() - start
    });
    cache.lastFetchAt = nowIso();
    cache.lastError = errorMessage;
    cache.updatedAt = nowIso();
    await writePriceCache(env, cache, sha, deps);

    const hasFallback = Boolean(cache.gold?.pricePerGram > 0 && cache.silver?.pricePerGram > 0);
    return {
      ok: hasFallback,
      error: errorMessage,
      fallback: hasFallback,
      public: buildPublicPayload(cache)
    };
  }

  const fetchedAt = nowIso();
  const gold = buildMetalEntry("gold", goldOunceEur, {
    source: sourceLabel,
    provider: providerInfo.id,
    fetchedAt,
    isManual: false
  });
  const silver = buildMetalEntry("silver", silverOunceEur, {
    source: sourceLabel,
    provider: providerInfo.id,
    fetchedAt,
    isManual: false
  });
  const standardNisabEur = Math.min(gold.nisabEur, silver.nisabEur);

  cache.version = 1;
  cache.updatedAt = fetchedAt;
  cache.provider = providerInfo.id;
  cache.active = true;
  cache.gold = gold;
  cache.silver = silver;
  cache.standardNisabEur = standardNisabEur;
  cache.lastSuccessAt = fetchedAt;
  cache.lastFetchAt = fetchedAt;
  cache.lastError = "";
  appendFetchLog(cache, {
    id: `log-${Date.now()}`,
    provider: providerInfo.id,
    status: "ok",
    errorMessage: "",
    fetchedAt,
    durationMs: Date.now() - start,
    goldPerGram: gold.pricePerGram,
    silverPerGram: silver.pricePerGram
  });

  await writePriceCache(env, cache, sha, deps);
  await syncConfigPrices(env, gold.pricePerGram, silver.pricePerGram, { source: sourceLabel, provider: providerInfo.id }, deps);

  return {
    ok: true,
    fetched: true,
    provider: providerInfo.name,
    public: buildPublicPayload(cache)
  };
}

export async function confirmManualZakatPrices(env, input, deps) {
  const goldGram = Number(input.goldPerGramEur);
  const silverGram = Number(input.silverPerGramEur);
  if (!Number.isFinite(goldGram) || goldGram <= 0) throw new Error("Goldpreis fehlt oder ungültig");
  if (!Number.isFinite(silverGram) || silverGram <= 0) throw new Error("Silberpreis fehlt oder ungültig");

  const { cache, sha } = await readPriceCache(env, deps.githubGet, deps.base64ToUtf8);
  const fetchedAt = nowIso();
  const source = String(input.source || "Admin manuell bestätigt").trim();
  const provider = String(input.provider || "admin-manual").trim();
  const goldOunce = roundMoney(goldGram * TROY_OZ_TO_GRAM);
  const silverOunce = roundMoney(silverGram * TROY_OZ_TO_GRAM);

  cache.gold = buildMetalEntry("gold", goldOunce, {
    source,
    provider,
    fetchedAt,
    isManual: true,
    adminNote: String(input.adminNote || "").trim()
  });
  cache.silver = buildMetalEntry("silver", silverOunce, {
    source,
    provider,
    fetchedAt,
    isManual: true,
    adminNote: String(input.adminNote || "").trim()
  });
  cache.standardNisabEur = Math.min(cache.gold.nisabEur, cache.silver.nisabEur);
  cache.active = true;
  cache.provider = provider;
  cache.updatedAt = fetchedAt;
  cache.lastSuccessAt = fetchedAt;
  cache.lastFetchAt = fetchedAt;
  cache.lastError = "";
  appendFetchLog(cache, {
    id: `log-${Date.now()}`,
    provider,
    status: "manual",
    errorMessage: "",
    fetchedAt,
    durationMs: 0
  });

  await writePriceCache(env, cache, sha, deps);

  const configResult = await saveZakatPrices(
    env,
    {
      goldPerGramEur: goldGram,
      silverPerGramEur: silverGram,
      currency: "EUR",
      source,
      verifiedBy: "admin-manual",
      configSha: input.configSha || ""
    },
    deps
  );

  return {
    ok: true,
    cache,
    config: configResult.config,
    commitSha: configResult.commitSha,
    public: buildPublicPayload(cache)
  };
}

export async function ensureZakatPricesFresh(env, deps, options = {}) {
  const { cache } = await readPriceCache(env, deps.githubGet, deps.base64ToUtf8);
  const hasPrices = Boolean(cache.gold?.pricePerGram > 0 && cache.silver?.pricePerGram > 0);
  if (!hasPrices) {
    return fetchAndStoreZakatPrices(env, deps, { force: true });
  }
  return fetchAndStoreZakatPrices(env, deps, { force: Boolean(options.force) });
}
