/* PUSH_SYSTEM_GUARD: Gebets-Push + Tages-Duʿāʾ/Empfehlung + Willkommens-Push.
   Nicht entfernen oder vereinfachen – CI blockiert sonst (scripts/push-system-guard.js). */
import {
  parsePostForTelegram,
  validateTelegramPost,
  buildTelegramPreview,
  buildTelegramHtml,
  shortenForCaption
} from "./telegram-formatter.js";
import {
  readPrayerPushStatus,
  sendPrayerTestPush,
  ensurePrayerSchedulerFresh,
  triggerPrayerWorkflowForSubscription
} from "./prayer-push-admin.js";
import {
  readDailyPushStatus,
  readDailyPushConfig,
  saveDailyPushConfig,
  ensureDailyPushSchedulerFresh,
  sendDailyTestPush,
  sendWelcomePush,
  buildDailyPushPreview
} from "./daily-push-admin.js";
import {
  readJummahPushStatus,
  ensureJummahPushSchedulerFresh,
  sendJummahTestPush
} from "./jummah-push-admin.js";
import {
  readShortlinksRegistry,
  saveShortlinkEntry,
  saveAutoShortlinkEntry,
  importShortlinkBatch,
  createShortlinkEntry,
  createInstagramChannelPost,
  validatePostShortlinkForPublish
} from "./kurzlink-admin.js";
import { readZakatConfig, saveZakatPrices } from "./zakat-admin.js";
import {
  readStoriesIndex,
  saveStoryEntry,
  deleteStoryEntry,
  reorderStories,
  buildPublicStoriesResponse
} from "./stories-admin.js";
import {
  readFeedIndex,
  saveFeedEntry,
  deleteFeedEntry,
  reorderFeedItems,
  buildPublicFeedResponse
} from "./focus-feed-admin.js";
import {
  readFeedBackgroundsIndex,
  saveFeedBackgroundEntry,
  deleteFeedBackgroundEntry,
  buildPublicFeedBackgroundsResponse
} from "./feed-backgrounds-admin.js";
import {
  getPublicZakatPrices,
  getAdminZakatPriceStatus,
  fetchAndStoreZakatPrices,
  confirmManualZakatPrices,
  ensureZakatPricesFresh
} from "./zakat-prices.js";
import {
  syncFeedBackgroundImages,
  ensureFeedBackgroundsFresh,
  maybeAutoSyncFeedBackgrounds,
  getFeedBackgroundSyncStatus,
  cleanupFeedBackgroundPool,
  blockFeedBackgroundImage
} from "./feed-backgrounds-sync.js";
import {
  readLibraryCatalog,
  saveLibraryPublication,
  deleteLibraryPublication,
  suggestLibraryCategory,
  LIBRARY_ADMIN_META
} from "./library-admin.js";
import {
  libraryPushRegistryKey,
  buildLibraryPushPendingRecord,
  buildLibraryPushUrl,
  verifyLibraryLiveAvailabilityWithRetry,
  sendLibraryPublicationPush,
  LIBRARY_PUSH_DELAY_AFTER_LIVE_MS
} from "./library-push-admin.js";

