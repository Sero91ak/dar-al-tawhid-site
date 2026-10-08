/* DAR AL TAWḤĪD · Gemeinsamer APK-Release-Katalog für /links und /download/.
 * Nur die NEUESTE vollständig signierte und öffentlich freigegebene Version
 * erhält Download-Links. Keine Debug-Pakete, Entwürfe oder Kids-Versionen.
 * Informationen stammen direkt aus den offiziellen GitHub-Release-Metadaten.
 */
(function () {
  "use strict";
  const REPO = "Sero91ak/dar-al-tawhid-site";
  const RELEASES = "https://api.github.com/repos/" + REPO + "/releases?per_page=30";
  const DOWNLOAD = "https://github.com/" + REPO + "/releases/download/";
  const NAMES = { adult: "dar-al-tawhid-android.apk", tv: "dar-al-tawhid-tv.apk" };
  const DIGEST = /^sha256:([0-9a-f]{64})$/i;
  const TAG = /^android-website-v1\.([1-9][0-9]*)$/;

  const byId = (id) => document.getElementById(id);
  const fmtDate = (input) => {
    if (typeof input !== "string") return "";
    const time = new Date(input);
    if (Number.isNaN(time.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      timeZone: "Europe/Berlin"
    }).format(time);
  };

  function fileInfo(release, name, buildNumber) {
    const files = Array.isArray(release.assets) ? release.assets : [];
    const file = files.find((x) => x && x.name === name);
    if (!file || file.state !== "uploaded" || !Number.isFinite(file.size) ||
        file.size < 10000 || !DIGEST.test(file.digest || "")) return null;
    const href = DOWNLOAD + release.tag_name + "/" + name;
    if (file.browser_download_url !== href) return null;
    const built = fmtDate(file.created_at);
    const published = fmtDate(release.published_at);
    if (!built || !published) return null;
    return {
      href, sha256: file.digest.slice(7).toLowerCase(),
      version: "0.1." + buildNumber, built, published,
      size: (file.size / 1024 / 1024).toLocaleString("de-DE", {
        maximumFractionDigits: 1
      }) + " MB",
      releaseUrl: "https://github.com/" + REPO +
        "/releases/tag/" + release.tag_name
    };
  }

  function installLink(platform, release) {
    const isTv = platform === "tv";
    const prefix = isTv ? "direct-android-tv" : "direct-android";
    const link = byId(prefix + "-apk");
    const label = byId(prefix + "-label");
    const details = byId(prefix + "-meta");
    const action = byId(prefix + "-action");
    if (link) {
      link.href = release.href;
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", (isTv ? "Android-TV-APK" : "Android-APK") +
        " v" + release.version + " direkt herunterladen");
      if (label) label.textContent = "DAR AL TAWḤĪD";
      if (details) details.textContent =
        "v" + release.version + "  ·  " + release.published;
      if (action) action.textContent = "APK herunterladen  ↓";
      link.setAttribute("data-release-ready", "true");
    }
    // The same release also feeds the main website footer below its iOS promo.
    const footerId = isTv ? "dar-public-tv" : "dar-public-android";
    const footerLink = byId(footerId + "-apk");
    if (footerLink) {
      footerLink.href = release.href;
      footerLink.rel = "noopener noreferrer";
      footerLink.setAttribute("aria-label", (isTv ? "Android TV" : "Android") +
        " · neueste signierte APK v" + release.version + " herunterladen");
      footerLink.setAttribute("data-release-ready", "true");
      const meta = byId(footerId + "-meta");
      const btn = byId(footerId + "-action");
      if (meta) meta.textContent =
        "v" + release.version + "  ·  " + release.published;
      if (btn) btn.textContent = "APK laden ↓";
    }
  }

  function installDownloadCard(platform, release) {
    const button = byId("apk-" + platform);
    const pending = byId("pending-" + platform);
    const status = byId("status-" + platform);
    const version = byId("release-version-" + platform);
    const dates = byId("release-dates-" + platform);
    const digest = byId("release-sha-" + platform);
    const meta = byId("release-meta-" + platform);
    const source = byId("release-source-" + platform);
    if (!button || !pending || !status) return;
    button.href = release.href;
    button.rel = "noopener noreferrer";
    button.removeAttribute("download");
    button.hidden = false;
    pending.hidden = true;
    status.classList.add("ready");
    const title = status.querySelector("span:last-child");
    if (title) title.textContent = "Neueste offizielle APK verfügbar";
    if (version) version.textContent = "Version " + release.version;
    if (dates) dates.textContent = "Datei erstellt: " + release.built +
      "  ·  veröffentlicht: " + release.published;
    if (digest) digest.textContent = release.sha256;
    if (meta) meta.textContent = "APK · " + release.size + " · signierter Release";
    if (source) {
      source.href = release.releaseUrl;
      source.hidden = false;
    }
    const block = byId("release-info-" + platform);
    if (block) block.hidden = false;
  }

  async function refresh() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      let response;
      try {
        response = await fetch(RELEASES, {
          credentials: "omit", cache: "no-store",
          headers: { "Accept": "application/vnd.github+json" },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) return;
      const all = await response.json();
      if (!Array.isArray(all)) return;
      // Use numeric version ordering: lexicographic ordering gets v1.9 > v1.10 wrong.
      const matching = all.filter((r) => r && !r.draft && !r.prerelease &&
        TAG.test(r.tag_name || "") && typeof r.published_at === "string");
      matching.sort((a, b) =>
        Number(TAG.exec(b.tag_name)[1]) - Number(TAG.exec(a.tag_name)[1]));
      const latest = matching[0];
      if (!latest) return;
      const number = Number(TAG.exec(latest.tag_name)[1]);
      const adult = fileInfo(latest, NAMES.adult, number);
      const tv = fileInfo(latest, NAMES.tv, number);
      // Fail closed: incomplete newest release MUST NOT silently show stale files.
      if (!adult || !tv) return;
      installLink("adult", adult);
      installLink("tv", tv);
      installDownloadCard("adult", adult);
      installDownloadCard("tv", tv);
    } catch (_) {
      // Unreachable API, incomplete or unverified release: no untrusted APK.
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true });
  } else {
    refresh();
  }
})();
