/* DĀR AL TAWḤĪD TV – independent official TV download selector.
 * Isolated to /tv/: never changes Android phone, iOS, Kids or existing PWA.
 * Only signed/approved public GitHub Release assets are offered.
 * /tv.apk remains independently pinned to legacy v0.1.54 in the site router
 * until an explicit tested release cutover.
 */
(() => {
  "use strict";
  const REPO = "Sero91ak/dar-al-tawhid-site";
  const API = "https://api.github.com/repos/" + REPO + "/releases?per_page=50";
  const SOURCE = "https://github.com/" + REPO + "/releases";
  const APK = "dar-al-tawhid-tv.apk";
  const LEGACY = /^android-website-v1\.([1-9]\d*)$/;
  const TV_ONLY = /^tv-website-v1\.([1-9]\d*)$/;
  const SHA256 = /^sha256:([a-f\d]{64})$/i;
  const byId = (id) => document.getElementById(id);

  function dateInGermany(input) {
    const value = new Date(input);
    return Number.isFinite(value.getTime())
      ? new Intl.DateTimeFormat("de-DE", {
          day: "2-digit", month: "2-digit", year: "numeric",
          timeZone: "Europe/Berlin"
        }).format(value)
      : null;
  }

  function releaseInfo(release) {
    if (!release || release.draft || release.prerelease) return null;
    const tag = String(release.tag_name || "");
    const match = TV_ONLY.exec(tag) || LEGACY.exec(tag);
    if (!match || typeof release.published_at !== "string") return null;
    const versionCode = Number(match[1]);
    if (!Number.isSafeInteger(versionCode) || versionCode <= 0) return null;
    const asset = Array.isArray(release.assets)
      ? release.assets.find((a) => a && a.name === APK)
      : null;
    const downloadUrl = SOURCE + "/download/" + tag + "/" + APK;
    if (!asset || asset.state !== "uploaded" || !Number.isFinite(asset.size) ||
        asset.size < 10000 || asset.browser_download_url !== downloadUrl ||
        !SHA256.test(asset.digest || "")) return { versionCode, valid: false };
    const body = String(release.body || "");
    const tvVersion = /^TV_VERSION=(\d+\.\d+\.(\d+))$/m.exec(body);
    const builtAt = /^BUILD_CREATED_AT=(\d{4}-\d{2}-\d{2}T[^\n]+Z)$/m.exec(body);
    const built = builtAt && dateInGermany(builtAt[1]);
    const published = dateInGermany(release.published_at);
    if (!tvVersion || !built || !published ||
        Number(tvVersion[2]) !== versionCode) return { versionCode, valid: false };
    return {
      versionCode, valid: true,
      version: tvVersion[1], built, published,
      size: (asset.size / 1024 / 1024).toLocaleString("de-DE", {
        maximumFractionDigits: 1
      }) + " MB",
      href: downloadUrl,
      sha256: asset.digest.slice(7).toLowerCase(),
      releaseUrl: SOURCE + "/tag/" + tag
    };
  }

  function setStatus(msg, ready) {
    const el = byId("status-tv");
    if (el) {
      const span = el.querySelector("span");
      if (span) span.textContent = msg;
      if (ready) el.classList.add("ready");
    }
  }

  function showRelease(release) {
    const button = byId("apk-tv");
    const pending = byId("pending-tv");
    if (button) {
      button.href = release.href;
      button.rel = "noopener noreferrer";
      button.hidden = false;
      button.setAttribute("aria-label",
        "DĀR AL TAWḤĪD TV v" + release.version + " als APK herunterladen");
    }
    if (pending) pending.hidden = true;
    setStatus("Offizielle signierte TV-Version verfügbar", true);
    const update = (id, value) => {
      const el = byId(id);
      if (el) el.textContent = value;
    };
    update("release-version-tv", "Version " + release.version);
    update("release-dates-tv", "Erstellt: " + release.built +
      " · veröffentlicht: " + release.published);
    update("release-meta-tv", "Android-TV-APK · " + release.size);
    update("release-sha-tv", release.sha256);
    const source = byId("release-source-tv");
    if (source) {
      source.href = release.releaseUrl;
      source.hidden = false;
    }
    const info = byId("release-info-tv");
    if (info) info.hidden = false;
  }

  async function refresh() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(API, {
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal
      });
      if (!response.ok) throw Error("GitHub API unavailable");
      const list = await response.json();
      if (!Array.isArray(list)) throw Error("No release catalog");
      const candidates = list.map(releaseInfo)
        .filter((item) => item !== null)
        .sort((a, b) => b.versionCode - a.versionCode);
      if (candidates.length === 0) {
        setStatus("Derzeit keine verifizierten TV-Releases gefunden", false);
        return;
      }
      // Fail closed if the latest release metadata is incomplete. No older
      // release may be misrepresented as the newest signed APK.
      if (!candidates[0].valid) {
        setStatus("TV-Release wird geprüft · bisherige stabile APK weiter verfügbar", false);
        return;
      }
      showRelease(candidates[0]);
    } catch (_) {
      setStatus("Release-Prüfung nicht erreichbar · bisherige stabile APK weiter verfügbar", false);
    } finally {
      clearTimeout(timeout);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true });
  } else {
    refresh();
  }
})();
