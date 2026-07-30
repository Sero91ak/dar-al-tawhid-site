#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function replaceOnce(content, oldStr, newStr, label) {
  if (!content.includes(oldStr)) throw new Error(`${label}: marker not found`);
  return content.replace(oldStr, newStr);
}

const CONST_PATCH_OLD = `    const VERSION_STATE_KEY = 'dar_app_version_state_v1';
    let isChecking = false;`;

const CONST_PATCH_NEW = `    const VERSION_STATE_KEY = 'dar_app_version_state_v1';
    const VERSION_UPDATE_COOLDOWN_MS = 6 * 60 * 60 * 1000;
    const VERSION_STUCK_KEY = 'dar_version_stuck_guard_v1';
    let isChecking = false;`;

const MARK_STUCK_FN = `    function markVersionUpdateStuck(remoteBuildId) {
      try {
        var id = String(remoteBuildId || '').trim();
        if (!id) return;
        var stuck = JSON.parse(sessionStorage.getItem(VERSION_STUCK_KEY) || '{}');
        var tries = String(stuck.buildId) === id ? (Number(stuck.tries) || 0) + 1 : 1;
        sessionStorage.setItem(VERSION_STUCK_KEY, JSON.stringify({ buildId: id, tries: tries, at: Date.now() }));
        if (tries >= 2) {
          writeVersionState({
            acknowledgedBuildId: id,
            appliedBuildId: id,
            updateOfferBlockedBuildId: id,
            updateOfferBlockedUntil: Date.now() + VERSION_UPDATE_COOLDOWN_MS
          });
        }
      } catch (e) {}
    }
`;

const OLD_SHOULD_OFFER = `    function shouldOfferShellUpdate(remoteBuildId) {
      var id = String(remoteBuildId || '').trim();
      if (!id || typeof APP_BUILD_ID !== 'string' || id === String(APP_BUILD_ID)) return false;
      var state = readVersionState();
      if (String(state.appliedBuildId || '') === id) return false;
      if (String(state.acknowledgedBuildId || '') === id) return false;
      return true;
    }`;

const NEW_SHOULD_OFFER = `    function shouldOfferShellUpdate(remoteBuildId) {
      var id = String(remoteBuildId || '').trim();
      if (!id || typeof APP_BUILD_ID !== 'string' || id === String(APP_BUILD_ID)) return false;
      var state = readVersionState();
      if (String(state.appliedBuildId || '') === id) return false;
      if (String(state.acknowledgedBuildId || '') === id) return false;
      if (state.updateOfferBlockedUntil && Date.now() < Number(state.updateOfferBlockedUntil) && String(state.updateOfferBlockedBuildId || '') === id) return false;
      try {
        var stuck = JSON.parse(sessionStorage.getItem(VERSION_STUCK_KEY) || '{}');
        if (String(stuck.buildId) === id && (Number(stuck.tries) || 0) >= 2) return false;
      } catch (e) {}
      return true;
    }`;

const OLD_INDEX_MISMATCH = `              if (remote && remote.buildId && String(remote.buildId) !== String(APP_BUILD_ID)) {
                versionMismatch = true;
                remoteBuildId = String(remote.buildId);
                window.__darRemoteBuildId = remoteBuildId;
                writeVersionState({ lastSeenRemoteBuildId: remoteBuildId, lastSeenAt: Date.now() });
              }`;

const NEW_INDEX_MISMATCH = `              if (remote && remote.buildId && String(remote.buildId) !== String(APP_BUILD_ID)) {
                var remoteNum = parseShellBuildNum(remote.buildId);
                var localNum = parseShellBuildNum(APP_BUILD_ID);
                if (localNum > remoteNum) {
                  rememberAppliedBuild(APP_BUILD_ID);
                  clearVersionUpdatePending();
                  setHomeRefreshHint(false);
                  hideAllBanners();
                } else if (!shouldOfferShellUpdate(remote.buildId)) {
                  rememberAppliedBuild(remote.buildId);
                  clearVersionUpdatePending();
                  setHomeRefreshHint(false);
                  hideAllBanners();
                } else {
                  versionMismatch = true;
                  remoteBuildId = String(remote.buildId);
                  window.__darRemoteBuildId = remoteBuildId;
                  writeVersionState({ lastSeenRemoteBuildId: remoteBuildId, lastSeenAt: Date.now() });
                }
              }`;