const DEFAULT_OWNER = "Sero91ak";
const DEFAULT_REPO = "dar-al-tawhid-site";
const DEFAULT_BRANCH = "main";
// Deployed via GitHub Actions (.github/workflows/deploy-admin-publisher.yml)
const DEFAULT_POSTS_DIR = "content/posts";
const DEFAULT_STAGING_POSTS_DIR = "content/staging/posts";
const DEFAULT_SOURCES_DIR = "assets/sources";
const SOURCE_MAX_BYTES = 20 * 1024 * 1024;
const SOURCE_ALLOWED_EXT = new Set(["pdf", "png", "jpg", "jpeg", "webp"]);
const DEFAULT_ALLOWED_ORIGIN = "https://dar-al-tawhid.de";
const DEFAULT_UPDATES_PATH = "content/updates/current.json";
const DEFAULT_SCHEDULE_PATH = "content/admin/planned-posts.json";
const DEFAULT_DELETED_POSTS_PATH = "content/admin/deleted-posts.json";
const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const DEFAULT_TELEGRAM_POSTS_PATH = "content/admin/telegram-posts.json";
const DEFAULT_PENDING_PUSHES_PATH = "content/admin/pending-pushes.json";
const DEFAULT_PRAYER_STATUS_PATH = "content/admin/prayer-push-status.json";
const LIVE_CHECK_SCHEDULE_FULL_MS = [30000, 60000, 120000, 180000, 240000, 300000];
const LIVE_CHECK_SCHEDULE_QUICK_MS = [0, 5000, 10000];
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === "/health" || url.pathname === "/api/admin/health") {
        return json({
          ok: true,
          service: "dar-admin-publisher",
          repo: `${env.GITHUB_OWNER || DEFAULT_OWNER}/${env.GITHUB_REPO || DEFAULT_REPO}`,
          branch: env.GITHUB_BRANCH || DEFAULT_BRANCH,
          hasGithubToken: Boolean(env.GITHUB_TOKEN),
          hasAdminSecret: Boolean(env.ADMIN_PUBLISH_SECRET),
          hasOneSignalKey: Boolean(oneSignalApiKey(env)),
          hasTelegramToken: Boolean(telegramBotToken(env)),
          telegramChannel: telegramChannelId(env),
          newsPath: env.UPDATES_PATH || DEFAULT_UPDATES_PATH,
          schedulePath: env.SCHEDULE_PATH || DEFAULT_SCHEDULE_PATH,
          prayerScheduler: "cloudflare-worker-cron-v3",
          prayerCron: "*/5 * * * *",
          dailyPushScheduler: "cloudflare-worker-daily-v1",
          dailyPushCron: "*/5 * * * *",
          jummahPushScheduler: "cloudflare-worker-jummah-v1",
          jummahPushCron: "*/5 * * * *",
          scheduler: "ready"
        }, cors);
      }

      if (url.pathname === "/api/prayer/status" && request.method === "GET") {
        const result = await readPrayerPushStatus(env, githubGet, base64ToUtf8);
        return json(result, cors, result.ok ? 200 : 200);
      }

      if (url.pathname === "/api/daily/status" && request.method === "GET") {
        const result = await readDailyPushStatus(env, githubGet, base64ToUtf8);
        return json(result, cors, 200);
      }

      if (url.pathname === "/api/jummah/status" && request.method === "GET") {
        const result = await readJummahPushStatus(env, githubGet, base64ToUtf8);
        return json(result, cors, 200);
      }

      if (url.pathname === "/api/prayer/schedule-now" && request.method === "POST") {
        const input = await request.json().catch(() => ({}));
        const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
        if (!subscriptionId) return json({ ok: false, error: "subscriptionId fehlt" }, cors, 400);
        const result = await triggerPrayerWorkflowForSubscription(env, subscriptionId, {
          githubGet,
          githubPut,
          base64ToUtf8,
          utf8ToBase64
        });
        return json({ ok: result.triggered && result.ok !== false, ...result }, cors, result.triggered ? 200 : 503);
      }

      if (url.pathname === "/api/prayer/test" && request.method === "POST") {
        const input = await request.json().catch(() => ({}));
        const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
        if (!subscriptionId) return json({ ok: false, error: "subscriptionId fehlt" }, cors, 400);
        const result = await sendPrayerTestPush(env, input);
        return json({ ok: Boolean(result.sent), ...result }, cors, result.sent ? 200 : 503);
      }

      if (url.pathname === "/api/push/welcome" && request.method === "POST") {
        const input = await request.json().catch(() => ({}));
        const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
        if (!subscriptionId) return json({ ok: false, error: "subscriptionId fehlt" }, cors, 400);
        const result = await sendWelcomePush(env, input);
        return json({ ok: Boolean(result.sent), ...result }, cors, result.sent ? 200 : 503);
      }

      if (url.pathname === "/api/daily/test" && request.method === "POST") {
        const input = await request.json().catch(() => ({}));
        const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
        if (!subscriptionId) return json({ ok: false, error: "subscriptionId fehlt" }, cors, 400);
        const result = await sendDailyTestPush(env, input);
        return json({ ok: Boolean(result.sent), ...result }, cors, result.sent ? 200 : 503);
      }

      if (url.pathname === "/api/jummah/test" && request.method === "POST") {
        const input = await request.json().catch(() => ({}));
        const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
        if (!subscriptionId) return json({ ok: false, error: "subscriptionId fehlt" }, cors, 400);
        const result = await sendJummahTestPush(env, input);
        return json({ ok: Boolean(result.sent), ...result }, cors, result.sent ? 200 : 503);
      }

      if (url.pathname === "/api/admin/next-number") {
        if (request.method !== "GET") {
          return json({ ok: false, error: "GET required" }, cors, 405);
        }
        assertConfigured(env);
        assertAuthorized(request, env);
        return json({ ok: true, ...(await fetchPostNumberInfo(env)) }, cors);
      }

      if (url.pathname === "/api/admin/visitor-health") {
        if (request.method !== "GET") {
          return json({ ok: false, error: "GET required" }, cors, 405);
        }
        assertConfigured(env);
        assertAuthorized(request, env);
        const health = await checkVisitorSiteHealth(env);
        return json({ ok: health.ok, ...health }, cors, health.ok ? 200 : 503);
      }

      if (url.pathname === "/api/admin/post" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const filename = sanitizeFilename(String(url.searchParams.get("filename") || "").trim());
        if (!filename) return json({ ok: false, error: "filename fehlt" }, cors, 400);
        return json(await fetchPostMarkdown(env, filename), cors);
      }

      if (url.pathname === "/api/admin/sources/list" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const withUsage = String(url.searchParams.get("usage") || "") === "1";
        return json(await listSourceFiles(env, { withUsage }), cors);
      }

      if (url.pathname === "/api/admin/shortlinks" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const { registry, sha, path } = await readShortlinksRegistry(env, githubGet, base64ToUtf8);
        return json({ ok: true, registry, sha, path, count: Object.keys(registry.entries || {}).length }, cors);
      }

      if (url.pathname === "/api/admin/shortlinks/save" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await saveShortlinkEntry(env, input, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8
        });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/shortlinks/auto" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await saveAutoShortlinkEntry(env, input, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8
        });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/shortlinks/import" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await importShortlinkBatch(env, input, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8
        });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/shortlinks/create" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        assertShortlinkCreateRateLimit(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await createShortlinkEntry(env, input, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8,
          logMeta: {
            ip: request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "",
            userAgent: request.headers.get("User-Agent") || ""
          }
        });
        if (!result.ok) {
          return json({ ok: false, success: false, error: result.error || "Kurzlink konnte nicht erstellt werden" }, cors, 400);
        }
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/shortlinks/channel-create" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        assertShortlinkCreateRateLimit(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await createInstagramChannelPost(env, input, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8,
          logMeta: {
            client: "gpt-action",
            ip: request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "",
            userAgent: request.headers.get("User-Agent") || ""
          }
        });
        if (!result.ok) {
          return json({ ok: false, success: false, error: result.error || "Kurzlink konnte nicht erstellt werden. Bitte Quelle prüfen." }, cors, 400);
        }
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/stories" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const staging = String(url.searchParams.get("staging") || "") === "1";
        const { index, sha, path } = await readStoriesIndex(env, { staging }, { githubGet, base64ToUtf8 });
        return json({ ok: true, index, sha, path, staging, count: (index.items || []).length }, cors);
      }

      if (url.pathname === "/api/admin/stories/save" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await saveStoryEntry(env, input, helpers), cors);
      }

      if (url.pathname === "/api/admin/stories/delete" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await deleteStoryEntry(env, input, helpers), cors);
      }

      if (url.pathname === "/api/admin/stories/reorder" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await reorderStories(env, input, helpers), cors);
      }

      if (url.pathname === "/api/admin/zakat/config" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const { config, sha, path } = await readZakatConfig(env, githubGet, base64ToUtf8);
        return json({ ok: true, config, sha, path }, cors);
      }

      if (url.pathname === "/api/zakat/prices" && request.method === "GET") {
        const result = await getPublicZakatPrices(env, { githubGet, base64ToUtf8, githubPut, githubCommitBatch }, { fetchIfEmpty: true });
        return json(result, cors, 200);
      }

      if (url.pathname === "/api/stories" && request.method === "GET") {
        const staging = String(url.searchParams.get("staging") || "") === "1";
        const { index, path } = await readStoriesIndex(env, { staging }, { githubGet, base64ToUtf8 });
        return json({ ...buildPublicStoriesResponse(index), path, staging }, cors, 200);
      }

      if (url.pathname === "/api/feed" && request.method === "GET") {
        const staging = String(url.searchParams.get("staging") || "") === "1";
        const { index, path } = await readFeedIndex(env, { staging }, { githubGet, base64ToUtf8 });
        return json({ ...buildPublicFeedResponse(index), path, staging }, cors, 200);
      }

      if (url.pathname === "/api/admin/feed" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const staging = String(url.searchParams.get("staging") || "") === "1";
        const { index, sha, path } = await readFeedIndex(env, { staging }, { githubGet, base64ToUtf8 });
        return json({ ok: true, index, sha, path, staging, count: (index.items || []).length }, cors);
      }

      if (url.pathname === "/api/admin/feed/save" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await saveFeedEntry(env, input, helpers), cors);
      }

      if (url.pathname === "/api/admin/feed/delete" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await deleteFeedEntry(env, input, helpers), cors);
      }

      if (url.pathname === "/api/admin/library" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const helpers = { githubGet, base64ToUtf8 };
        const target = String(url.searchParams.get("target") || "test");
        const { catalog, sha, path } = await readLibraryCatalog(env, helpers, { target });
        return json({ ok: true, catalog, sha, path, target, meta: LIBRARY_ADMIN_META, count: (catalog.publications || []).length }, cors);
      }

      if (url.pathname === "/api/admin/library/save" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        try {
          const result = await saveLibraryPublication(env, input, helpers);
          if (result.published && result.target === "live" && input.triggerDeploy !== false) {
            ctx.waitUntil(triggerSiteDeployWorkflow(env, `library-live:${result.publication?.id || "save"}`));
          }
          if (result.published && result.target === "live") {
            return json({
              ...result,
              push: { sent: false, skipped: true, reason: "Veröffentlicht ohne Push — Live Push separat im Admin" },
              deploy: { triggered: input.triggerDeploy !== false }
            }, cors);
          }
          return json(result, cors);
        } catch (e) {
          return json({ ok: false, error: e.message || "Speichern fehlgeschlagen" }, cors, e.status || 400);
        }
      }

      if (url.pathname === "/api/admin/library/delete" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        try {
          return json(await deleteLibraryPublication(env, input, helpers), cors);
        } catch (e) {
          return json({ ok: false, error: e.message || "Löschen fehlgeschlagen" }, cors, e.status || 400);
        }
      }

      if (url.pathname === "/api/admin/library/suggest" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const suggestion = suggestLibraryCategory(String(input?.text || ""));
        return json({ ok: true, suggestion }, cors);
      }

      if (url.pathname === "/api/admin/feed/reorder" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await reorderFeedItems(env, input, helpers), cors);
      }

      if (url.pathname === "/api/feed-backgrounds" && request.method === "GET") {
        const staging = String(url.searchParams.get("staging") || "") === "1";
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        ctx.waitUntil(maybeAutoSyncFeedBackgrounds(env, helpers, { staging }));
        const { index, path } = await readFeedBackgroundsIndex(env, { staging }, helpers);
        return json({ ...buildPublicFeedBackgroundsResponse(index), path, staging }, cors, 200);
      }

      if (url.pathname === "/api/admin/feed-backgrounds" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const staging = String(url.searchParams.get("staging") || "") === "1";
        const { index, sha, path } = await readFeedBackgroundsIndex(env, { staging }, { githubGet, base64ToUtf8 });
        return json({
          ok: true,
          index,
          sha,
          path,
          staging,
          count: (index.items || []).length,
          approved: (index.items || []).filter((x) => x.approved && x.status === "active").length
        }, cors);
      }

      if (url.pathname === "/api/admin/feed-backgrounds/save" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await saveFeedBackgroundEntry(env, input, helpers), cors);
      }

      if (url.pathname === "/api/admin/feed-backgrounds/delete" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await deleteFeedBackgroundEntry(env, input, helpers), cors);
      }

      if (url.pathname === "/api/admin/feed-backgrounds/sync/status" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const staging = String(url.searchParams.get("staging") || "") === "1";
        const { index } = await readFeedBackgroundsIndex(env, { staging }, { githubGet, base64ToUtf8 });
        return json(getFeedBackgroundSyncStatus(index, env), cors);
      }

      if (url.pathname === "/api/admin/feed-backgrounds/sync" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        const staging = Boolean(input?.staging);
        const result = await syncFeedBackgroundImages(env, helpers, {
          staging,
          force: Boolean(input?.force),
          maxDownloads: Number(input?.maxDownloads) || 0
        });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/feed-backgrounds/cleanup" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        const staging = Boolean(input?.staging);
        const result = await cleanupFeedBackgroundPool(env, helpers, {
          staging,
          keep: Number(input?.keep) || 80,
          removeBlocked: input?.removeBlocked !== false
        });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/feed-backgrounds/block" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        const staging = Boolean(input?.staging);
        const result = await blockFeedBackgroundImage(env, helpers, {
          staging,
          slug: String(input?.slug || "").trim(),
          reason: String(input?.reason || "").trim(),
          altId: String(input?.altId || "").trim()
        });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/prayer/config" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const { config, sha, path } = await readPrayerConfig(env, githubGet, base64ToUtf8);
        return json({ ok: true, config, sha, path }, cors);
      }

      if (url.pathname === "/api/admin/prayer/prices" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await getAdminZakatPriceStatus(env, { githubGet, base64ToUtf8, githubPut, githubCommitBatch });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/prayer/prices/fetch" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await fetchAndStoreZakatPrices(env, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }, { requestedBy: "admin" });
        return json(result, cors, result.ok ? 200 : 503);
      }

      if (url.pathname === "/api/admin/prayer/prices/confirm" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await confirmManualZakatPrices(env, input, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 });
        return json(result, cors, result.ok ? 200 : 400);
      }

      if (url.pathname === "/api/admin/prayer/prices/ensure" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await ensureZakatPricesFresh(env, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }, { requestedBy: "admin" });
        return json(result, cors, result.ok ? 200 : 503);
      }

      if (url.pathname === "/api/admin/prayer/config" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await savePrayerConfig(env, input, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 });
        return json(result, cors, result.ok ? 200 : 400);
      }

      assertConfigured(env);
      assertAuthorized(request, env);

      const input = await request.json().catch(() => ({}));
      const publishPaths = new Set([
        "/api/admin/publish",
        "/api/admin/publish-live"
      ]);
      const bulkPublishPaths = new Set([
        "/api/admin/bulk-publish",
        "/api/admin/bulk-publish-live"
      ]);
      const deletePaths = new Set([
        "/api/admin/delete-post"
      ]);
      const telegramPaths = new Set([
        "/api/admin/telegram/preview",
        "/api/admin/telegram/send",
        "/api/admin/telegram/test",
        "/api/admin/telegram/status"
      ]);
      const pushPaths = new Set([
        "/api/admin/push/retry",
        "/api/admin/push/library/retry",
        "/api/admin/push/status"
      ]);
      const prayerPaths = new Set([
        "/api/admin/prayer/status",
        "/api/admin/prayer/test",
        "/api/admin/prayer/run"
      ]);
      const dailyPaths = new Set([
        "/api/admin/daily/status",
        "/api/admin/daily/config",
        "/api/admin/daily/test",
        "/api/admin/daily/preview",
        "/api/admin/daily/run"
      ]);
      const jummahPaths = new Set([
        "/api/admin/jummah/status",
        "/api/admin/jummah/test",
        "/api/admin/jummah/run"
      ]);

      if (deletePaths.has(url.pathname)) {
        return json(await deletePost(env, input), cors);
      }

      if (url.pathname === "/api/admin/telegram/preview") {
        return json(buildTelegramPreviewResponse(env, input), cors);
      }

      if (telegramPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/status")) {
          const postId = String(input.postId || "").trim();
          if (!postId) return json({ ok: false, error: "postId fehlt" }, cors, 400);
          const registry = await readTelegramPostsRegistry(env);
          const entry = registry.posts?.[postId] || null;
          return json({ ok: true, postId, entry }, cors);
        }
        if (url.pathname.endsWith("/test")) {
          return json(await sendTelegramTest(env), cors);
        }
        if (url.pathname.endsWith("/send")) {
          return json(await sendTelegramPost(env, input), cors);
        }
      }

      if (pushPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/library/retry")) {
          return json(await retryPendingLibraryPush(env, input, ctx), cors);
        }
        if (url.pathname.endsWith("/retry")) {
          return json(await retryPendingPostPush(env, input, ctx), cors);
        }
      }

      if (prayerPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/status")) {
          return json(await readPrayerPushStatus(env, githubGet, base64ToUtf8), cors);
        }
        if (url.pathname.endsWith("/test")) {
          return json(await sendPrayerTestPush(env, input), cors);
        }
        if (url.pathname.endsWith("/run")) {
          const live = Boolean(input.live || input.livePush);
          const result = await ensurePrayerSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true, dryRun: !live });
          return json(result, cors, result.ok === false ? 503 : 200);
        }
      }

      if (dailyPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/status")) {
          return json(await readDailyPushStatus(env, githubGet, base64ToUtf8), cors);
        }
        if (url.pathname.endsWith("/config") && request.method === "GET") {
          return json(await readDailyPushConfig(env, githubGet, base64ToUtf8), cors);
        }
        if (url.pathname.endsWith("/config") && request.method === "POST") {
          return json(await saveDailyPushConfig(env, input, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }), cors);
        }
        if (url.pathname.endsWith("/preview")) {
          return json(await buildDailyPushPreview(env, input), cors);
        }
        if (url.pathname.endsWith("/test")) {
          return json(await sendDailyTestPush(env, input), cors);
        }
        if (url.pathname.endsWith("/run")) {
          const live = Boolean(input.live || input.livePush);
          const result = await ensureDailyPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true, dryRun: !live });
          return json(result, cors, result.ok === false ? 503 : 200);
        }
      }

      if (jummahPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/status")) {
          return json(await readJummahPushStatus(env, githubGet, base64ToUtf8), cors);
        }
        if (url.pathname.endsWith("/test")) {
          return json(await sendJummahTestPush(env, input), cors);
        }
        if (url.pathname.endsWith("/run")) {
          const live = Boolean(input.live || input.livePush);
          const result = await ensureJummahPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true, dryRun: !live });
          return json(result, cors, result.ok === false ? 503 : 200);
        }
      }

      if (publishPaths.has(url.pathname)) {
        return json(await publishPostFromMarkdown(env, input, ctx), cors);
      }

      if (bulkPublishPaths.has(url.pathname)) {
        return json(await publishBulkPostsFromMarkdown(env, input, ctx), cors);
      }

      return json({ ok: false, error: "Unknown route" }, cors, 404);
    } catch (err) {
      console.error("worker error", err);
      const status = Number(err?.status) || 500;
      return json({ ok: false, error: err?.message || "Unknown error" }, cors, status);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(ensurePrayerSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true, dryRun: false }));
    ctx.waitUntil(ensureDailyPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true, dryRun: false }));
    ctx.waitUntil(ensureJummahPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true, dryRun: false }));
    ctx.waitUntil(runScheduledPublishes(env));
  }
};

async function fetchPostNumberInfo(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const files = await githubListDir(env, owner, repo, postsDir, branch);
  const numbers = [];
  const ids = [];
  for (const item of files) {
    if (!item || item.type !== "file") continue;
    const name = String(item.name || "");
    if (!name.endsWith(".md")) continue;
    const match = name.match(/^(
[... omitted 124798 of 130092 characters ...]