const OLD_TEST_MISMATCH_INNER = `                  } else {
                    versionMismatch = true;
                    remoteBuildId = String(remote.buildId);
                    window.__darRemoteBuildId = remoteBuildId;
                    writeVersionState({ lastSeenRemoteBuildId: remoteBuildId, lastSeenAt: Date.now() });
                  }`;

const NEW_TEST_MISMATCH_INNER = `                  } else if (!shouldOfferShellUpdate(remote.buildId)) {
                    rememberAppliedBuild(remote.buildId);
                    clearVersionUpdatePending();
                    setHomeRefreshHint(false);
                    hideAllBanners();
                  } else {
                    versionMismatch = true;
                    remoteBuildId = String(remote.buildId);
                    window.__darRemoteBuildId = remoteBuildId;
                    writeVersionState({ lastSeenRemoteBuildId: remoteBuildId, lastSeenAt: Date.now() });
                  }`;

const SEED_FN = `    async function seedVersionStateOnBoot() {
      if (typeof APP_BUILD_ID !== 'string' || !APP_BUILD_ID) return;
      var versionPath = String(location.pathname || '').indexOf('/test') >= 0 ? '/test/version.json' : '/version.json';
      try {
        var vr = await fetch(versionPath, { cache: 'no-store' });
        if (!vr.ok) return;
        var remote = await vr.json();
        if (remote && remote.buildId && String(remote.buildId) === String(APP_BUILD_ID)) {
          rememberAppliedBuild(APP_BUILD_ID);
          clearVersionUpdatePending();
          window.__darRemoteBuildId = '';
          window.__darAppVersionAvailable = false;
          setHomeRefreshHint(false);
          hideAllBanners();
        }
      } catch (e) {}
    }
`;

const SEED_AND_INIT_TEST_OLD = `    function initAutoRefresh() {
      window.__darAppVersionAvailable = false;
      setHomeRefreshHint(false);
      var banner = getBanner();
      if (banner) {
        banner.addEventListener('click', onBannerActivate);
        banner.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBannerActivate(); }
        });
      }
      setTimeout(function() { checkForUpdates(); }, 2500);`;

const SEED_AND_INIT_TEST_NEW = `${SEED_FN}    function initAutoRefresh() {
      window.__darAppVersionAvailable = false;
      setHomeRefreshHint(false);
      var banner = getBanner();
      if (banner) {
        banner.addEventListener('click', onBannerActivate);
        banner.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBannerActivate(); }
        });
      }
      seedVersionStateOnBoot();
      setTimeout(function() { checkForUpdates(); }, 2500);`;

const SEED_AND_INIT_INDEX_OLD = `    function initAutoRefresh() {
      rememberAppliedBuild(APP_BUILD_ID);
      window.__darAppVersionAvailable = false;
      setHomeRefreshHint(false);
      var banner = getBanner();
      if (banner) {
        banner.addEventListener('click', onBannerActivate);
        banner.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBannerActivate(); }
        });
      }
      window.addEventListener('dar:version-mismatch', function(ev) {
        var remoteId = ev && ev.detail && ev.detail.buildId;
        if (remoteId) presentShellUpdate(remoteId);
      });
      setTimeout(function() { checkForUpdates(); }, 2500);`;

const SEED_AND_INIT_INDEX_NEW = `${SEED_FN}    function initAutoRefresh() {
      window.__darAppVersionAvailable = false;
      setHomeRefreshHint(false);
      var banner = getBanner();
      if (banner) {
        banner.addEventListener('click', onBannerActivate);
        banner.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBannerActivate(); }
        });
      }
      window.addEventListener('dar:version-mismatch', function(ev) {
        var remoteId = ev && ev.detail && ev.detail.buildId;
        if (remoteId && shouldOfferShellUpdate(remoteId)) presentShellUpdate(remoteId);
      });
      seedVersionStateOnBoot();
      setTimeout(function() { checkForUpdates(); }, 2500);`;

const OLD_ON_BANNER = `    function onBannerActivate() {
      if (bannerMode === 'version') {
        markVersionUpdatePending(remoteBuildId || window.__darRemoteBuildId || '');
        hideAllBanners();`;

const NEW_ON_BANNER = `    function onBannerActivate() {
      if (bannerMode === 'version') {
        var targetBuild = remoteBuildId || window.__darRemoteBuildId || '';
        markVersionUpdatePending(targetBuild);
        markVersionUpdateStuck(targetBuild);
        hideAllBanners();`;

const OLD_RENDER_HOME = `function renderHomeRefreshPanel(){const newer=window.__darAppVersionAvailable===true;const banner=newer?\`<section class="home-update-banner"><div><strong>Update verfügbar</strong><span>Neue Inhalte oder Verbesserungen sind bereit.</span></div><button id="hardRefreshTopBtn" class="home-refresh-btn" type="button">Jetzt aktualisieren</button></section>\`:"";return \`\${banner}<section class="home-refresh-panel\${newer?" is-update-available":""}"><div class="home-refresh-copy"><span>Schnellaktion</span><b>🔄 Aktualisieren</b><p>Neue Beiträge laden und App synchronisieren.</p></div><button id="hardRefreshBtn" class="home-refresh-btn" type="button">\${newer?"Jetzt laden":"Sync"}</button></section>\`}`;

const NEW_RENDER_HOME = `function renderHomeRefreshPanel(){const newer=window.__darAppVersionAvailable===true;return \`<section class="home-refresh-panel\${newer?" is-update-available":""}"><div class="home-refresh-copy"><span>Schnellaktion</span><b>\${newer?"Neue Version verfügbar":"🔄 Aktualisieren"}</b><p>\${newer?"Neue App-Version laden und Inhalte synchronisieren.":"Neue Beiträge laden und App synchronisieren."}</p></div><button id="hardRefreshBtn" class="home-refresh-btn" type="button">\${newer?"Jetzt laden":"Sync"}</button></section>\`}`;

const HARD_REFRESH_OLD_TEST = `      var appliedId=String(APP_BUILD_ID||window.__darRemoteBuildId||"").trim();
      if(appliedId&&typeof localStorage!=="undefined"){`;

const HARD_REFRESH_NEW = `      var appliedId=String(window.__darRemoteBuildId||APP_BUILD_ID||"").trim();
      try{var stuckId=appliedId;if(stuckId)sessionStorage.setItem("dar_version_stuck_guard_v1",JSON.stringify({buildId:stuckId,tries:1,at:Date.now()}))}catch(e){}
      if(appliedId&&typeof localStorage!=="undefined"){`;

const HARD_REFRESH_OLD_INDEX = `      var appliedId=String(window.__darRemoteBuildId||APP_BUILD_ID||"").trim();
      if(appliedId&&typeof localStorage!=="undefined"){`;

function patchGuardBlock(html, file, isTest) {
  html = replaceOnce(html, CONST_PATCH_OLD, CONST_PATCH_NEW, `${file} constants`);
  if (!html.includes("function markVersionUpdateStuck")) {
    if (isTest) {
      html = replaceOnce(
        html,
        `    function writeVersionState(patch) {
      try {
        var current = readVersionState();
        var next = Object.assign({}, current, patch || {});
        localStorage.setItem(VERSION_STATE_KEY, JSON.stringify(next));
        return next;
      } catch (e) { return readVersionState(); }
    }
    function rememberAppliedBuild(buildId) {`,
        `    function writeVersionState(patch) {
      try {
        var current = readVersionState();
        var next = Object.assign({}, current, patch || {});
        localStorage.setItem(VERSION_STATE_KEY, JSON.stringify(next));
        return next;
      } catch (e) { return readVersionState(); }
    }
${MARK_STUCK_FN}    function rememberAppliedBuild(buildId) {`,
        `${file} markVersionUpdateStuck`
      );
    } else {
      html = replaceOnce(
        html,
        `    function writeVersionState(patch) {
      try {
        var current = readVersionState();
        var next = Object.assign({}, current, patch || {});
        localStorage.setItem(VERSION_STATE_KEY, JSON.stringify(next));
        return next;
      } catch (e) { return readVersionState(); }
    }
    function rememberAppliedBuild(buildId) {`,
        `    function writeVersionState(patch) {
      try {
        var current = readVersionState();
        var next = Object.assign({}, current, patch || {});
        localStorage.setItem(VERSION_STATE_KEY, JSON.stringify(next));
        return next;
      } catch (e) { return readVersionState(); }
    }
    function parseShellBuildNum(buildId) {
      var match = String(buildId || '').match(/app-shell-v(\\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
${MARK_STUCK_FN}    function rememberAppliedBuild(buildId) {`,
        `${file} parseShellBuildNum + markVersionUpdateStuck`
      );
    }
  }
  html = replaceOnce(html, OLD_SHOULD_OFFER, NEW_SHOULD_OFFER, `${file} shouldOfferShellUpdate`);
  if (!isTest) {
    html = replaceOnce(html, OLD_INDEX_MISMATCH, NEW_INDEX_MISMATCH, `${file} index mismatch`);
  } else {
    html = replaceOnce(html, OLD_TEST_MISMATCH_INNER, NEW_TEST_MISMATCH_INNER, `${file} test mismatch`);
  }
  html = replaceOnce(html, OLD_ON_BANNER, NEW_ON_BANNER, `${file} onBannerActivate`);
  html = replaceOnce(
    html,
    isTest ? SEED_AND_INIT_TEST_OLD : SEED_AND_INIT_INDEX_OLD,
    isTest ? SEED_AND_INIT_TEST_NEW : SEED_AND_INIT_INDEX_NEW,
    `${file} initAutoRefresh`
  );
  return html;
}

for (const [file, isTest] of [
  ["index.html", false],
  ["test/index.html", true]
]) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  html = patchGuardBlock(html, file, isTest);
  html = replaceOnce(html, OLD_RENDER_HOME, NEW_RENDER_HOME, `${file} renderHomeRefreshPanel`);
  if (isTest && html.includes(HARD_REFRESH_OLD_TEST)) {
    html = replaceOnce(html, HARD_REFRESH_OLD_TEST, HARD_REFRESH_NEW, `${file} hardRefreshApp`);
  } else if (!isTest && html.includes(HARD_REFRESH_OLD_INDEX) && !html.includes('sessionStorage.setItem("dar_version_stuck_guard_v1"')) {
    html = replaceOnce(html, HARD_REFRESH_OLD_INDEX, HARD_REFRESH_NEW, `${file} hardRefreshApp`);
  }
  fs.writeFileSync(filePath, html);
  console.log(`patched ${file}`);
}

const bootPath = path.join(ROOT, "assets/live-boot.js");
let boot = fs.readFileSync(bootPath, "utf8");
boot = replaceOnce(
  boot,
  `        var state = readVersionState();
        if (state && (state.appliedBuildId === remoteBuildId || state.acknowledgedBuildId === remoteBuildId)) return;
        window.__darRemoteBuildId = remoteBuildId;
        window.__darAppVersionAvailable = true;`,
  `        var state = readVersionState();
        if (state && (state.appliedBuildId === remoteBuildId || state.acknowledgedBuildId === remoteBuildId)) return;
        if (state && state.updateOfferBlockedUntil && Date.now() < Number(state.updateOfferBlockedUntil) && String(state.updateOfferBlockedBuildId || "") === remoteBuildId) return;
        try {
          var stuck = JSON.parse(sessionStorage.getItem("dar_version_stuck_guard_v1") || "{}");
          if (String(stuck.buildId) === remoteBuildId && (Number(stuck.tries) || 0) >= 2) return;
        } catch (e) {}
        window.__darRemoteBuildId = remoteBuildId;
        if (typeof window.DAR_AUTO_REFRESH === "object" && typeof window.DAR_AUTO_REFRESH.check === "function") {
          try { window.dispatchEvent(new CustomEvent("dar:version-mismatch", { detail: { buildId: remoteBuildId, localBuildId: local } })); } catch (e) {}
          return;
        }
        window.__darAppVersionAvailable = true;`,
  "live-boot.js"
);
fs.writeFileSync(bootPath, boot);
console.log("patched assets/live-boot.js");

for (const [file, buildId, note] of [
  ["version.json", "app-shell-v370", "v370 · Versions-Banner-Schleife repariert + Update-Lock"],
  ["test/version.json", "app-shell-v370-test", "Test-App v370-test · Versions-Banner-Schleife repariert + Update-Lock"]
]) {
  const filePath = path.join(ROOT, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  Object.assign(data, { buildId, note, updatedAt: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${file}`);
}

const swPath = path.join(ROOT, "service-worker.js");
let sw = fs.readFileSync(swPath, "utf8");
sw = sw.replace(/dar-al-tawhid-offline-light-v\d+[^\']*/g, "dar-al-tawhid-offline-light-v370-version-loop-fix");
fs.writeFileSync(swPath, sw);
console.log("updated service-worker.js");
