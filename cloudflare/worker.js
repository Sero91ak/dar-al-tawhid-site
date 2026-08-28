/* PUSH_SYSTEM_GUARD: Gebets-Push + Tages-Duʿāʾ/Empfehlung + Willkommens-Push.
   Nicht entfernen oder vereinfachen – CI blockiert sonst (scripts/push-system-guard.js).
   Deploy-Marker: welcome-push-once-v676
   Secret-Resync nach Reclaim: 2026-08-27
   Admin-UI v56: Secret-Resync nach Static-Deploy
   Secret put fallback 2026-08-27T09:15: GITHUB_TOKEN wieder anbinden
   Secret-Resync 2026-08-27T20:55: Publish GITHUB_TOKEN fehlt — Reclaim
   Jummah opt-out 2026-08-28: Scheduler nur jummah_notifications=true */
import { separatePushLaunchUrls } from "./push-launch-urls.js";
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
export { PrayerStatusStore } from "./prayer-status-store.js";
export { VideoStudioStore } from "./video-studio/job-store.js";
import { handleVideoStudioRequest, resumeStuckVideoStudioJobs } from "./video-studio/index.js";
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
import { sendNewPostPush } from "./post-push-admin.js";

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
// Sofort prüfen, dann gestaffelt nachziehen — nicht erst 30s warten (Admin-Retry hing sonst).
const LIVE_CHECK_SCHEDULE_FULL_MS = [0, 15000, 30000, 60000, 120000, 180000, 240000, 300000];
const LIVE_CHECK_SCHEDULE_QUICK_MS = [0, 3000, 8000];
const LIVE_CHECK_SCHEDULE_CRON_MS = [0, 5000, 15000, 30000, 60000, 120000];
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
          deployMarker: "welcome-push-once-v676",
          repo: `${env.GITHUB_OWNER || DEFAULT_OWNER}/${env.GITHUB_REPO || DEFAULT_REPO}`,
          branch: env.GITHUB_BRANCH || DEFAULT_BRANCH,
          hasGithubToken: Boolean(env.GITHUB_TOKEN),
          hasAdminSecret: Boolean(env.ADMIN_PUBLISH_SECRET),
          hasOneSignalKey: Boolean(oneSignalApiKey(env)),
          hasTelegramToken: Boolean(telegramBotToken(env)),
          telegramChannel: telegramChannelId(env),
          telegramTopicsChatId: telegramTopicsChatId(env) || null,
          telegramEndpoints: [
            "/api/admin/telegram/health",
            "/api/admin/telegram/status",
            "/api/admin/telegram/preview",
            "/api/admin/telegram/test",
            "/api/admin/telegram/send",
            "/api/admin/telegram/route-last"
          ],
          newsPath: env.UPDATES_PATH || DEFAULT_UPDATES_PATH,
          schedulePath: env.SCHEDULE_PATH || DEFAULT_SCHEDULE_PATH,
          prayerScheduler: "cloudflare-worker-cron-v3",
          prayerCron: "*/5 * * * *",
          prayerStatusStore: Boolean(env.PRAYER_STATUS_STORE),
          libraryApi: "v3-split-push",
          libraryPushDelayMs: LIBRARY_PUSH_DELAY_AFTER_LIVE_MS,
          dailyPushScheduler: "cloudflare-worker-daily-v1",
          dailyPushCron: "*/5 * * * *",
          jummahPushScheduler: "cloudflare-worker-jummah-v1",
          jummahPushCron: "*/5 * * * *",
          videoStudioStore: Boolean(env.VIDEO_STUDIO_STORE),
          videoStudioR2: Boolean(env.VIDEO_STUDIO_R2 || env.VIDEO_STUDIO_BUCKET),
          videoStudioFal: Boolean(String(env.FAL_KEY || env.FAL_API_KEY || "").trim()),
          videoStudioVoice: Boolean(String(env.ELEVENLABS_API_KEY || "").trim() && String(env.ELEVENLABS_VOICE_ID || env.DAR_MALE_VOICE_ID || "").trim()),
          videoStudioShotstack: Boolean(String(env.SHOTSTACK_API_KEY || "").trim()),
          videoStudioSigning: Boolean(String(env.VIDEO_STUDIO_SIGNING_SECRET || "").trim()),
          videoStudioShotstackHost: String(env.SHOTSTACK_HOST || "https://api.shotstack.io/edit/stage"),
          scheduler: "ready"
        }, cors);
      }

      // DAR KI-Video-Studio (Admin only; approve = no visitor push)
      if (url.pathname.startsWith("/api/admin/video-studio")) {
        assertConfigured(env);
        const videoResponse = await handleVideoStudioRequest(request, env, ctx, {
          cors,
          assertAuthorized,
          helpers: { githubGet, githubPut, githubCommitBatch, base64ToUtf8, utf8ToBase64 }
        });
        if (videoResponse) return videoResponse;
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

      if (url.pathname === "/api/admin/feed-backgrounds/block" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await blockFeedBackgroundImage(env, helpers, input), cors);
      }

      if (url.pathname === "/api/admin/feed-backgrounds/cleanup" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const helpers = { githubGet, githubPut, githubCommitBatch, base64ToUtf8 };
        return json(await cleanupFeedBackgroundPool(env, helpers, { staging: Boolean(input?.staging) }), cors);
      }

      if (url.pathname === "/api/admin/zakat/prices/status" && request.method === "GET") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await getAdminZakatPriceStatus(env, { githubGet, base64ToUtf8 });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/zakat/prices/fetch" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await fetchAndStoreZakatPrices(env, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8
        }, { force: Boolean(input.force) });
        return json(result, cors, result.ok ? 200 : 503);
      }

      if (url.pathname === "/api/admin/zakat/prices/confirm" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await confirmManualZakatPrices(env, input, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8
        });
        return json(result, cors);
      }

      if (url.pathname === "/api/admin/zakat/prices" && request.method === "POST") {
        assertConfigured(env);
        assertAuthorized(request, env);
        const input = await request.json().catch(() => ({}));
        const result = await confirmManualZakatPrices(env, input, {
          githubGet,
          githubPut,
          githubCommitBatch,
          base64ToUtf8
        });
        return json(result, cors);
      }

      const publishPaths = new Set(["/publish", "/api/admin/publish"]);
      const stagingPaths = new Set(["/api/admin/staging/publish"]);
      const newsPaths = new Set(["/news", "/api/admin/news", "/publish-news", "/api/admin/publish-news"]);
      const newsDeletePaths = new Set(["/news/delete", "/api/admin/news/delete"]);
      const schedulePaths = new Set(["/schedule", "/api/admin/schedule"]);
      const schedulerPaths = new Set(["/run-scheduler", "/api/admin/run-scheduler"]);
      const telegramPaths = new Set([
        "/api/admin/telegram/preview",
        "/api/admin/telegram/test",
        "/api/admin/telegram/send",
        "/api/admin/telegram/status",
        "/api/admin/telegram/health",
        "/api/admin/telegram/route-last"
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
        "/api/admin/daily/save",
        "/api/admin/daily/run",
        "/api/admin/daily/test",
        "/api/admin/daily/preview"
      ]);
      const jummahPaths = new Set([
        "/api/admin/jummah/status",
        "/api/admin/jummah/test",
        "/api/admin/jummah/run"
      ]);
      const categoryLayoutPaths = new Set(["/api/admin/category-layout"]);
      const postCategoryPaths = new Set(["/api/admin/post/category"]);
      const postUpdatePaths = new Set(["/api/admin/post/update"]);
      const categoryRenamePaths = new Set(["/api/admin/category/rename"]);
      const bulkPublishPaths = new Set(["/api/admin/publish/bulk"]);

      if (![...publishPaths, ...stagingPaths, ...bulkPublishPaths, ...newsPaths, ...newsDeletePaths, ...schedulePaths, ...schedulerPaths, ...telegramPaths, ...pushPaths, ...prayerPaths, ...dailyPaths, ...jummahPaths, ...categoryLayoutPaths, ...postCategoryPaths, ...postUpdatePaths, ...categoryRenamePaths].includes(url.pathname)) {
        return json({ ok: false, error: "Not found" }, cors, 404);
      }

      if (url.pathname === "/api/admin/telegram/health") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        let registry = { posts: {} };
        try { registry = await readTelegramPostsRegistry(env); } catch (_e) {}
        const posts = registry && registry.posts && typeof registry.posts === "object" ? registry.posts : {};
        return json({
          ok: true,
          service: "telegram-routing",
          hasTelegramToken: Boolean(telegramBotToken(env)),
          channel: telegramChannelId(env),
          topicsChatId: telegramTopicsChatId(env) || null,
          registryCount: Object.keys(posts).length,
          endpoints: [
            "/api/admin/telegram/health",
            "/api/admin/telegram/status",
            "/api/admin/telegram/preview",
            "/api/admin/telegram/test",
            "/api/admin/telegram/send",
            "/api/admin/telegram/route-last"
          ]
        }, cors);
      }
      if (url.pathname === "/api/admin/telegram/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const postId = String(url.searchParams.get("postId") || "").trim();
        const registry = await readTelegramPostsRegistry(env);
        return json({ ok: true, postId, status: postId ? registry.posts?.[postId] || null : registry }, cors);
      }
      if (url.pathname === "/api/admin/telegram/route-last") {
        if (request.method !== "GET" && request.method !== "POST") return json({ ok: false, error: "GET oder POST required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
        const result = await routeLatestTelegramChannelPost(env, { force: Boolean(body?.force) });
        return json(result, cors, result.ok ? 200 : 503);
      }

      if (url.pathname === "/api/admin/push/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const postId = String(url.searchParams.get("postId") || "").trim();
        const registry = await readPendingPushesRegistry(env);
        return json({ ok: true, postId, status: postId ? registry.pushes?.[postId] || null : registry }, cors);
      }

      if (url.pathname === "/api/admin/prayer/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await readPrayerPushStatus(env, githubGet, base64ToUtf8);
        return json(result, cors, result.ok ? 200 : 503);
      }

      if (url.pathname === "/api/admin/daily/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await readDailyPushStatus(env, githubGet, base64ToUtf8);
        return json(result, cors, 200);
      }

      if (url.pathname === "/api/admin/jummah/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await readJummahPushStatus(env, githubGet, base64ToUtf8);
        return json(result, cors, 200);
      }

      if (url.pathname === "/api/admin/daily/config") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await readDailyPushConfig(env, githubGet, base64ToUtf8);
        return json(result, cors, 200);
      }

      if (url.pathname === "/api/admin/daily/preview") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const kind = String(url.searchParams.get("kind") || "dua");
        const cfg = await readDailyPushConfig(env, githubGet, base64ToUtf8);
        return json({ ok: true, preview: buildDailyPushPreview(cfg.config || {}, kind) }, cors);
      }

      if (request.method !== "POST") {
        return json({ ok: false, error: "POST required" }, cors, 405);
      }

      assertConfigured(env);
      assertAuthorized(request, env);

      const input = await request.json().catch(() => ({}));

      if (telegramPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/preview")) {
          return json(buildTelegramPreviewResponse(env, input), cors);
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
        if (url.pathname.endsWith("/test")) {
          return json(await sendPrayerTestPush(env, input), cors);
        }
        if (url.pathname.endsWith("/run")) {
          const result = await ensurePrayerSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true });
          return json(result, cors, result.ok === false ? 503 : 200);
        }
      }

      if (dailyPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/test")) {
          return json(await sendDailyTestPush(env, input), cors);
        }
        if (url.pathname.endsWith("/run")) {
          const result = await ensureDailyPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, { force: true });
          return json(result, cors, result.ok === false ? 503 : 200);
        }
        if (url.pathname.endsWith("/save")) {
          const config = input.config || input;
          const sha = String(input.sha || "").trim() || undefined;
          await saveDailyPushConfig(env, config, sha, githubPut, utf8ToBase64);
          return json({ ok: true, saved: true }, cors);
        }
      }

      if (jummahPaths.has(url.pathname)) {
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

      if (stagingPaths.has(url.pathname)) {
        return json(await publishPostFromMarkdown(env, input, ctx, { staging: true }), cors);
      }

      if (categoryLayoutPaths.has(url.pathname)) {
        return json(await publishCategoryLayout(env, input), cors);
      }

      if (postCategoryPaths.has(url.pathname)) {
        return json(await updatePostCategory(env, input), cors);
      }

      if (postUpdatePaths.has(url.pathname)) {
        return json(await updateExistingPost(env, input), cors);
      }

      if (categoryRenamePaths.has(url.pathname)) {
        return json(await renameCategoryLabel(env, input), cors);
      }

      if (newsDeletePaths.has(url.pathname)) {
        return json(await deleteNewsUpdate(env, input), cors);
      }

      if (newsPaths.has(url.pathname)) {
        return json(await publishNewsUpdate(env, input), cors);
      }

      if (schedulePaths.has(url.pathname)) {
        return json(await saveScheduledPost(env, input), cors);
      }

      if (schedulerPaths.has(url.pathname)) {
        return json(await runScheduledPublishes(env), cors);
      }
    } catch (error) {
      return json({ ok: false, error: error.message || String(error) }, cors, error.status || 500);
    }
  },

  // PUSH_SYSTEM_GUARD: Cron alle 5 Min – Gebet + Tages-Push (wrangler.toml crons)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(ensureDailyPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64));
    ctx.waitUntil(runScheduledPublishes(env));
    try {
      await processAllPendingPushes(env);
    } catch (error) {
      console.error("processAllPendingPushes cron failed:", error?.message || error);
    }
    ctx.waitUntil(ensurePrayerSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64));
    ctx.waitUntil(ensureJummahPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64));
    ctx.waitUntil(ensureZakatPricesFresh(env, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }));
    ctx.waitUntil(ensureFeedBackgroundsFresh(env, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }, { staging: true }));
    ctx.waitUntil(resumeStuckVideoStudioJobs(env, { githubGet, githubPut, githubCommitBatch, base64ToUtf8, utf8ToBase64 }));
    ctx.waitUntil(routeLatestTelegramChannelPost(env, { silent: true }));
  }
};

async function fetchPostNumberInfo(env) {
  const indexData = await readPostsIndex(env);
  const files = listPostFiles(indexData.files);
  const postCount = files.length;
  const nextNumber = nextPostNumber(files);
  const lastFilename = resolveLastPostFilename(files, postCount);
  const lastSerial = postFileSerial(lastFilename);
  const duplicateGlobal = files.filter((f) => globalPostSerial(typeof f === "string" ? f : f.name) === postCount).length > 1;
  return {
    postCount,
    nextNumber,
    maxSerial: maxPostNumber(files),
    lastFilename,
    lastSerial,
    duplicateGlobal,
    serialMismatch: Boolean(lastFilename && lastSerial > 0 && lastSerial !== postCount),
    indexPath: `${trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR)}/posts-index.json`
  };
}

async function readPostsIndex(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const indexPath = `${postsDir}/posts-index.json`;
  const indexFile = await githubGet(env, owner, repo, indexPath, branch);
  return indexFile?.content ? JSON.parse(base64ToUtf8(indexFile.content)) : { version: 1, files: [] };
}

function listPostFiles(files) {
  return (Array.isArray(files) ? files : []).filter((file) => file && (file.name || typeof file === "string"));
}

/* SOURCE FILES GUARD FINAL: PDF/Bild-Upload nach assets/sources/ mit Markdown-Links */

function sourceExtension(pathOrName) {
  const base = String(pathOrName || "").split("/").pop() || "";
  const ext = base.includes(".") ? base.split(".").pop().toLowerCase() : "";
  return ext;
}

function isAllowedSourceExtension(ext) {
  return SOURCE_ALLOWED_EXT.has(String(ext || "").toLowerCase());
}

function estimateBase64Bytes(base64) {
  const clean = String(base64 || "").replace(/\s+/g, "");
  if (!clean) return 0;
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function normalizeSourceFilesInput(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i] || {};
    const path = trimSlashes(String(item.path || "").trim());
    const contentBase64 = String(item.contentBase64 || item.base64 || "").replace(/\s+/g, "");
    if (!path || !contentBase64) throw httpError(`Quellen-Datei ${i + 1}: Pfad oder Inhalt fehlt`, 400);
    if (!path.startsWith("assets/sources/")) throw httpError(`Quellen-Datei ${i + 1}: Pfad muss mit assets/sources/ beginnen`, 400);
    const ext = sourceExtension(path);
    if (!isAllowedSourceExtension(ext)) throw httpError(`Quellen-Datei ${i + 1}: Dateityp .${ext} nicht erlaubt`, 400);
    const bytes = estimateBase64Bytes(contentBase64);
    if (bytes <= 0) throw httpError(`Quellen-Datei ${i + 1}: leer oder ungültig`, 400);
    if (bytes > SOURCE_MAX_BYTES) throw httpError(`Quellen-Datei ${i + 1}: maximal ${Math.round(SOURCE_MAX_BYTES / (1024 * 1024))} MB`, 400);
    out.push({ path, contentBase64, binary: true });
  }
  return out;
}

function normalizeFeedImageFilesInput(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i] || {};
    const path = trimSlashes(String(item.path || "").trim());
    const contentBase64 = String(item.contentBase64 || item.base64 || "").replace(/\s+/g, "");
    if (!path || !contentBase64) throw httpError(`Feed-Bild ${i + 1}: Pfad oder Inhalt fehlt`, 400);
    if (!path.startsWith("assets/posts/")) throw httpError(`Feed-Bild ${i + 1}: Pfad muss mit assets/posts/ beginnen`, 400);
    if (!/\/feed-(original|preview)\.(jpe?g|png|webp)$/i.test(path)) {
      throw httpError(`Feed-Bild ${i + 1}: nur feed-original.* oder feed-preview.jpg erlaubt`, 400);
    }
    const bytes = estimateBase64Bytes(contentBase64);
    if (bytes <= 0) throw httpError(`Feed-Bild ${i + 1}: leer oder ungültig`, 400);
    if (bytes > SOURCE_MAX_BYTES) throw httpError(`Feed-Bild ${i + 1}: maximal ${Math.round(SOURCE_MAX_BYTES / (1024 * 1024))} MB`, 400);
    out.push({ path, contentBase64, binary: true });
  }
  return out;
}

async function prepareFeedImageCommitEntries(env, owner, repo, branch, feedImageFiles) {
  const entries = [];
  for (const file of feedImageFiles) {
    entries.push({ path: file.path, contentBase64: file.contentBase64, binary: true });
  }
  return entries;
}

async function githubListRepoTreePaths(env, owner, repo, branch) {
  const refSha = await githubGetRefSha(env, owner, repo, branch);
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${refSha}?recursive=1`, {
    headers: githubHeaders(env)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub tree Fehler ${res.status}`, res.status);
  return (Array.isArray(data.tree) ? data.tree : [])
    .filter((item) => item.type === "blob" && item.path)
    .map((item) => String(item.path));
}

async function scanSourceUsageInPosts(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const sourcesDir = trimSlashes(env.SOURCES_DIR || DEFAULT_SOURCES_DIR);
  let paths = [];
  try {
    paths = await githubListRepoTreePaths(env, owner, repo, branch);
  } catch (error) {
    return { map: {}, warning: String(error.message || error) };
  }
  const postPaths = paths.filter((p) => p.startsWith(`${postsDir}/`) && p.endsWith(".md"));
  const usageMap = {};
  const sourceRe = new RegExp(`(?:/|\\b)(${sourcesDir.replace(/\//g, "\\/")}\\/[^"'\\s#]+\\.(?:pdf|png|jpe?g|webp))`, "gi");
  for (const postPath of postPaths) {
    try {
      const file = await githubGet(env, owner, repo, postPath, branch);
      if (!file?.content) continue;
      const markdown = base64ToUtf8(file.content);
      const filename = postPath.split("/").pop() || postPath;
      const postId = frontmatterValue(markdown, "id") || filename.replace(/\.md$/i, "");
      let match;
      while ((match = sourceRe.exec(markdown))) {
        const path = match[1].replace(/^\/+/, "");
        if (!usageMap[path]) usageMap[path] = [];
        const slideMatch = markdown.slice(0, match.index).match(/^\s{2,}-\s/gm);
        const slideIndex = slideMatch ? Math.max(0, slideMatch.length - 1) : null;
        usageMap[path].push({
          filename,
          postId,
          slide: slideIndex != null && /slides:/i.test(markdown) ? slideIndex + 1 : null
        });
      }
    } catch (e) {
      /* skip single post */
    }
  }
  return { map: usageMap };
}

async function listSourceFiles(env, options = {}) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const sourcesDir = trimSlashes(env.SOURCES_DIR || DEFAULT_SOURCES_DIR);
  let paths = [];
  try {
    paths = await githubListRepoTreePaths(env, owner, repo, branch);
  } catch (error) {
    return { ok: true, files: [], sourcesDir, warning: String(error.message || error) };
  }
  let usageMap = {};
  if (options.withUsage) {
    const scanned = await scanSourceUsageInPosts(env);
    usageMap = scanned.map || {};
  }
  const files = paths
    .filter((path) => path.startsWith(`${sourcesDir}/`) && isAllowedSourceExtension(sourceExtension(path)))
    .map((path) => {
      const parts = path.split("/");
      const name = parts.pop() || path;
      const rel = parts.slice(2);
      const scholar = rel.length >= 2 ? rel[0] : "";
      const book = rel.length >= 3 ? rel[1] : "";
      const ext = sourceExtension(name);
      const usage = usageMap[path] || [];
      return {
        path,
        name,
        scholar: scholar && scholar !== "sources" ? scholar : "",
        book: book || "",
        type: ext === "pdf" ? "PDF" : "Bild",
        url: `/${path}`,
        usage,
        usedInPosts: [...new Set(usage.map((u) => u.filename))].length
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path, "de"));
  return { ok: true, files, sourcesDir, count: files.length };
}

async function prepareSourceCommitEntries(env, owner, repo, branch, sourceFiles) {
  const entries = [];
  for (const file of sourceFiles) {
    const existing = await githubGet(env, owner, repo, file.path, branch);
    if (existing?.content) throw httpError(`Quellen-Datei existiert bereits: ${file.path}`, 409);
    entries.push({ path: file.path, contentBase64: file.contentBase64, binary: true });
  }
  return entries;
}

/* PUBLISH ISOLATION GUARD FINAL: atomic Git commits, bulk publish, deferred live checks */

async function publishPostFromMarkdown(env, input, ctx, options = {}) {
  const markdownRaw = String(input.markdown || "").trim();
  let filename = String(input.filename || "").trim();

  if (!markdownRaw) throw httpError("Markdown fehlt", 400);

  const enforceShortlink = input.enforceShortlink === true && !staging;
  if (enforceShortlink) {
    const { registry } = await readShortlinksRegistry(env, githubGet, base64ToUtf8);
    const shortCheck = validatePostShortlinkForPublish(markdownRaw, registry);
    if (!shortCheck.ok) throw httpError(shortCheck.message || shortCheck.errors?.[0] || "Quellenlink unvollständig", 400);
  }

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const staging = Boolean(options.staging || input.staging);
  const postsDir = trimSlashes(staging ? (env.STAGING_POSTS_DIR || DEFAULT_STAGING_POSTS_DIR) : (env.POSTS_DIR || DEFAULT_POSTS_DIR));
  const indexPath = `${postsDir}/posts-index.json`;

  if (!staging) {
    const health = await checkVisitorSiteHealth(env);
    if (!health.ok) {
      console.warn("Visitor site degraded during publish:", health.issues.join(" · "));
    }
  }

  const indexFile = await githubGet(env, owner, repo, indexPath, branch);
  const indexData = indexFile?.content ? JSON.parse(base64ToUtf8(indexFile.content)) : { version: 1, files: [] };
  const files = listPostFiles(indexData.files);
  const duplicate = findDuplicateByTitleSlug(files, markdownRaw);
  if (duplicate) {
    throw httpError(`Möglicher Duplikat-Beitrag: „${duplicate}“ hat bereits einen ähnlichen Titel.`, 409);
  }

  const deletedRegistry = await readDeletedPostsRegistry(env);
  assertNotDeletedPost(markdownRaw, deletedRegistry);

  const nextNumber = nextPostNumber(files);

  if (!filename) {
    filename = suggestFilename(markdownRaw, nextNumber);
  } else if (/(?:^|-)\d{3}(?=-|\.md$)/.test(filename)) {
    filename = filename.replace(/(^|-)\d{3}(?=-|\.md$)/, `$1${String(nextNumber).padStart(3, "0")}`);
  }

  filename = sanitizeFilename(filename);
  const markdown = normalizeMarkdownForUpload(markdownRaw, nextNumber);
  const postPath = `${postsDir}/${filename}`;
  const sourceFiles = normalizeSourceFilesInput(input.sourceFiles || []);
  const feedImageFiles = normalizeFeedImageFilesInput(input.feedImageFiles || []);

  const existing = await githubGet(env, owner, repo, postPath, branch);
  if (existing) throw httpError(`Diese Datei existiert schon: ${filename}`, 409);

  const postBlobSha = await githubCreateBlob(env, owner, repo, markdown);
  const nextFiles = files.filter((file) => file.name !== filename);
  nextFiles.push({ name: filename, sha: postBlobSha });
  nextFiles.sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));

  const payload = {
    version: Number(indexData.version || 1),
    generated: new Date().toISOString(),
    count: nextFiles.length,
    files: nextFiles
  };
  const indexContent = `${JSON.stringify(payload, null, 2)}\n`;
  const sourceEntries = sourceFiles.length
    ? await prepareSourceCommitEntries(env, owner, repo, branch, sourceFiles)
    : [];
  const feedImageEntries = feedImageFiles.length
    ? await prepareFeedImageCommitEntries(env, owner, repo, branch, feedImageFiles)
    : [];
  const previewEntry = !staging ? postPreviewEntry(env, markdown, frontmatterValue(markdown, "id")) : null;
  const batchCommit = await githubCommitBatch(
    env,
    owner,
    repo,
    branch,
    [
      { path: postPath, content: markdown, sha: postBlobSha },
      ...sourceEntries,
      ...feedImageEntries,
      ...(previewEntry ? [previewEntry] : []),
      { path: indexPath, content: indexContent }
    ],
    feedImageEntries.length
      ? `Add post ${filename} + feed image(s)`
      : sourceEntries.length
        ? `Add post ${filename} + ${sourceEntries.length} source file(s)`
        : `Add post ${filename}`
  );
  const created = { content: { sha: postBlobSha }, commit: { sha: batchCommit.commitSha } };
  const updatedIndex = { commit: { sha: batchCommit.commitSha } };
  const uploadedSources = sourceEntries.map((entry) => entry.path);
  const uploadedFeedImages = feedImageEntries.map((entry) => entry.path);

  const postTitle = frontmatterValue(markdown, "title") || "Neuer Beitrag";
  const postId = frontmatterValue(markdown, "id");
  const publishedAt = new Date().toISOString();
  if (staging) {
    return {
      ok: true,
      staging: true,
      filename,
      number: nextNumber,
      postCount: nextFiles.length,
      postPath,
      indexPath,
      commitSha: updatedIndex.commit?.sha || created.commit?.sha || "",
      postId,
      publishedAt,
      previewUrl: `${siteOrigin(env)}/?env=staging&refresh=${Date.now()}#post/${encodeURIComponent(postId || filename.replace(/\.md$/i, ""))}`,
      push: { sent: false, skipped: true, staging: true, reason: "Staging sendet keine Besucher-Pushs." },
      telegram: { sent: false, skipped: true, staging: true },
      sourceFiles: uploadedSources
    };
  }
  const liveCheck = {
    ok: false,
    pending: true,
    deferred: true,
    diagnosis: "Live-Prüfung läuft im Hintergrund",
    attempts: 0
  };
  let push;
  const skipPush = Boolean(input.skipPush || options.skipPush);
  if (skipPush) {
    push = {
      sent: false,
      skipped: true,
      reason: "Push übersprungen (Sammelveröffentlichung)",
      liveCheck
    };
  } else {
    const pendingRecord = {
      postId,
      filename,
      postTitle,
      publishedAt,
      postPath,
      status: "pending",
      createdAt: publishedAt,
      pushApproved: true,
      pushApprovedAt: publishedAt,
      lastError: "Push wartet auf Live-Verfügbarkeit"
    };
    if (postId) await writePendingPushStatus(env, postId, pendingRecord);
    push = {
      sent: false,
      pending: true,
      reason: "Push wird im Hintergrund nach Live-Prüfung gesendet.",
      waitingForLive: true,
      liveCheck,
      targetUrl: buildPostPushUrl(env, postId, Date.now())
    };
    if (ctx && postId) {
      ctx.waitUntil((async () => {
        // Regel: Push erst wenn Index+Datei öffentlich online – dann sofort; sonst reparieren bis es klappt.
        let result = await processPendingPushUntilLive(env, pendingRecord, { schedule: "quick" });
        if (!result.sent && result.pending) {
          result = await processPendingPushUntilLive(env, pendingRecord, { schedule: "cron" });
        }
        if (!result.sent && result.pending) {
          await processPendingPushUntilLive(env, pendingRecord, { schedule: "full" });
        }
      })());
    }
  }

  let telegram = { sent: false, skipped: true, status: "not_sent" };
  if (input.telegram?.enabled) {
    telegram = await sendTelegramPost(env, {
      markdown,
      postId,
      mode: input.telegram.mode || "text",
      imageBase64: input.telegram.imageBase64 || "",
      forceResend: Boolean(input.telegram.forceResend)
    });
  }

  return {
    ok: true,
    filename,
    number: nextNumber,
    postCount: nextFiles.length,
    postPath,
    indexPath,
    commitSha: updatedIndex.commit?.sha || created.commit?.sha || "",
    postId,
    publishedAt,
    liveCheck,
    push,
    telegram,
    sourceFiles: uploadedSources
  };
}

async function publishBulkPostsFromMarkdown(env, input, ctx, options = {}) {
  const rawPosts = Array.isArray(input.posts) ? input.posts : [];
  if (!rawPosts.length) throw httpError("Keine Beiträge im Sammel-Paket", 400);
  if (rawPosts.length > 25) throw httpError("Maximal 25 Beiträge pro Sammel-Paket", 400);

  const staging = Boolean(options.staging || input.staging);
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(staging ? (env.STAGING_POSTS_DIR || DEFAULT_STAGING_POSTS_DIR) : (env.POSTS_DIR || DEFAULT_POSTS_DIR));
  const indexPath = `${postsDir}/posts-index.json`;

  const indexFile = await githubGet(env, owner, repo, indexPath, branch);
  const indexData = indexFile?.content ? JSON.parse(base64ToUtf8(indexFile.content)) : { version: 1, files: [] };
  let files = listPostFiles(indexData.files);
  let nextNumber = nextPostNumber(files);
  const deletedRegistry = await readDeletedPostsRegistry(env);
  const existingNames = new Set(files.map((f) => String(f.name || "").trim()).filter(Boolean));
  const published = [];
  const commitEntries = [];
  const blobEntries = [];

  for (let i = 0; i < rawPosts.length; i++) {
    const item = rawPosts[i];
    const markdownRaw = String((item && item.markdown) || item || "").trim();
    if (!markdownRaw) throw httpError(`Beitrag ${i + 1}: Markdown fehlt`, 400);
    const duplicate = findDuplicateByTitleSlug(files, markdownRaw);
    if (duplicate) throw httpError(`Beitrag ${i + 1}: mögliches Duplikat „${duplicate}“`, 409);
    assertNotDeletedPost(markdownRaw, deletedRegistry);

    let filename = String(item?.filename || "").trim();
    if (filename) {
      filename = sanitizeFilename(filename);
    } else {
      filename = suggestFilename(markdownRaw, nextNumber);
    }
    if (existingNames.has(filename)) throw httpError(`Beitrag ${i + 1}: Datei existiert bereits (${filename})`, 409);

    const markdown = normalizeMarkdownForUpload(markdownRaw, nextNumber);
    const postPath = `${postsDir}/${filename}`;
    const postBlobSha = await githubCreateBlob(env, owner, repo, markdown);
    const postId = frontmatterValue(markdown, "id");
    const postTitle = frontmatterValue(markdown, "title") || "Neuer Beitrag";
    const previewEntry = !staging ? postPreviewEntry(env, markdown, postId) : null;

    blobEntries.push({ path: postPath, content: markdown, sha: postBlobSha });
    if (previewEntry) blobEntries.push(previewEntry);
    files = files.filter((file) => file.name !== filename);
    files.push({ name: filename, sha: postBlobSha });
    existingNames.add(filename);
    published.push({
      filename,
      number: nextNumber,
      postId,
      postTitle,
      postPath
    });
    nextNumber += 1;
  }

  files.sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));
  const indexContent = `${JSON.stringify({
    version: Number(indexData.version || 1),
    generated: new Date().toISOString(),
    count: files.length,
    files
  }, null, 2)}\n`;
  commitEntries.push(...blobEntries, { path: indexPath, content: indexContent });

  const batchCommit = await githubCommitBatch(
    env,
    owner,
    repo,
    branch,
    commitEntries,
    `Bulk publish ${published.length} posts`
  );

  const publishedAt = new Date().toISOString();
  const lastPost = published[published.length - 1];
  const liveCheck = {
    ok: false,
    pending: true,
    deferred: true,
    diagnosis: "Live-Prüfung läuft im Hintergrund",
    attempts: 0
  };

  let push = { sent: false, skipped: true, reason: "Kein Push angefordert", liveCheck };
  const skipPush = Boolean(input.skipPush || options.skipPush);
  if (!staging && !skipPush && lastPost?.postId) {
    const pendingRecord = {
      postId: lastPost.postId,
      filename: lastPost.filename,
      postTitle: lastPost.postTitle,
      publishedAt,
      postPath: lastPost.postPath,
      status: "pending",
      createdAt: publishedAt,
      pushApproved: true,
      pushApprovedAt: publishedAt,
      lastError: "Push wartet auf Live-Verfügbarkeit"
    };
    await writePendingPushStatus(env, lastPost.postId, pendingRecord);
    push = {
      sent: false,
      pending: true,
      reason: `Push für letzten Beitrag (${published.length} gesamt) wird im Hintergrund gesendet.`,
      waitingForLive: true,
      liveCheck,
      targetUrl: buildPostPushUrl(env, lastPost.postId, Date.now())
    };
    if (ctx) {
      ctx.waitUntil((async () => {
        let result = await processPendingPushUntilLive(env, pendingRecord, { schedule: "quick" });
        if (!result.sent && result.pending) {
          result = await processPendingPushUntilLive(env, pendingRecord, { schedule: "cron" });
        }
        if (!result.sent && result.pending) {
          await processPendingPushUntilLive(env, pendingRecord, { schedule: "full" });
        }
      })());
    }
  } else if (skipPush) {
    push = { sent: false, skipped: true, reason: "Push übersprungen", liveCheck };
  }

  return {
    ok: true,
    bulk: true,
    count: published.length,
    published,
    postCount: files.length,
    indexPath,
    commitSha: batchCommit.commitSha,
    publishedAt,
    liveCheck,
    push
  };
}

async function fetchPostMarkdown(env, filename) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const postPath = `${postsDir}/${filename}`;
  const file = await githubGet(env, owner, repo, postPath, branch);
  if (!file?.content) throw httpError(`Beitrag nicht gefunden: ${filename}`, 404);
  const markdown = base64ToUtf8(file.content);
  return {
    ok: true,
    filename,
    markdown,
    sha: file.sha || "",
    postPath,
    title: frontmatterValue(markdown, "title") || filename,
    category: frontmatterValue(markdown, "category") || "",
    postId: frontmatterValue(markdown, "id") || ""
  };
}

async function updateExistingPost(env, input) {
  const filename = sanitizeFilename(String(input.filename || "").trim());
  const markdown = normalizeMarkdownForStorage(String(input.markdown || "").trim());
  const sha = String(input.sha || "").trim();
  const skipPush = input.skipPush !== false;
  const sourceFiles = normalizeSourceFilesInput(input.sourceFiles || []);
  const feedImageFiles = normalizeFeedImageFilesInput(input.feedImageFiles || []);

  if (!filename) throw httpError("Dateiname fehlt", 400);
  if (!markdown) throw httpError("Markdown fehlt", 400);

  const enforceShortlink = input.enforceShortlink === true;
  if (enforceShortlink) {
    const { registry } = await readShortlinksRegistry(env, githubGet, base64ToUtf8);
    const shortCheck = validatePostShortlinkForPublish(markdown, registry);
    if (!shortCheck.ok) throw httpError(shortCheck.message || shortCheck.errors?.[0] || "Quellenlink unvollständig", 400);
  }

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const postPath = `${postsDir}/${filename}`;
  const existing = await githubGet(env, owner, repo, postPath, branch);
  if (!existing?.content) throw httpError(`Beitrag nicht gefunden: ${filename}`, 404);
  if (sha && existing.sha && sha !== existing.sha) {
    throw httpError("Datei wurde zwischenzeitlich geändert — bitte neu laden", 409);
  }

  let commitSha = "";
  const sourceEntries = sourceFiles.length
    ? await prepareSourceCommitEntries(env, owner, repo, branch, sourceFiles)
    : [];
  const feedImageEntries = feedImageFiles.length
    ? await prepareFeedImageCommitEntries(env, owner, repo, branch, feedImageFiles)
    : [];
  const previewEntry = postPreviewEntry(env, markdown, frontmatterValue(markdown, "id"));
  const extraEntries = [...sourceEntries, ...feedImageEntries, ...(previewEntry ? [previewEntry] : [])];
  if (extraEntries.length) {
    const batch = await githubCommitBatch(
      env,
      owner,
      repo,
      branch,
      [{ path: postPath, content: markdown }, ...extraEntries],
      feedImageEntries.length
        ? `Update post ${filename} + feed image(s)`
        : `Update post ${filename} + ${sourceEntries.length} source file(s)`
    );
    commitSha = batch.commitSha || "";
  } else {
    const batch = await githubCommitBatch(
      env,
      owner,
      repo,
      branch,
      [{ path: postPath, content: markdown }, ...extraEntries],
      `Update post ${filename}`
    );
    commitSha = batch.commitSha || "";
  }

  return {
    ok: true,
    filename,
    postPath,
    commitSha,
    sourceFiles: sourceFiles.map((file) => file.path),
    feedImageFiles: feedImageFiles.map((file) => file.path),
    postId: frontmatterValue(markdown, "id") || "",
    push: { sent: false, skipped: skipPush, reason: skipPush ? "Korrektur ohne Push" : "Push nicht angefordert" }
  };
}

async function publishCategoryLayout(env, input) {
  const main = Array.isArray(input.main) ? input.main.map((x) => String(x || "").trim()).filter(Boolean) : [];
  const order = Array.isArray(input.order) ? input.order.map((x) => String(x || "").trim()).filter(Boolean) : [];
  if (!order.length) throw httpError("Kategorie-Reihenfolge (order) fehlt", 400);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const layoutPath = trimSlashes(env.CATEGORY_LAYOUT_PATH || "content/admin/category-layout.json");
  const file = await githubGet(env, owner, repo, layoutPath, branch);
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    main,
    order
  };
  const saved = await githubPut(
    env,
    owner,
    repo,
    layoutPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    "Update category layout",
    branch,
    file?.sha
  );
  return {
    ok: true,
    layoutPath,
    mainCount: main.length,
    orderCount: order.length,
    commitSha: saved.commit?.sha || ""
  };
}

function applyCategoryToMarkdown(markdown, category) {
  const cat = String(category || "").trim();
  if (!cat) return String(markdown || "").trim();
  let out = String(markdown || "").trim();
  const safe = cat.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (/^category:\s/m.test(out)) return out.replace(/^category:\s*["']?.*?["']?\s*$/m, `category: "${safe}"`);
  if (/^---\s*\n/.test(out)) return out.replace(/^---\s*\n/, `---\ncategory: "${safe}"\n`);
  return `---\ncategory: "${safe}"\n---\n\n${out}`;
}

function categoryLabelKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u02bf\u02be\u2018\u2019'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryMatchesRenameFrom(current, fromLabel) {
  const fromKey = categoryLabelKey(fromLabel);
  const currentKey = categoryLabelKey(current);
  if (currentKey === fromKey) return true;
  const legacyByTarget = {
    [categoryLabelKey("Makan الله")]: [
      categoryLabelKey("makan allah github posts final"),
      categoryLabelKey("makan allah github post final")
    ]
  };
  const legacy = legacyByTarget[fromKey];
  return Array.isArray(legacy) && legacy.includes(currentKey);
}

async function updatePostCategory(env, input) {
  const filename = sanitizeFilename(String(input.filename || "").trim());
  const category = String(input.category || "").trim();
  if (!filename) throw httpError("Dateiname fehlt", 400);
  if (!category) throw httpError("Ziel-Kategorie fehlt", 400);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const postPath = `${postsDir}/${filename}`;
  const file = await githubGet(env, owner, repo, postPath, branch);
  if (!file?.content) throw httpError(`Beitrag nicht gefunden: ${filename}`, 404);

  const markdown = applyCategoryToMarkdown(base64ToUtf8(file.content), category);
  const saved = await githubPut(
    env,
    owner,
    repo,
    postPath,
    markdown,
    `Move ${filename} to category ${category}`,
    branch,
    file.sha
  );
  return {
    ok: true,
    filename,
    category,
    postPath,
    commitSha: saved.commit?.sha || ""
  };
}

const RENAME_CATEGORY_BATCH = 10;

async function renameCategoryLabel(env, input) {
  const fromLabel = String(input.fromLabel || "").trim();
  const toLabel = String(input.toLabel || "").trim();
  if (!fromLabel || !toLabel) throw httpError("Alter und neuer Ordnername fehlen", 400);
  if (categoryLabelKey(fromLabel) === categoryLabelKey(toLabel)) {
    throw httpError("Neuer Name ist identisch mit dem alten", 400);
  }

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const layoutPath = trimSlashes(env.CATEGORY_LAYOUT_PATH || "content/admin/category-layout.json");
  const offset = Math.max(0, Number(input.offset || 0) || 0);
  const fromKey = categoryLabelKey(fromLabel);

  let targetNames = Array.isArray(input.filenames)
    ? input.filenames.map((name) => sanitizeFilename(String(name || "").trim())).filter(Boolean)
    : [];
  if (!targetNames.length && offset === 0) {
    targetNames = await githubSearchPostFilenamesByCategory(env, owner, repo, fromLabel, postsDir);
  }
  const batchNames = targetNames.slice(offset, offset + RENAME_CATEGORY_BATCH);

  const layoutFile = offset === 0 ? await githubGet(env, owner, repo, layoutPath, branch) : null;
  const layoutData = layoutFile?.content
    ? JSON.parse(base64ToUtf8(layoutFile.content))
    : { version: 1, main: [], order: [] };
  const mapLabel = (label) => (categoryLabelKey(label) === fromKey ? toLabel : label);
  const main = (Array.isArray(layoutData.main) ? layoutData.main : []).map(mapLabel);
  let order = (Array.isArray(layoutData.order) ? layoutData.order : []).map(mapLabel);
  if (!order.some((x) => categoryLabelKey(x) === categoryLabelKey(toLabel))) order.push(toLabel);

  const commitEntries = [];
  if (offset === 0) {
    commitEntries.push({
      path: layoutPath,
      content: `${JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), main, order }, null, 2)}\n`
    });
  }

  let updatedPosts = 0;
  for (const name of batchNames) {
    const postPath = `${postsDir}/${name}`;
    const postFile = await githubGet(env, owner, repo, postPath, branch);
    if (!postFile?.content) continue;
    const markdown = base64ToUtf8(postFile.content);
    const current = frontmatterValue(markdown, "category");
    if (!categoryMatchesRenameFrom(current, fromLabel)) continue;
    commitEntries.push({ path: postPath, content: applyCategoryToMarkdown(markdown, toLabel) });
    updatedPosts += 1;
  }

  if (!commitEntries.length) {
    throw httpError(offset === 0 && !batchNames.length ? "Keine Beiträge für diesen Ordner gefunden" : "Keine Änderungen in diesem Batch", 400);
  }

  const batchCommit = await githubCommitBatch(
    env,
    owner,
    repo,
    branch,
    commitEntries,
    offset === 0
      ? `Rename category ${fromLabel} -> ${toLabel} (batch ${updatedPosts})`
      : `Rename category ${fromLabel} -> ${toLabel} (continued +${updatedPosts})`
  );

  const nextOffset = offset + batchNames.length;
  const done = nextOffset >= targetNames.length;

  return {
    ok: true,
    fromLabel,
    toLabel,
    updatedPosts,
    updatedThisBatch: updatedPosts,
    totalTargets: targetNames.length,
    processed: nextOffset,
    nextOffset: done ? null : nextOffset,
    done,
    layoutPath,
    commitSha: batchCommit.commitSha
  };
}

async function githubSearchPostFilenamesByCategory(env, owner, repo, categoryLabel, postsDir) {
  const safe = String(categoryLabel || "").replace(/"/g, "");
  const queries = [
    `category: ${safe}`,
    `category: "${safe}"`,
    `category: '${safe}'`
  ];
  const found = new Set();
  for (const needle of queries) {
    const q = encodeURIComponent(`repo:${owner}/${repo} ${needle} in:file path:${postsDir}`);
    const res = await fetch(`https://api.github.com/search/code?q=${q}&per_page=100`, { headers: githubHeaders(env) });
    if (!res.ok) continue;
    const data = await res.json().catch(() => ({}));
    for (const item of data.items || []) {
      const name = String(item.path || "").split("/").pop();
      if (name.endsWith(".md")) found.add(name);
    }
  }
  return [...found].sort((a, b) => a.localeCompare(b, "de"));
}

async function publishNewsUpdate(env, input) {
  const title = String(input.title || "").trim();
  const text = String(input.text || input.description || "").trim();
  if (!title || !text) throw httpError("News-Titel und Text fehlen", 400);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const updatesPath = trimSlashes(env.UPDATES_PATH || DEFAULT_UPDATES_PATH);
  const file = await githubGet(env, owner, repo, updatesPath, branch);
  const current = file?.content ? JSON.parse(base64ToUtf8(file.content)) : { items: [] };
  const items = Array.isArray(current) ? current : Array.isArray(current.items) ? current.items : [];
  const now = new Date();
  const ttlHours = Number(input.ttlHours || input.hours || 24);
  const id = sanitizeUpdateId(input.id || `${slugify(title)}-${now.toISOString().slice(0, 10)}`);
  const item = {
    id,
    type: input.type || "news",
    title,
    text,
    badge: input.badge || "News",
    count: Number(input.count || 0) || undefined,
    nav: input.nav || "recent",
    value: input.value || "",
    createdAt: now.toISOString(),
    ttlHours: Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24,
    visible: input.visible === false ? false : true
  };
  const freshItems = items
    .filter((entry) => entry && entry.id !== id)
    .filter((entry) => {
      const expires = Date.parse(entry.expiresAt || "");
      if (Number.isFinite(expires)) return expires > Date.now();
      const created = Date.parse(entry.createdAt || entry.date || entry.publishedAt || "");
      if (!Number.isFinite(created)) return true;
      const ttl = Number(entry.ttlHours || 24);
      return Date.now() - created <= ttl * 60 * 60 * 1000;
    });
  freshItems.unshift(item);
  const payload = { items: freshItems.slice(0, 20) };
  const saved = await githubPut(
    env,
    owner,
    repo,
    updatesPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Publish news update ${id}`,
    branch,
    file?.sha
  );

  let push = { sent: false, skipped: true, reason: "Push übersprungen" };
  if (input.skipPush !== true) {
    push = await sendNewsPush(env, {
      newsId: id,
      title,
      text,
      nav: item.nav,
      value: item.value || ""
    });
  }

  return { ok: true, id, updatesPath, commitSha: saved.commit?.sha || "", push };
}

async function deleteNewsUpdate(env, input) {
  const id = String(input.id || "").trim();
  if (!id) throw httpError("News-ID fehlt", 400);
  const hard = Boolean(input.hard);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const updatesPath = trimSlashes(env.UPDATES_PATH || DEFAULT_UPDATES_PATH);
  const file = await githubGet(env, owner, repo, updatesPath, branch);
  const current = file?.content ? JSON.parse(base64ToUtf8(file.content)) : { items: [] };
  const items = Array.isArray(current) ? current : Array.isArray(current.items) ? current.items : [];
  const found = items.find((entry) => entry && String(entry.id) === id);
  if (!found) throw httpError(`News nicht gefunden: ${id}`, 404);

  const nextItems = hard
    ? items.filter((entry) => entry && String(entry.id) !== id)
    : items.map((entry) => {
        if (!entry || String(entry.id) !== id) return entry;
        return {
          ...entry,
          status: "removed",
          visible: false,
          removedAt: new Date().toISOString()
        };
      });

  const payload = { items: nextItems.slice(0, 20) };
  const saved = await githubPut(
    env,
    owner,
    repo,
    updatesPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    hard ? `Delete news ${id}` : `Remove news ${id}`,
    branch,
    file?.sha
  );

  return {
    ok: true,
    id,
    hard,
    removed: true,
    updatesPath,
    commitSha: saved.commit?.sha || ""
  };
}

async function saveScheduledPost(env, input) {
  const markdown = String(input.markdown || "").trim();
  const when = String(input.when || input.publishAt || "").trim();
  const title = String(input.title || frontmatterValue(markdown, "title") || "").trim();
  if (!markdown) throw httpError("Markdown fehlt für geplanten Beitrag", 400);
  if (!when) throw httpError("Veröffentlichungszeit fehlt", 400);
  if (!Date.parse(when)) throw httpError("Veröffentlichungszeit ist ungültig", 400);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const schedulePath = trimSlashes(env.SCHEDULE_PATH || DEFAULT_SCHEDULE_PATH);
  const file = await githubGet(env, owner, repo, schedulePath, branch);
  const current = file?.content ? JSON.parse(base64ToUtf8(file.content)) : { items: [] };
  const items = Array.isArray(current) ? current : Array.isArray(current.items) ? current.items : [];
  const id = sanitizeUpdateId(input.id || `${slugify(title || "geplanter-beitrag")}-${Date.now()}`);
  const item = {
    id,
    title: title || "Geplanter Beitrag",
    filename: String(input.filename || "").trim(),
    markdown,
    publishAt: new Date(when).toISOString(),
    timezone: input.timezone || "Europe/Berlin",
    status: "scheduled",
    createdAt: new Date().toISOString(),
    lastError: ""
  };
  const payload = { items: [item, ...items.filter((entry) => entry && entry.id !== id)].slice(0, 120) };
  const saved = await githubPut(
    env,
    owner,
    repo,
    schedulePath,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Schedule post ${id}`,
    branch,
    file?.sha
  );
  return { ok: true, id, schedulePath, publishAt: item.publishAt, commitSha: saved.commit?.sha || "" };
}

async function runScheduledPublishes(env) {
  assertConfigured(env);
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const schedulePath = trimSlashes(env.SCHEDULE_PATH || DEFAULT_SCHEDULE_PATH);
  const file = await githubGet(env, owner, repo, schedulePath, branch);
  if (!file?.content) return { ok: true, checked: 0, published: 0, message: "Keine Planung gefunden" };

  const current = JSON.parse(base64ToUtf8(file.content));
  const items = Array.isArray(current) ? current : Array.isArray(current.items) ? current.items : [];
  const now = Date.now();
  let published = 0;
  let changed = false;

  for (const item of items) {
    if (!item || item.status !== "scheduled") continue;
    const due = Date.parse(item.publishAt || item.when || "");
    if (!Number.isFinite(due) || due > now) continue;
    try {
      const result = await publishPostFromMarkdown(env, { markdown: item.markdown, filename: item.filename });
      item.status = "published";
      item.publishedAt = new Date().toISOString();
      item.filename = result.filename;
      item.commitSha = result.commitSha || "";
      item.lastError = "";
      published += 1;
      changed = true;
    } catch (error) {
      item.status = "failed";
      item.lastError = error.message || String(error);
      item.failedAt = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    await githubPut(
      env,
      owner,
      repo,
      schedulePath,
      `${JSON.stringify({ items }, null, 2)}\n`,
      "Run scheduled post publisher",
      branch,
      file.sha
    );
  }

  return { ok: true, checked: items.length, published };
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN);
  const allowOrigin = origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost") || origin === allowed ? origin || allowed : allowed;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Secret",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}

function assertConfigured(env) {
  if (!env.GITHUB_TOKEN) throw httpError("Cloudflare Secret GITHUB_TOKEN fehlt", 500);
  if (!env.ADMIN_PUBLISH_SECRET) throw httpError("Cloudflare Secret ADMIN_PUBLISH_SECRET fehlt", 500);
}

function assertAuthorized(request, env) {
  const headerSecret = request.headers.get("X-Admin-Secret") || "";
  const bearer = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (headerSecret !== env.ADMIN_PUBLISH_SECRET && bearer !== env.ADMIN_PUBLISH_SECRET) {
    throw httpError("Nicht autorisiert", 401);
  }
}

const shortlinkCreateRateBuckets = new Map();
const SHORTLINK_CREATE_RATE_MAX = 30;
const SHORTLINK_CREATE_RATE_WINDOW_MS = 60_000;

function assertShortlinkCreateRateLimit(request, env) {
  const max = Number(env.SHORTLINK_CREATE_RATE_MAX || SHORTLINK_CREATE_RATE_MAX);
  const windowMs = Number(env.SHORTLINK_CREATE_RATE_WINDOW_MS || SHORTLINK_CREATE_RATE_WINDOW_MS);
  const key =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("X-Admin-Secret")?.slice(0, 12) ||
    "unknown";
  const now = Date.now();
  const bucket = shortlinkCreateRateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  shortlinkCreateRateBuckets.set(key, bucket);
  if (bucket.count > max) {
    throw httpError("Rate-Limit: Zu viele Kurzlink-Erstellungen — bitte kurz warten", 429);
  }
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function githubGet(env, owner, repo, path, branch) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`, {
    headers: githubHeaders(env)
  });
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub GET Fehler ${res.status}`, res.status);
  return data;
}

async function githubPut(env, owner, repo, path, content, message, branch, sha) {
  const body = { message, content: utf8ToBase64(content), branch };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}`, {
    method: "PUT",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub PUT Fehler ${res.status}`, res.status);
  return data;
}

async function githubGetRefSha(env, owner, repo, branch) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, {
    headers: githubHeaders(env)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub ref Fehler ${res.status}`, res.status);
  return data.object?.sha || "";
}

async function githubGetCommitTreeSha(env, owner, repo, commitSha) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`, {
    headers: githubHeaders(env)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub commit Fehler ${res.status}`, res.status);
  return data.tree?.sha || "";
}

async function githubCreateBlob(env, owner, repo, content) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ content: String(content ?? ""), encoding: "utf-8" })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub blob Fehler ${res.status}`, res.status);
  return data.sha || "";
}

async function githubCreateBinaryBlob(env, owner, repo, base64Content) {
  const content = String(base64Content || "").replace(/\s+/g, "");
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ content, encoding: "base64" })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub binary blob Fehler ${res.status}`, res.status);
  return data.sha || "";
}

async function githubCommitBatch(env, owner, repo, branch, fileEntries, message) {
  const parentSha = await githubGetRefSha(env, owner, repo, branch);
  const baseTreeSha = await githubGetCommitTreeSha(env, owner, repo, parentSha);
  const blobs = new Map();
  const treeItems = [];
  for (const entry of fileEntries) {
    const path = trimSlashes(entry.path);
    const content = String(entry.content ?? "");
    const blobSha = entry.sha
      || (entry.binary
        ? await githubCreateBinaryBlob(env, owner, repo, String(entry.contentBase64 ?? entry.content ?? ""))
        : await githubCreateBlob(env, owner, repo, content));
    blobs.set(path, blobSha);
    treeItems.push({ path, mode: "100644", type: "blob", sha: blobSha });
  }
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
  });
  const treeData = await treeRes.json().catch(() => ({}));
  if (!treeRes.ok) throw httpError(treeData.message || `GitHub tree Fehler ${treeRes.status}`, treeRes.status);
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ message, tree: treeData.sha, parents: [parentSha] })
  });
  const commitData = await commitRes.json().catch(() => ({}));
  if (!commitRes.ok) throw httpError(commitData.message || `GitHub commit Fehler ${commitRes.status}`, commitRes.status);
  const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ sha: commitData.sha, force: false })
  });
  const refData = await refRes.json().catch(() => ({}));
  if (!refRes.ok) throw httpError(refData.message || `GitHub ref update Fehler ${refRes.status}`, refRes.status);
  return { commitSha: commitData.sha, blobs };
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "dar-admin-cloudflare-worker",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function githubWorkflowDispatch(env, owner, repo, workflowId, ref, inputs = {}) {
  const token = String(env.GITHUB_WORKFLOW_TOKEN || env.GITHUB_TOKEN || "").trim();
  if (!token) {
    return { ok: false, skipped: true, reason: "Kein GitHub-Token für Workflow-Dispatch vorhanden." };
  }
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "dar-admin-cloudflare-worker",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ref: String(ref || DEFAULT_BRANCH),
      inputs
    })
  });
  if (res.status === 204) {
    return { ok: true, workflowId, ref };
  }
  const data = await res.json().catch(() => ({}));
  return {
    ok: false,
    status: res.status,
    workflowId,
    ref,
    reason: data.message || `Workflow-Dispatch fehlgeschlagen (${res.status})`
  };
}

async function triggerSiteDeployWorkflow(env, reason = "manual") {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const workflowId = String(env.GITHUB_DEPLOY_WORKFLOW_ID || "cloudflare-pages-deploy.yml").trim();
  try {
    const result = await githubWorkflowDispatch(env, owner, repo, workflowId, branch, {
      reason: String(reason || "manual").slice(0, 120),
      source: "admin-worker"
    });
    if (!result.ok) {
      console.warn("Site deploy workflow dispatch failed:", result.reason || result.status || "unknown");
    }
    return result;
  } catch (error) {
    console.warn("Site deploy workflow dispatch crashed:", error?.message || String(error));
    return { ok: false, reason: error?.message || String(error) };
  }
}

function encodeURIComponentPath(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

function trimSlashes(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function sanitizeMarkdownQuotes(value) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/\u2e3b/g, "---");
}

function stripYamlQuotes(value) {
  let val = sanitizeMarkdownQuotes(String(value || "").trim());
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1).trim();
  }
  return val.replace(/^["']+|["']+$/g, "").trim();
}

function frontmatterValue(text, key) {
  const match = String(text || "").match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return match ? stripYamlQuotes(match[1]) : "";
}

function htmlAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function yamlBlockValue(markdown, blockName, key) {
  const match = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---/);
  const yaml = match ? match[1] : "";
  const lines = yaml.split(/\r?\n/);
  let inBlock = false;
  for (const line of lines) {
    if (!inBlock) {
      if (line.trim() === `${blockName}:`) inBlock = true;
      continue;
    }
    if (/^[A-Za-z0-9_-]+:\s*/.test(line)) break;
    const item = line.match(new RegExp(`^\\s{2}${key}:\\s*(.*)$`));
    if (item) return stripYamlQuotes(item[1]);
  }
  return "";
}

function absolutePublicUrl(env, value) {
  const raw = String(value || "").trim();
  if (!raw || /^(?:blob:|data:|localhost|https?:\/\/localhost)/i.test(raw)) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${siteOrigin(env)}/${raw.replace(/^\/+/, "")}`;
}

function postPreviewDescription(markdown) {
  const source = frontmatterValue(markdown, "source");
  if (source) return "Ein Beitrag von DAR AL TAWḤID mit Quelle und Nachweis.";
  return "Ein Beitrag von DAR AL TAWḤID.";
}

function buildPostPreviewHtml(env, markdown, postId) {
  const id = String(postId || frontmatterValue(markdown, "id") || "").trim();
  if (!id) throw httpError("Vorschau-Seite: Beitrags-ID fehlt", 400);
  const title = frontmatterValue(markdown, "title") || "DAR AL TAWḤID Beitrag";
  const description = postPreviewDescription(markdown);
  const feedImage = yamlBlockValue(markdown, "feed", "image");
  const ogImage = absolutePublicUrl(env, feedImage) || `${siteOrigin(env)}/assets/share/default-og-image.webp`;
  const publicUrl = `${siteOrigin(env)}/p/${encodeURIComponent(id)}`;
  const appUrl = `${siteOrigin(env)}/#post/${encodeURIComponent(id)}`;
  const logoUrl = `${siteOrigin(env)}/app-icon-512.png`;
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${htmlAttr(title)} | DAR AL TAWḤID</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0f2f2b">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${htmlAttr(description)}">
  <link rel="canonical" href="${htmlAttr(publicUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="DAR AL TAWḤID">
  <meta property="og:title" content="${htmlAttr(title)}">
  <meta property="og:description" content="${htmlAttr(description)}">
  <meta property="og:url" content="${htmlAttr(publicUrl)}">
  <meta property="og:image" content="${htmlAttr(ogImage)}">
  <meta property="og:image:secure_url" content="${htmlAttr(ogImage)}">
  <meta property="og:image:alt" content="DAR AL TAWḤID Bildbeitrag">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${htmlAttr(title)}">
  <meta name="twitter:description" content="${htmlAttr(description)}">
  <meta name="twitter:image" content="${htmlAttr(ogImage)}">
  <script>
    window.addEventListener("DOMContentLoaded", function () {
      setTimeout(function () {
        window.location.replace("${htmlAttr(appUrl)}");
      }, 500);
    });
  </script>
  <style>
    :root{--bg:#f7f0df;--ink:#18342f;--gold:#b99245;--muted:#6d6250;--card:rgba(255,255,255,.78)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,rgba(185,146,69,.18),transparent 36%),linear-gradient(180deg,#fff8e8,var(--bg));color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page{width:min(100%,520px);padding:28px;border:1px solid rgba(185,146,69,.35);border-radius:28px;background:var(--card);box-shadow:0 24px 70px rgba(32,25,10,.16);text-align:center}.logo{width:82px;height:82px;border-radius:999px;object-fit:cover;display:block;margin:0 auto 18px}h1{margin:0;font-size:24px;line-height:1.25;letter-spacing:.02em}p{margin:14px 0 0;color:var(--muted);font-size:15px;line-height:1.6}.button{display:inline-flex;align-items:center;justify-content:center;margin-top:22px;padding:12px 18px;border-radius:999px;background:var(--ink);color:#fff6df;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 12px 28px rgba(24,52,47,.24)}.site{margin-top:18px;color:var(--gold);font-weight:700;font-size:13px;letter-spacing:.04em}
  </style>
</head>
<body>
  <main class="page">
    <img class="logo" src="${htmlAttr(logoUrl)}" alt="DAR AL TAWḤID">
    <h1>${htmlAttr(title)}</h1>
    <p>Der Beitrag wird geöffnet. Falls die Weiterleitung nicht automatisch funktioniert, bitte den Button benutzen.</p>
    <a class="button" href="${htmlAttr(appUrl)}">Beitrag öffnen</a>
    <div class="site">dar-al-tawhid.de</div>
  </main>
</body>
</html>
`;
}

function postPreviewEntry(env, markdown, postId) {
  const id = String(postId || frontmatterValue(markdown, "id") || "").trim();
  if (!id) return null;
  return { path: `p/${id}/index.html`, content: buildPostPreviewHtml(env, markdown, id) };
}

function repairYamlFrontmatter(markdown) {
  const raw = String(markdown || "");
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return raw;
  const body = match[2] || "";
  const topKey =
    "source|links|logo|layout|slides|intro|introTitle|date|id|title|category|topic|scholar|book|author|tags|type";
  const fixed = match[1]
    .split("\n")
    .map((line) => {
      if (/^\*\s+/.test(line)) return line.replace(/^\*\s+/, "- ");
      if (/^\*\s*label:/.test(line)) return line.replace(/^\*\s*/, "  - ");
      const nested = line.match(new RegExp(`^(\\s{2,})(${topKey}:\\s*.*)$`));
      if (nested && !/^\s+-/.test(line)) return nested[2];
      return line;
    })
    .join("\n")
    .replace(/^\* /gm, "- ")
    .replace(new RegExp(`^\\s{4}(${topKey}):`, "gm"), "$1:")
    .replace(/^\*\s*label:/gm, "  - label:");
  return `---\n${fixed}\n---\n\n${body.trim()}`.trimEnd() + "\n";
}

function normalizeMarkdownForStorage(markdown) {
  let out = repairYamlFrontmatter(repairMarkdownStructure(String(markdown || "").trim()));
  const fm = out.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (fm) {
    let body = String(fm[2] || "")
      .replace(/^\s*```(?:markdown|md)?\s*\n/i, "")
      .replace(/\n```\s*$/i, "")
      .trim();
    out = `---\n${fm[1]}\n---\n\n${body}`.trimEnd() + "\n";
  } else {
    out = out
      .replace(/^\s*```(?:markdown|md)?\s*\n/i, "")
      .replace(/\n```\s*$/i, "")
      .trim();
  }
  if (!out) return "";
  return out.endsWith("\n") ? out : out + "\n";
}

function repairMarkdownStructure(markdown) {
  let out = sanitizeMarkdownQuotes(String(markdown || "").trim());
  if (!out) return "";
  out = out.replace(/^\s*[\u2e3b\u2014-]{1,3}\s*$/gm, "---");
  if (/^---\s*\n[\s\S]*?\n---\s*\n?/.test(out)) return out;
  if (/^---\s*\n[\s\S]*?\n---/.test(out)) return out.replace(/\n---\s*$/m, "\n---\n");
  const sepMatch = out.match(/^(?:---|[\u2e3b\u2014-]{1,3})\s*\n([\s\S]*?)\n(?:---|[\u2e3b\u2014-]{1,3})\s*\n?([\s\S]*)$/);
  if (sepMatch) return `---\n${sepMatch[1].trim()}\n---\n\n${(sepMatch[2] || "").trim()}`;
  if (/^id:\s/m.test(out) || /^title:\s/m.test(out)) {
    const bodySplit = out.search(/\n\n(?=[^\s:#-])/);
    if (bodySplit > 0) {
      const head = out.slice(0, bodySplit).trim();
      const body = out.slice(bodySplit).trim();
      if (/^id:\s/m.test(head)) return `---\n${head}\n---\n\n${body}`;
    }
  }
  return out;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "beitrag";
}

function nextPostNumber(files) {
  return listPostFiles(files).length + 1;
}

function maxPostNumber(files) {
  let max = 0;
  for (const file of listPostFiles(files)) {
    const name = typeof file === "string" ? file : file.name;
    for (const match of String(name || "").matchAll(/(?:^|-)(\d{3})(?=-|\.md$)/g)) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return max;
}

function postFileSerial(name) {
  const matches = [...String(name || "").matchAll(/(?:^|-)(\d{3})(?=-|\.md$)/g)];
  return matches.length ? Number(matches[matches.length - 1][1]) : 0;
}

function globalPostSerial(name) {
  const n = String(name || "");
  const beitrag = n.match(/^beitrag-(\d{3})-/i);
  if (beitrag) return Number(beitrag[1]);
  const early = n.match(/^[a-z0-9][a-z0-9-]*-(\d{3})-/i);
  if (early) return Number(early[1]);
  return 0;
}

function resolveLastPostFilename(files, postCount) {
  const list = listPostFiles(files).map((f) => (typeof f === "string" ? { name: f } : f)).filter((f) => f?.name);
  if (!list.length) return "";
  const count = Math.max(1, Number(postCount) || list.length);
  const globalMatches = list.filter((f) => globalPostSerial(f.name) === count);
  if (globalMatches.length) return globalMatches[globalMatches.length - 1].name;
  const target = String(count).padStart(3, "0");
  const suffixMatches = list.filter((f) => new RegExp(`-${target}(?:-|\\.md$)`).test(String(f.name || "")));
  if (suffixMatches.length) return suffixMatches[suffixMatches.length - 1].name;
  let best = "";
  let bestSerial = -1;
  for (const f of list) {
    const serial = postFileSerial(f.name);
    if (serial > bestSerial) {
      bestSerial = serial;
      best = f.name;
    }
  }
  return best;
}

function findDuplicateByTitleSlug(files, markdown) {
  const title = frontmatterValue(markdown, "title").replace(/^📖\s*/, "").trim();
  if (!title || title.length < 6) return null;
  const titleSlug = slugify(title);
  if (titleSlug.length < 8) return null;
  for (const file of listPostFiles(files)) {
    const name = typeof file === "string" ? file : file.name;
    if (String(name || "").includes(titleSlug)) return name;
  }
  return null;
}

async function readDeletedPostsRegistry(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = trimSlashes(env.DELETED_POSTS_PATH || DEFAULT_DELETED_POSTS_PATH);

  try {
    const file = await githubGet(env, owner, repo, path, branch);
    if (!file?.content) return { slugs: [], titleSlugs: [] };
    const data = JSON.parse(base64ToUtf8(file.content));
    const slugs = Array.isArray(data.slugs) ? data.slugs.map((entry) => slugify(String(entry))) : [];
    const titleSlugs = Array.isArray(data.titles) ? data.titles.map((entry) => slugify(String(entry))) : [];
    return {
      slugs: [...new Set(slugs.filter(Boolean))],
      titleSlugs: [...new Set(titleSlugs.filter(Boolean))]
    };
  } catch {
    return { slugs: [], titleSlugs: [] };
  }
}

function assertNotDeletedPost(markdown, registry) {
  const title = frontmatterValue(markdown, "title").replace(/^📖\s*/, "").trim();
  const titleSlug = slugify(title);
  if (!titleSlug) return;

  const blocked = new Set([...(registry?.slugs || []), ...(registry?.titleSlugs || [])]);
  for (const entry of blocked) {
    if (!entry || entry.length < 8) continue;
    if (titleSlug === entry || titleSlug.includes(entry) || entry.includes(titleSlug)) {
      throw httpError(`Dieser Beitrag wurde gelöscht und darf nicht erneut veröffentlicht werden: „${title || entry}“`, 403);
    }
  }
}

function suggestFilename(markdown, nextNumber) {
  const title = frontmatterValue(markdown, "title").replace(/^📖\s*/, "") || "neuer Beitrag";
  const category = frontmatterValue(markdown, "category") || "beitrag";
  return `${slugify(category)}-${String(nextNumber).padStart(3, "0")}-${slugify(title)}.md`;
}

const HASHTAG_CATEGORY_RULES = [
  { tags: ["aqida", "aqidah", "akida", "iman"], category: "ʿAqīdah", topic: "ʿAqīdah" },
  { tags: ["tawhid", "tauhid"], category: "Tawḥīd", topic: "Tawḥīd" },
  { tags: ["sunnah", "sunna"], category: "Sunnah", topic: "Sunnah" },
  { tags: ["quran", "quranwissen", "tafsir"], category: "Qurʾān", topic: "Qurʾān" },
  { tags: ["hadith", "hadithe"], category: "Hadith", topic: "Hadith" },
  { tags: ["athar", "asar"], category: "Āthār", topic: "Āthār" },
  { tags: ["fiqh", "fatwa"], category: "Fiqh", topic: "Fiqh" },
  { tags: ["dua", "dua", "adhkar", "dhikr"], category: "Duʿāʾ", topic: "Duʿāʾ" },
  { tags: ["adab", "akhlaq"], category: "Adab", topic: "Adab" },
  { tags: ["manhaj", "salaf"], category: "Manhaj", topic: "Manhaj" },
  { tags: ["familie", "ehe", "kinder"], category: "Familie", topic: "Familie" },
  { tags: ["bibliothek", "buch", "books"], category: "Bibliothek", topic: "Bibliothek" },
  { tags: ["quelle", "quellen", "quellenbibliothek"], category: "Quellenbibliothek", topic: "Quellenbibliothek" }
];

function normalizeHashtagToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function extractHashtagTokens(markdown) {
  const src = String(markdown || "");
  const out = new Set();
  const re = /(^|[\s(])#([^\s#()[\]{}"'`.,;:!?/\\]+)/g;
  let match;
  while ((match = re.exec(src))) {
    const token = normalizeHashtagToken(match[2]);
    if (token) out.add(token);
  }
  // Fallback: tags-Liste im Frontmatter (mit oder ohne #) ebenfalls berücksichtigen.
  const fm = src.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fm) {
    const tagsBlock = fm[1].match(/^tags:\s*\n([\s\S]*?)(?=\n[a-zA-Z0-9_-]+:\s|$)/m);
    if (tagsBlock) {
      for (const line of String(tagsBlock[1]).split(/\r?\n/)) {
        const item = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
        if (!item) continue;
        const raw = String(item[1] || "").trim();
        if (!raw) continue;
        const normalized = normalizeHashtagToken(raw.replace(/^#/, ""));
        if (normalized) out.add(normalized);
      }
    }
  }
  return out;
}

function inferCategoryTopicFromHashtags(markdown) {
  const tokens = extractHashtagTokens(markdown);
  if (!tokens.size) return null;
  for (const rule of HASHTAG_CATEGORY_RULES) {
    for (const tag of rule.tags) {
      if (tokens.has(normalizeHashtagToken(tag))) {
        return { category: rule.category, topic: rule.topic };
      }
    }
  }
  return null;
}

function upsertFrontmatterValue(head, key, value) {
  const safe = String(value || "").trim();
  if (!safe) return head;
  const lineRe = new RegExp(`^${key}:\\s*(.*)$`, "m");
  const match = String(head || "").match(lineRe);
  if (!match) return `${String(head || "").trimEnd()}\n${key}: "${safe}"`.trim();
  const current = String(match[1] || "").replace(/^["']|["']$/g, "").trim();
  if (current) return head;
  return String(head).replace(lineRe, `${key}: "${safe}"`);
}

function applyHashtagCategoryInference(markdown) {
  const out = String(markdown || "");
  const fm = out.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!fm) return out;
  const existingCategory = frontmatterValue(out, "category");
  const existingTopic = frontmatterValue(out, "topic");
  const categoryKey = normalizeHashtagToken(existingCategory);
  const isPlaceholderCategory = categoryKey === "beitrag" || categoryKey === "allgemein";
  const shouldFillCategory = !existingCategory || isPlaceholderCategory;
  const shouldFillTopic = !existingTopic;
  if (!shouldFillCategory && !shouldFillTopic) return out;
  const inferred = inferCategoryTopicFromHashtags(out);
  if (!inferred) return out;
  let head = String(fm[1] || "");
  if (shouldFillCategory) {
    if (existingCategory && isPlaceholderCategory) {
      head = String(head).replace(/^category:\s*.*$/im, `category: "${inferred.category}"`);
    } else {
      head = upsertFrontmatterValue(head, "category", inferred.category);
    }
  }
  if (shouldFillTopic) head = upsertFrontmatterValue(head, "topic", inferred.topic);
  const body = String(fm[2] || "").trimStart();
  return `---\n${head}\n---\n\n${body}`.trimEnd() + "\n";
}

function sanitizeFilename(filename) {
  const clean = slugify(String(filename || "").replace(/\.md$/i, ""));
  const finalName = `${clean}.md`;
  if (!/^[a-z0-9][a-z0-9-]*\.md$/i.test(finalName)) {
    throw httpError("Dateiname muss eine .md-Datei ohne Leerzeichen sein", 400);
  }
  return finalName;
}

function sanitizeUpdateId(value) {
  return slugify(value).slice(0, 96) || `meldung-${Date.now()}`;
}

function normalizeMarkdownForUpload(markdown, nextNumber) {
  let out = repairYamlFrontmatter(repairMarkdownStructure(markdown));
  out = applyHashtagCategoryInference(out);
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");
  if (/^date:\s*.*$/m.test(out)) out = out.replace(/^date:\s*.*$/m, `date: "${iso}"`);
  let id = stripYamlQuotes(frontmatterValue(out, "id"));
  const next = String(nextNumber).padStart(3, "0");
  if (id) {
    id = stripYamlQuotes(id.replace(/-\d{3}$/, `-${next}`).replace(/["""]+/g, ""));
    if (!/-\d{3}$/.test(id)) id = `${slugify(id) || "beitrag"}-${next}`;
    out = out.replace(/^id:\s*.*$/m, `id: "${id}"`);
  }
  return `${out}\n`;
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64ToUtf8(value) {
  const bin = atob(String(value || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || env.ONESIGNAL_APP_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function parseOneSignalAcceptedRecipients(raw) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    const candidates = [data?.recipients, data?.total_count, data?.successful];
    for (const value of candidates) {
      const count = Number(value);
      if (Number.isFinite(count)) return count;
    }
  } catch (error) {}
  return null;
}

function buildPostPushUrl(env, postId, cacheVersion) {
  const site = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
  const slug = String(postId || "").trim();
  const v = cacheVersion || Date.now();
  return `${site}/?post=${encodeURIComponent(slug)}&v=${encodeURIComponent(v)}#post/${encodeURIComponent(slug)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pendingPushesPath(env) {
  return trimSlashes(env.PENDING_PUSHES_PATH || DEFAULT_PENDING_PUSHES_PATH);
}

async function readPendingPushesRegistry(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = pendingPushesPath(env);
  const file = await githubGet(env, owner, repo, path, branch);
  if (!file?.content) return { pushes: {} };
  try {
    const raw = base64ToUtf8(file.content);
    if (/^<<<<<<<|^>>>>>>>|^=======/m.test(raw)) {
      throw new Error("pending-pushes.json enthält Merge-Konflikt-Marker");
    }
    const data = JSON.parse(raw);
    return { pushes: data.pushes || {}, sha: file.sha };
  } catch (error) {
    return { pushes: {}, sha: file.sha, parseError: error?.message || "JSON parse failed" };
  }
}

function assertPendingPushesRegistryReadable(registry) {
  if (registry?.parseError) {
    throw httpError(
      `Push-Registry defekt (${registry.parseError}). Kein erneuter Versand – bitte content/admin/pending-pushes.json reparieren.`,
      503
    );
  }
}

async function writePendingPushStatus(env, postId, patch) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = pendingPushesPath(env);
  const key = String(postId || "").trim();
  if (!key) return null;
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const registry = await readPendingPushesRegistry(env);
      const pushes = { ...(registry.pushes || {}) };
      pushes[key] = {
        ...(pushes[key] || {}),
        ...patch,
        postId: key,
        updatedAt: new Date().toISOString()
      };
      const payload = { version: 1, generated: new Date().toISOString(), pushes };
      await githubPut(
        env,
        owner,
        repo,
        path,
        `${JSON.stringify(payload, null, 2)}\n`,
        `Update pending push ${key}`,
        branch,
        registry.sha
      );
      return pushes[key];
    } catch (error) {
      lastError = error;
      const status = Number(error?.status || 0);
      if (status !== 409 && status !== 422) throw error;
      await sleep(250 * attempt);
    }
  }

  throw lastError || httpError(`Pending push update für ${key} fehlgeschlagen`, 500);
}

function isPostPushApproved(item) {
  if (!item) return false;
  if (item.kind === "library") return item.pushApproved === true;
  return item.pushApproved === true;
}

function diagnoseLiveFailure(steps, live = {}) {
  if (!steps.githubFileCreated && live.githubPostExists === false) return "GitHub-Datei wurde nicht erstellt.";
  if (!steps.indexUpdatedGithub && live.githubIndexHasPost === false) return "Indexdatei wurde auf GitHub nicht aktualisiert.";
  if (!steps.indexFoundPublic) {
    if (live.indexHttpStatus === 404) return "Indexdatei öffentlich nicht gefunden.";
    return "GitHub Commit erfolgreich, aber Cloudflare Deployment noch nicht fertig.";
  }
  if (!steps.postInIndex) {
    if (live.githubIndexHasPost) return "Index auf GitHub ok, aber öffentlicher Index noch ohne Beitrag – Deployment/Cache.";
    return "Beitrag ist nicht im öffentlichen Index enthalten.";
  }
  if (!steps.postFilePublic) {
    if (live.githubPostExists) return "Datei auf GitHub ok, aber öffentlich noch nicht erreichbar – Deployment/Cache.";
    if (live.postHttpStatus === 404) return "Beitrag-Datei öffentlich nicht erreichbar.";
    return "Cloudflare liefert noch alte Cache-Version.";
  }
  if (!steps.visitorUrlOk) return "Besucher-URL (?post=…) noch nicht erreichbar.";
  return "";
}

function buildLiveCheckResult(githubSteps, live, attempts) {
  // STRICT: Push nur wenn Index + Datei öffentlich online sind (kein GitHub-Fallback).
  const steps = {
    githubFileCreated: !!githubSteps?.postCreated || !!live.githubPostExists,
    indexUpdatedGithub: !!githubSteps?.indexUpdated || !!live.githubIndexHasPost,
    indexFoundPublic: !!live.indexFoundPublic,
    postInIndex: !!live.postInIndexPublic,
    postFilePublic: !!live.postFilePublic,
    visitorUrlOk: !!live.visitorUrlOk,
    cloudflareDeployed: !!(live.indexFoundPublic && live.postInIndexPublic && live.postFilePublic),
    githubIndexHasPost: !!live.githubIndexHasPost,
    githubPostExists: !!live.githubPostExists
  };
  const ok = steps.indexFoundPublic && steps.postInIndex && steps.postFilePublic;
  const diagnosis = ok ? "" : diagnoseLiveFailure(steps, live);
  return {
    ok,
    steps,
    diagnosis,
    indexOk: steps.postInIndex,
    postOk: steps.postFilePublic,
    visitorUrlOk: steps.visitorUrlOk,
    attempts,
    site: live.site,
    postId: live.postId,
    indexGenerated: live.indexGenerated,
    indexCount: live.indexCount,
    visitorUrl: live.visitorUrl,
    indexError: live.indexError,
    postError: live.postError,
    visitorError: live.visitorError,
    githubIndexHasPost: steps.githubIndexHasPost,
    githubPostExists: steps.githubPostExists,
    needsIndexRepair: !steps.postInIndex && !!live.githubPostExists && !live.githubIndexHasPost,
    needsDeployWait: (!!live.githubIndexHasPost || !!live.githubPostExists) && !ok
  };
}

async function fetchLiveResources(env, { filename, postId, postPath }) {
  const site = siteOrigin(env);
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const bust = Date.now();
  const result = {
    site,
    postId: String(postId || ""),
    indexFoundPublic: false,
    postInIndexPublic: false,
    postFilePublic: false,
    visitorUrlOk: false,
    githubIndexHasPost: false,
    githubPostExists: false,
    indexGenerated: null,
    indexCount: null,
    visitorUrl: postId ? buildPostPushUrl(env, postId, bust) : null
  };

  try {
    const indexRes = await fetch(`${site}/${postsDir}/posts-index.json?v=${bust}`, { cache: "no-store" });
    if (indexRes.ok) {
      result.indexFoundPublic = true;
      const indexData = await indexRes.json();
      result.indexGenerated = indexData.generated || null;
      result.indexCount = Number(indexData.count ?? (indexData.files?.length ?? 0)) || 0;
      const files = listPostFiles(indexData.files || []);
      result.postInIndexPublic = files.some((file) => file.name === filename);
      if (!result.postInIndexPublic && postId) {
        result.postInIndexPublic = files.some((file) => String(file.name).replace(/\.md$/, "") === String(postId));
      }
    } else {
      result.indexHttpStatus = indexRes.status;
    }
  } catch (error) {
    result.indexError = error.message || String(error);
  }

  try {
    const postRes = await fetch(`${site}/${postPath}?v=${bust}`, { cache: "no-store" });
    result.postFilePublic = postRes.ok;
    if (!postRes.ok) result.postHttpStatus = postRes.status;
  } catch (error) {
    result.postError = error.message || String(error);
  }

  if (result.visitorUrl) {
    try {
      const navRes = await fetch(result.visitorUrl.split("#")[0], { cache: "no-store", redirect: "follow" });
      result.visitorUrlOk = navRes.ok;
      if (!navRes.ok) result.visitorHttpStatus = navRes.status;
    } catch (error) {
      result.visitorError = error.message || String(error);
    }
  }

  // GitHub nur Diagnose/Reparatur – niemals als „öffentlich online“ werten.
  if (String(env.GITHUB_TOKEN || "").trim()) {
    try {
      const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
      const repo = env.GITHUB_REPO || DEFAULT_REPO;
      const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
      const indexFile = await githubGet(env, owner, repo, `${postsDir}/posts-index.json`, branch);
      if (indexFile?.content) {
        const indexData = JSON.parse(base64ToUtf8(indexFile.content));
        const files = listPostFiles(indexData.files || []);
        result.githubIndexHasPost = files.some((file) => file.name === filename)
          || (postId && files.some((file) => String(file.name).replace(/\.md$/, "") === String(postId)));
        if (!result.indexGenerated) result.indexGenerated = indexData.generated || null;
        if (!result.indexCount) result.indexCount = Number(indexData.count ?? (indexData.files?.length ?? 0)) || 0;
      }
      if (postPath) {
        const ghPost = await githubGet(env, owner, repo, postPath, branch);
        result.githubPostExists = Boolean(ghPost?.content);
      }
    } catch (error) {
      result.githubVerifyError = error.message || String(error);
    }
  }

  return result;
}

async function verifyPostLiveAvailability(env, opts, { schedule = "full" } = {}) {
  const delays =
    schedule === "quick"
      ? LIVE_CHECK_SCHEDULE_QUICK_MS
      : schedule === "cron"
        ? LIVE_CHECK_SCHEDULE_CRON_MS
        : LIVE_CHECK_SCHEDULE_FULL_MS;
  let lastResult = null;
  let elapsed = 0;

  for (let i = 0; i < delays.length; i++) {
    const target = delays[i];
    const waitMs = target - elapsed;
    if (waitMs > 0) await sleep(waitMs);
    elapsed = target;

    const live = await fetchLiveResources(env, opts);
    lastResult = buildLiveCheckResult(opts.githubSteps || {}, live, i + 1);
    if (lastResult.ok) return lastResult;
  }

  return lastResult;
}

/**
 * Index/Datei-Reparatur vor Push:
 * - Datei auf GitHub, aber nicht im Index → Index ergänzen
 * - Index hat Beitrag, öffentlich noch alt → generated bump (Deploy anstoßen, rate-limited)
 */
async function repairPostIndexForPush(env, record, liveCheck) {
  const filename = String(record?.filename || "").trim();
  const postId = String(record?.postId || "").trim();
  const postPath = String(record?.postPath || "").trim()
    || (filename ? `${trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR)}/${filename}` : "");
  if (!filename || !postPath) {
    return { repaired: false, reason: "filename/postPath fehlen" };
  }

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const indexPath = `${postsDir}/posts-index.json`;

  try {
    const postFile = await githubGet(env, owner, repo, postPath, branch);
    if (!postFile?.content) {
      return { repaired: false, reason: "Beitrag-Datei fehlt auf GitHub" };
    }

    const indexFile = await githubGet(env, owner, repo, indexPath, branch);
    const indexData = indexFile?.content
      ? JSON.parse(base64ToUtf8(indexFile.content))
      : { version: 1, files: [] };
    let files = listPostFiles(indexData.files || []);
    const inIndex = files.some((f) => f.name === filename)
      || (postId && files.some((f) => String(f.name).replace(/\.md$/, "") === postId));

    if (!inIndex) {
      files = files.filter((f) => f.name !== filename);
      files.push({ name: filename, sha: postFile.sha || "" });
      const next = {
        version: Number(indexData.version || 1) || 1,
        generated: new Date().toISOString(),
        count: files.length,
        files
      };
      await githubPut(
        env,
        owner,
        repo,
        indexPath,
        `${JSON.stringify(next, null, 2)}\n`,
        `Repair posts-index for push ${filename}`,
        branch,
        indexFile?.sha
      );
      return { repaired: true, action: "index-add", at: new Date().toISOString(), reason: `Index um ${filename} ergänzt` };
    }

    // Öffentlich noch nicht sichtbar → Index-Touch höchstens alle 3 Min.
    const lastTouch = Date.parse(record?.lastRepair?.at || "");
    if (Number.isFinite(lastTouch) && Date.now() - lastTouch < 3 * 60 * 1000) {
      return { repaired: false, reason: "Index-Touch rate-limit (3 Min)" };
    }

    const next = {
      ...indexData,
      version: Number(indexData.version || 1) || 1,
      generated: new Date().toISOString(),
      count: files.length,
      files
    };
    await githubPut(
      env,
      owner,
      repo,
      indexPath,
      `${JSON.stringify(next, null, 2)}\n`,
      `Refresh posts-index for live push ${filename}`,
      branch,
      indexFile?.sha
    );
    return { repaired: true, action: "index-touch", at: new Date().toISOString(), reason: "Index aktualisiert (Deploy/Cache)" };
  } catch (error) {
    return { repaired: false, reason: error?.message || String(error) };
  }
}


async function claimPendingPushSend(env, postId) {
  const key = String(postId || "").trim();
  if (!key) return { claimed: false, reason: "postId fehlt" };

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = pendingPushesPath(env);
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const registry = await readPendingPushesRegistry(env);
      const current = registry.pushes?.[key];
      if (!current) return { claimed: false, reason: "Pending-Eintrag fehlt" };
      if (current.status === "sent") {
        return { claimed: false, skipped: true, reason: "Push wurde bereits gesendet." };
      }
      if (current.status === "sending") {
        const started = Date.parse(current.sendingAt || "");
        if (Number.isFinite(started) && Date.now() - started < 10 * 60 * 1000) {
          return { claimed: false, skipped: true, reason: "Push wird bereits gesendet." };
        }
      }

      const pushes = { ...(registry.pushes || {}) };
      pushes[key] = {
        ...current,
        postId: key,
        status: "sending",
        sendingAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const payload = { version: 1, generated: new Date().toISOString(), pushes };
      await githubPut(
        env,
        owner,
        repo,
        path,
        `${JSON.stringify(payload, null, 2)}\n`,
        `Claim pending push ${key}`,
        branch,
        registry.sha
      );
      return { claimed: true };
    } catch (error) {
      lastError = error;
      const status = Number(error?.status || 0);
      if (status !== 409 && status !== 422) throw error;
      await sleep(250 * attempt);
    }
  }

  throw lastError || httpError(`Push-Claim für ${key} fehlgeschlagen`, 500);
}

async function processPendingPushUntilLive(env, record, options = {}) {
  const postId = String(record?.postId || "").trim();
  if (!postId) return { sent: false, reason: "postId fehlt" };
  const schedule =
    options.schedule === "quick" || options.singleCheck
      ? "quick"
      : options.schedule === "cron"
        ? "cron"
        : "full";

  const registry = await readPendingPushesRegistry(env);
  assertPendingPushesRegistryReadable(registry);
  const existing = registry.pushes?.[postId];
  if (existing?.status === "sent") {
    return { sent: true, skipped: true, reason: "Push wurde bereits gesendet.", liveCheck: existing.liveCheck || null };
  }
  if (existing?.status === "sending") {
    const started = Date.parse(existing.sendingAt || "");
    if (Number.isFinite(started) && Date.now() - started < 10 * 60 * 1000) {
      return { sent: false, skipped: true, reason: "Push wird bereits gesendet.", liveCheck: existing.liveCheck || null };
    }
  }

  // failed → automatisch wieder pending (Reparatur-Schleife)
  if (existing?.status === "failed" || existing?.status === "sending") {
    await writePendingPushStatus(env, postId, {
      status: "pending",
      lastError: existing?.lastError || "Auto-Repair: erneuter Versuch",
      repairAttemptAt: new Date().toISOString()
    });
  }

  const liveCheck = await verifyPostLiveAvailability(
    env,
    {
      filename: record.filename || existing?.filename,
      postId,
      postPath: record.postPath || existing?.postPath,
      githubSteps: { postCreated: true, indexUpdated: true }
    },
    { schedule }
  );

  let repair = null;
  if (!liveCheck.ok) {
    repair = await repairPostIndexForPush(env, {
      ...existing,
      ...record,
      filename: record.filename || existing?.filename,
      postId,
      postPath: record.postPath || existing?.postPath
    }, liveCheck);
    if (repair?.repaired) {
      const again = await verifyPostLiveAvailability(
        env,
        {
          filename: record.filename || existing?.filename,
          postId,
          postPath: record.postPath || existing?.postPath,
          githubSteps: { postCreated: true, indexUpdated: true }
        },
        { schedule: "quick" }
      );
      if (again?.ok) {
        Object.assign(liveCheck, again);
      } else {
        liveCheck.repair = repair;
        liveCheck.diagnosis = again?.diagnosis || liveCheck.diagnosis;
      }
    } else if (repair) {
      liveCheck.repair = repair;
    }
  }

  await writePendingPushStatus(env, postId, {
    lastCheckAt: new Date().toISOString(),
    liveCheck,
    attempts: liveCheck.attempts,
    lastError: liveCheck.ok ? "" : liveCheck.diagnosis,
    lastRepair: repair || existing?.lastRepair || null,
    status: "pending"
  });

  if (!liveCheck.ok) {
    return { sent: false, pending: true, waitingForLive: true, liveCheck, repair, reason: liveCheck.diagnosis };
  }

  const freshRegistry = await readPendingPushesRegistry(env);
  const freshExisting = freshRegistry.pushes?.[postId];
  if (freshExisting?.status === "sent" && !options.forceResend) {
    return {
      sent: true,
      skipped: true,
      reason: "Push wurde bereits gesendet.",
      liveCheck: freshExisting.liveCheck || existing?.liveCheck || liveCheck
    };
  }

  const claim = await claimPendingPushSend(env, postId);
  if (!claim.claimed) {
    const alreadySent = Boolean(claim.skipped && /bereits gesendet/i.test(String(claim.reason || "")));
    return {
      sent: alreadySent,
      skipped: true,
      reason: claim.reason || "Push-Claim abgelehnt",
      liveCheck
    };
  }

  const push = await sendNewPostPush(env, {
    postTitle: record.postTitle || existing?.postTitle,
    postId,
    filename: record.filename || existing?.filename,
    publishedAt: record.publishedAt || existing?.publishedAt,
    cacheVersion: Date.now()
  });

  if (push.sent) {
    await writePendingPushStatus(env, postId, {
      status: "sent",
      sentAt: new Date().toISOString(),
      lastError: "",
      pushResult: { target: push.target, targetUrl: push.targetUrl }
    });
  } else {
    // Nicht „failed“ begraben – bleibt pending für Cron-Auto-Repair
    await writePendingPushStatus(env, postId, {
      status: "pending",
      lastError: push.reason || "OneSignal Push fehlgeschlagen – Auto-Retry",
      pushFailAt: new Date().toISOString()
    });
  }

  return { ...push, liveCheck, repair, pending: !push.sent };
}

async function processAllPendingPushes(env) {
  const registry = await readPendingPushesRegistry(env);
  const pending = Object.values(registry.pushes || {}).filter(
    (item) =>
      item
      && isPostPushApproved(item)
      && (item.status === "pending" || item.status === "failed" || item.status === "sending")
  ).sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt || a.publishedAt || "");
    const bTime = Date.parse(b.updatedAt || b.createdAt || b.publishedAt || "");
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  }).slice(0, Number(env.PENDING_PUSH_CRON_BATCH_SIZE || 8));
  const results = [];
  for (const record of pending) {
    try {
      const handler = record?.kind === "library"
        ? () => processPendingLibraryPushUntilLive(env, record, { extendedWait: false })
        : () => processPendingPushUntilLive(env, record, { schedule: "cron" });
      results.push(await handler());
    } catch (error) {
      console.error(`Pending push failed for ${record?.postId || record?.publicationId || "?"}:`, error?.message || error);
      results.push({ sent: false, reason: error?.message || String(error) });
    }
  }
  return { processed: pending.length, results };
}

async function processPendingLibraryPushUntilLive(env, record, options = {}) {
  const key = libraryPushRegistryKey(record?.publicationId);
  if (!key) return { sent: false, reason: "publicationId fehlt" };

  const registry = await readPendingPushesRegistry(env);
  if (registry.pushes?.[key]?.status === "sent") {
    return { sent: true, skipped: true, reason: "Push wurde bereits gesendet." };
  }

  const current = registry.pushes?.[key] || record;
  if (!isPostPushApproved(current)) {
    return {
      sent: false,
      pending: true,
      waitingForApproval: true,
      reason: "Push wartet auf Admin-Freigabe."
    };
  }

  const liveCheck = await verifyLibraryLiveAvailabilityWithRetry(env, current, {
    schedule: options.extendedWait ? "full" : "quick"
  });
  await writePendingPushStatus(env, key, {
    lastCheckAt: new Date().toISOString(),
    liveCheck,
    attempts: liveCheck.attempt,
    lastError: liveCheck.ok ? "" : liveCheck.diagnosis
  });

  if (!liveCheck.ok) {
    return { sent: false, pending: true, waitingForLive: true, liveCheck, reason: liveCheck.diagnosis };
  }

  if (LIBRARY_PUSH_DELAY_AFTER_LIVE_MS > 0) {
    await sleep(LIBRARY_PUSH_DELAY_AFTER_LIVE_MS);
  }

  const push = await sendLibraryPublicationPush(env, current);
  if (push.sent) {
    await writePendingPushStatus(env, key, {
      status: "sent",
      sentAt: new Date().toISOString(),
      lastError: "",
      pushResult: { target: push.target, targetUrl: push.targetUrl }
    });
  } else {
    await writePendingPushStatus(env, key, {
      status: "failed",
      lastError: push.reason || "OneSignal Push fehlgeschlagen"
    });
  }

  return { ...push, liveCheck, pending: !push.sent };
}

async function retryPendingLibraryPush(env, input, ctx) {
  const publicationId = String(input.publicationId || "").trim();
  const slug = String(input.slug || publicationId).trim();
  const publicationTitle = String(input.publicationTitle || input.title || "").trim() || "Neue PDF";
  const pdfUrl = String(input.pdfUrl || "").trim();
  const publishedAt = String(input.publishedAt || new Date().toISOString());
  if (!publicationId) throw httpError("publicationId fehlt", 400);

  const key = libraryPushRegistryKey(publicationId);
  const registry = await readPendingPushesRegistry(env);
  const existing = registry.pushes?.[key];
  if (existing?.status === "sent" && !input.forceResend) {
    return {
      ok: true,
      sent: true,
      skipped: true,
      reason: "Push wurde bereits gesendet.",
      liveCheck: existing.liveCheck || null,
      push: { sent: true, targetUrl: buildLibraryPushUrl(env, slug, Date.now()) }
    };
  }

  const record = {
    kind: "library",
    publicationId,
    slug: existing?.slug || slug,
    publicationTitle: existing?.publicationTitle || publicationTitle,
    pdfUrl: existing?.pdfUrl || pdfUrl,
    catalogPath: existing?.catalogPath || "data/library-publications.json",
    publishedAt: existing?.publishedAt || publishedAt,
    status: "pending",
    pushApproved: false,
    pushApprovedAt: existing?.pushApprovedAt || null
  };
  await writePendingPushStatus(env, key, record);
  const approvedRecord = {
    ...record,
    pushApproved: true,
    pushApprovedAt: new Date().toISOString()
  };
  await writePendingPushStatus(env, key, approvedRecord);
  const push = await processPendingLibraryPushUntilLive(env, approvedRecord);
  if (ctx && push?.pending) {
    ctx.waitUntil(processPendingLibraryPushUntilLive(env, approvedRecord, { extendedWait: true }));
  }
  return {
    ok: true,
    publicationId,
    slug: record.slug,
    liveCheck: push.liveCheck || null,
    push
  };
}

async function retryPendingPostPush(env, input, ctx) {
  const postId = String(input.postId || "").trim();
  const filename = sanitizeFilename(String(input.filename || "").trim());
  const postTitle = String(input.postTitle || "").trim() || "Neuer Beitrag";
  const publishedAt = String(input.publishedAt || new Date().toISOString());
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const postPath = String(input.postPath || `${postsDir}/${filename}`).trim();
  if (!postId || !filename) throw httpError("postId und filename fehlen", 400);

  const registry = await readPendingPushesRegistry(env);
  assertPendingPushesRegistryReadable(registry);
  const existing = registry.pushes?.[postId];
  if (existing?.status === "sent" && !input.forceResend) {
    return {
      ok: true,
      sent: true,
      skipped: true,
      reason: "Push wurde bereits gesendet.",
      liveCheck: existing.liveCheck || { ok: true },
      push: {
        sent: true,
        skipped: true,
        reason: "Push wurde bereits gesendet.",
        targetUrl: existing.pushResult?.targetUrl || buildPostPushUrl(env, postId, Date.now())
      }
    };
  }

  const record = {
    postId,
    filename: existing?.filename || filename,
    postTitle: existing?.postTitle || postTitle,
    publishedAt: existing?.publishedAt || publishedAt,
    postPath: existing?.postPath || postPath,
    status: "pending",
    pushApproved: true,
    pushApprovedAt: new Date().toISOString()
  };

  if (existing?.status !== "pending" && existing?.status !== "sending" && existing?.status !== "sent") {
    await writePendingPushStatus(env, postId, record);
  } else if (existing?.status !== "sent") {
    await writePendingPushStatus(env, postId, {
      pushApproved: true,
      pushApprovedAt: record.pushApprovedAt
    });
  }

  // Admin-Retry: längere Live-Prüfung (cron), danach volle Hintergrund-Wartezeit
  const push = await processPendingPushUntilLive(env, { ...existing, ...record }, { schedule: "cron", singleCheck: false });
  if (ctx && push?.pending) {
    ctx.waitUntil(processPendingPushUntilLive(env, { ...existing, ...record }, { schedule: "full" }));
  }
  return {
    ok: true,
    postId,
    filename: record.filename,
    liveCheck: push.liveCheck || null,
    push
  };
}

function newsPushBody(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Neue Meldung auf DAR AL TAWḤID.";
  if (raw.length <= 220) return raw;
  const slice = raw.slice(0, 217);
  const dot = slice.lastIndexOf(". ");
  const space = slice.lastIndexOf(" ");
  const cut = dot > 80 ? dot + 1 : space > 80 ? space : 217;
  return `${slice.slice(0, cut).trim()}…`;
}

function buildNewsPushUrl(env, { newsId, nav, value }) {
  const site = siteOrigin(env);
  const id = String(newsId || "").trim();
  const targetNav = String(nav || "").trim();
  const targetValue = String(value || "").trim();
  if (targetNav && targetValue && targetNav !== "news-detail") {
    return `${site}/#${targetNav}/${encodeURIComponent(targetValue)}`;
  }
  return `${site}/#news-detail/${encodeURIComponent(id || "news")}`;
}

async function sendNewsPush(env, { newsId, title, text, nav, value }) {
  const apiKey = oneSignalApiKey(env);
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  if (!apiKey) {
    return { sent: false, reason: "OneSignal API-Key fehlt am Worker (ONESIGNAL_API_KEY_NEW)" };
  }
  if (!appId) {
    return { sent: false, reason: "OneSignal App-ID fehlt" };
  }

  const pushTitle = String(title || "Neu im Fokus").trim();
  const pushMessage = newsPushBody(text);
  const url = buildNewsPushUrl(env, { newsId, nav, value });
  const site = siteOrigin(env);
  const icon = `${site}/notification-icon-192.png?v=3`;
  const badge = `${site}/notification-badge-96.png?v=3`;
  const pushData = {
    type: "news",
    newsId: String(newsId || "").trim(),
    nav: String(nav || "news-detail").trim(),
    value: String(value || "").trim(),
    url,
    publishedAt: new Date().toISOString()
  };

  const basePayload = {
    app_id: appId,
    target_channel: "push",
    headings: { en: pushTitle, de: pushTitle },
    contents: { en: pushMessage, de: pushMessage },
    url,
    data: pushData,
    chrome_web_icon: icon,
    chrome_web_badge: badge,
    firefox_icon: icon,
    name: `admin-news-${Date.now()}`
  };

  const attempts = [
    { ...basePayload, included_segments: ["DAR_PUSH"] },
    { ...basePayload, included_segments: ["Subscribed Users"] },
    {
      ...basePayload,
      filters: [{ field: "tag", key: "dar_push", relation: "=", value: "true" }]
    },
    {
      ...basePayload,
      filters: [{ field: "tag", key: "post_notifications", relation: "=", value: "true" }]
    }
  ];

  let lastError = "Kein Empfänger gefunden";

  for (const payload of attempts) {
    for (const authMode of ["Key", "Basic"]) {
      try {
        const res = await fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `${authMode} ${apiKey}`
          },
          body: JSON.stringify(separatePushLaunchUrls(payload))
        });
        const textResp = await res.text();
        if (res.ok) {
          const accepted = parseOneSignalAcceptedRecipients(textResp);
          if (accepted !== null && accepted <= 0) {
            lastError = `OneSignal 200: keine Empfänger im Ziel ${payload.included_segments?.[0] || "tag-filter"}`;
            continue;
          }
          return {
            sent: true,
            target: payload.included_segments?.[0] || "tag-filter",
            authMode,
            targetUrl: url,
            title: pushTitle,
            message: pushMessage,
            data: pushData,
            recipients: accepted,
            response: textResp.slice(0, 400)
          };
        }
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          lastError = `OneSignal ${res.status} (${authMode}): ${textResp.slice(0, 240)}`;
          continue;
        }
        lastError = `OneSignal ${res.status}: ${textResp.slice(0, 240)}`;
      } catch (error) {
        lastError = error.message || String(error);
      }
    }
  }

  return { sent: false, reason: lastError, title: pushTitle, message: pushMessage, targetUrl: url };
}

function telegramBotToken(env) {
  return String(env.TELEGRAM_BOT_TOKEN || "").trim();
}

function telegramChannelId(env) {
  return String(env.TELEGRAM_CHANNEL_USERNAME || env.TELEGRAM_CHANNEL_ID || "@dar_al_tauhid").trim();
}

function telegramTopicsChatId(env) {
  return String(
    env.TELEGRAM_TOPICS_CHAT_ID ||
      env.TELEGRAM_FORUM_CHAT_ID ||
      env.TELEGRAM_TOPIC_CHAT_ID ||
      ""
  ).trim();
}

function isTelegramTopicRoutingEnabled(env) {
  const raw = String(env.TELEGRAM_TOPIC_ROUTING_ENABLED || "1").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function normalizeTelegramTag(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parseTelegramTopicMap(env) {
  const defaults = {
    athar: Number(env.TELEGRAM_TOPIC_ATHAR_THREAD_ID || 0),
    hadith: Number(env.TELEGRAM_TOPIC_HADITH_THREAD_ID || 0),
    aqidah: Number(env.TELEGRAM_TOPIC_AQIDAH_THREAD_ID || 0),
    tawhid: Number(env.TELEGRAM_TOPIC_TAWHID_THREAD_ID || 0),
    manhaj: Number(env.TELEGRAM_TOPIC_MANHAJ_THREAD_ID || 0),
    adab: Number(env.TELEGRAM_TOPIC_ADAB_THREAD_ID || 0),
    quran: Number(env.TELEGRAM_TOPIC_QURAN_THREAD_ID || 0),
    fiqh: Number(env.TELEGRAM_TOPIC_FIQH_THREAD_ID || 0),
    dua: Number(env.TELEGRAM_TOPIC_DUA_THREAD_ID || 0),
    bibliothek: Number(env.TELEGRAM_TOPIC_LIBRARY_THREAD_ID || 0),
    sirah: Number(env.TELEGRAM_TOPIC_SIRAH_THREAD_ID || 0),
    geschichte: Number(env.TELEGRAM_TOPIC_HISTORY_THREAD_ID || 0),
    widerlegungen: Number(env.TELEGRAM_TOPIC_WIDERLEGUNGEN_THREAD_ID || 0),
    takfir: Number(env.TELEGRAM_TOPIC_TAKFIR_THREAD_ID || 0),
    kufr: Number(env.TELEGRAM_TOPIC_KUFR_THREAD_ID || 0),
    nawaqid: Number(env.TELEGRAM_TOPIC_NAWAQID_THREAD_ID || 0)
  };
  let parsed = {};
  try {
    parsed = JSON.parse(String(env.TELEGRAM_TOPIC_MAP_JSON || "{}")) || {};
  } catch (_) {
    parsed = {};
  }
  const out = {};
  for (const [k, v] of Object.entries({ ...defaults, ...parsed })) {
    const key = normalizeTelegramTag(k);
    const threadId = Number(v);
    if (key && Number.isFinite(threadId) && threadId > 0) out[key] = threadId;
  }
  return out;
}

const TELEGRAM_TOPIC_ALIAS_GROUPS = (() => {
  const groups = [];
  for (const rule of HASHTAG_CATEGORY_RULES || []) {
    const normalized = [...new Set((rule?.tags || []).map((tag) => normalizeTelegramTag(tag)).filter(Boolean))];
    if (normalized.length > 1) groups.push(normalized);
  }
  // Zusätzliche häufige Schreibweisen/Transliterationen für stabile Zuordnung.
  groups.push(["hadith", "hadithe", "hadit"]);
  groups.push(["athar", "asar", "atar"]);
  groups.push(["aqida", "aqidah", "akida"]);
  groups.push(["tawhid", "tauhid"]);
  groups.push(["dua", "dua", "adhkar", "dhikr"]);
  groups.push(["salaf", "sahaba", "ahlalhadith", "ahlalhadit", "manhaj", "sunnah", "sunna", "alsunnah", "alawzai", "awzai"]);
  groups.push(["fiqh", "usul", "usulalfiqh", "salam"]);
  groups.push(["sirah", "seerah", "geschichte", "tarikh"]);
  groups.push(["widerlegung", "widerlegungen", "rad", "shubuhat"]);
  groups.push(["takfir", "kufr", "nawaqid", "murjia", "khawarij"]);
  return groups.map((group) => [...new Set(group.map((tag) => normalizeTelegramTag(tag)).filter(Boolean))]);
})();

function buildTelegramAliasLookup() {
  const lookup = {};
  for (const group of TELEGRAM_TOPIC_ALIAS_GROUPS) {
    for (const tag of group) {
      if (!lookup[tag]) lookup[tag] = [];
      for (const alt of group) {
        if (alt !== tag && !lookup[tag].includes(alt)) lookup[tag].push(alt);
      }
    }
  }
  return lookup;
}

const TELEGRAM_TOPIC_ALIAS_LOOKUP = buildTelegramAliasLookup();
const TELEGRAM_TOPIC_PRIORITY = [
  "fiqh",
  "aqidah",
  "tawhid",
  "quran",
  "sirah",
  "geschichte",
  "hadith",
  "athar",
  "manhaj",
  "adab",
  "widerlegungen",
  "takfir",
  "kufr",
  "nawaqid",
  "bibliothek",
  "quelle",
  "dua"
];

function resolveTopicByPriority(tags, map) {
  const tagSet = new Set((tags || []).map((tag) => normalizeTelegramTag(tag)).filter(Boolean));
  for (const preferred of TELEGRAM_TOPIC_PRIORITY) {
    if (!tagSet.has(preferred)) continue;
    if (map[preferred]) return Number(map[preferred]);
    for (const alt of TELEGRAM_TOPIC_ALIAS_LOOKUP[preferred] || []) {
      if (map[alt]) return Number(map[alt]);
    }
  }
  return 0;
}

function resolveTelegramTopicThreadIds(tags, topicMap, env) {
  const map = topicMap || {};
  const out = [];
  const seen = new Set();
  const pushThread = (value) => {
    const threadId = Number(value);
    if (!Number.isFinite(threadId) || threadId <= 0 || seen.has(threadId)) return;
    seen.add(threadId);
    out.push(threadId);
  };

  const tagSet = new Set((tags || []).map((tag) => normalizeTelegramTag(tag)).filter(Boolean));
  for (const preferred of TELEGRAM_TOPIC_PRIORITY) {
    if (!tagSet.has(preferred)) continue;
    pushThread(map[preferred]);
    for (const alt of TELEGRAM_TOPIC_ALIAS_LOOKUP[preferred] || []) pushThread(map[alt]);
  }

  for (const rawTag of tags || []) {
    const tag = normalizeTelegramTag(rawTag);
    if (!tag) continue;
    pushThread(map[tag]);
    for (const alt of TELEGRAM_TOPIC_ALIAS_LOOKUP[tag] || []) pushThread(map[alt]);
  }

  if (!out.length) {
    const fallback = Number(env.TELEGRAM_TOPIC_DEFAULT_THREAD_ID || 0);
    if (Number.isFinite(fallback) && fallback > 0) out.push(fallback);
  }
  return out;
}

function extractHashtagsFromTelegramText(text) {
  const value = String(text || "");
  const tags = new Set();
  const re = /(^|[\s(])#([^\s#()[\]{}"'`.,;:!?/\\]+)/g;
  let match;
  while ((match = re.exec(value))) {
    const token = normalizeTelegramTag(match[2]);
    if (token) tags.add(token);
  }
  return [...tags];
}

function resolveTelegramTopicThreadId(tags, topicMap, env) {
  return resolveTelegramTopicThreadIds(tags, topicMap, env)[0] || 0;
}

function collectTopicMapFromTelegramUpdates(updates) {
  const map = {};
  const list = Array.isArray(updates) ? updates : [];
  for (const item of list) {
    const msg = item?.message;
    if (!msg?.is_topic_message || !msg?.chat?.id || !msg?.message_thread_id) continue;
    const text = String(msg.text || msg.caption || "").trim();
    if (!text) continue;
    const tags = extractHashtagsFromTelegramText(text);
    for (const tag of tags) {
      if (!map[tag]) map[tag] = Number(msg.message_thread_id);
    }
  }
  return map;
}

function collectTopicMapFromRouteHistory(registry) {
  const map = {};
  const posts = registry?.posts && typeof registry.posts === "object" ? registry.posts : {};
  for (const value of Object.values(posts)) {
    if (!value || String(value.status || "") !== "sent") continue;
    const threadId = Number(value.targetThreadId || value.message_thread_id || 0);
    if (!Number.isFinite(threadId) || threadId <= 0) continue;
    const tags = Array.isArray(value.hashtags) ? value.hashtags : [];
    for (const raw of tags) {
      const tag = normalizeTelegramTag(raw);
      if (tag && !map[tag]) map[tag] = threadId;
    }
  }
  return map;
}

function siteOrigin(env) {
  return String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
}

function extractVisitorMainScriptFromHtml(html) {
  const match = String(html || "").match(/<script>\nconst REPO_OWNER[\s\S]*?<\/script>/);
  return match ? match[0].replace(/^<script>\n/, "").replace(/<\/script>$/, "") : "";
}

function validateVisitorMainScript(code) {
  const issues = [];
  if (!code) {
    issues.push("Besucher-App Hauptscript nicht gefunden");
    return issues;
  }
  if (!code.includes("function render(")) issues.push("render() fehlt in index.html");
  if (/BYPASS_POST_CACHE"\)\}\}catch\(e\)\{\}/.test(code) && !/BYPASS_POST_CACHE"\)\}\}\}\}catch\(e\)\{\}/.test(code)) {
    issues.push("hardRefreshApp Syntaxfehler (fehlende Klammer)");
  }
  return issues;
}

async function checkVisitorSiteHealth(env) {
  const issues = [];
  const origin = siteOrigin(env);
  try {
    const res = await fetch(`${origin}/index.html?visitorHealth=${Date.now()}`, { redirect: "follow" });
    if (!res.ok) issues.push(`index.html antwortet mit HTTP ${res.status}`);
    else issues.push(...validateVisitorMainScript(extractVisitorMainScriptFromHtml(await res.text())));
  } catch (e) {
    issues.push(`index.html nicht erreichbar: ${e.message || e}`);
  }
  try {
    const res = await fetch(`${origin}/content/posts/posts-index.json?visitorHealth=${Date.now()}`);
    if (!res.ok) issues.push(`posts-index.json HTTP ${res.status}`);
    else {
      const data = await res.json();
      if (!data || !Array.isArray(data.files)) issues.push("posts-index.json ist ungültig");
    }
  } catch (e) {
    issues.push(`posts-index.json: ${e.message || e}`);
  }
  return { ok: issues.length === 0, issues, checkedAt: new Date().toISOString(), origin };
}

function telegramPostsPath(env) {
  return trimSlashes(env.TELEGRAM_POSTS_PATH || DEFAULT_TELEGRAM_POSTS_PATH);
}

async function readTelegramPostsRegistry(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = telegramPostsPath(env);
  const file = await githubGet(env, owner, repo, path, branch);
  if (!file?.content) return { posts: {} };
  try {
    const data = JSON.parse(base64ToUtf8(file.content));
    return { posts: data.posts || {}, sha: file.sha };
  } catch (error) {
    return { posts: {}, sha: file.sha };
  }
}

async function writeTelegramPostStatus(env, postId, patch) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = telegramPostsPath(env);
  const registry = await readTelegramPostsRegistry(env);
  const posts = { ...(registry.posts || {}) };
  const key = String(postId || "").trim();
  if (!key) return null;
  posts[key] = {
    ...(posts[key] || {}),
    ...patch,
    postId: key,
    updatedAt: new Date().toISOString()
  };
  const payload = { version: 1, generated: new Date().toISOString(), posts };
  const saved = await githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Update telegram status ${key}`,
    branch,
    registry.sha
  );
  return posts[key];
}

function buildTelegramPreviewResponse(env, input) {
  const markdown = String(input.markdown || "").trim();
  const fields = parsePostForTelegram(markdown, {
    postId: input.postId || "",
    websiteOrigin: siteOrigin(env)
  });
  const preview = buildTelegramPreview(fields);
  return {
    ok: preview.validation.ok,
    fields,
    preview,
    errors: preview.validation.errors,
    warnings: [
      preview.tooLong ? "Telegram-Text ist zu lang." : "",
      preview.captionTooLong ? "Text ist für Foto-Caption zu lang – es wird gekürzt oder getrennt gesendet." : ""
    ].filter(Boolean)
  };
}

async function telegramApiCall(env, method, payload, { multipart = false } = {}) {
  const token = telegramBotToken(env);
  if (!token) throw httpError("TELEGRAM_BOT_TOKEN fehlt am Worker", 500);
  const url = `https://api.telegram.org/bot${token}/${method}`;
  let res;
  if (multipart) {
    res = await fetch(url, { method: "POST", body: payload });
  } else {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw httpError(`Telegram ${method} Fehler: ${data.description || res.status}`, res.status || 500);
  }
  return data.result || data;
}

function base64ToBytes(base64) {
  const bin = atob(String(base64 || "").replace(/^data:image\/\w+;base64,/, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sendTelegramPhoto(env, { chatId, imageBase64, caption }) {
  const bytes = base64ToBytes(imageBase64);
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", new Blob([bytes], { type: "image/png" }), "dar-al-tawhid-bildbeitrag.png");
  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
  }
  return telegramApiCall(env, "sendPhoto", form, { multipart: true });
}

async function sendTelegramText(env, { chatId, text }) {
  return telegramApiCall(env, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: false
  });
}

async function sendTelegramTest(env) {
  const chatId = telegramChannelId(env);
  const text = [
    "<b>DAR AL TAWḤID Test</b>",
    "Telegram-Verbindung funktioniert."
  ].join("\n");
  const result = await sendTelegramText(env, { chatId, text });
  return {
    ok: true,
    sent: true,
    status: "sent",
    telegramMessageId: result?.message_id || null,
    telegramSentAt: new Date().toISOString(),
    target: chatId
  };
}

async function sendTelegramPost(env, input) {
  const markdown = String(input.markdown || "").trim();
  const postId = String(input.postId || frontmatterValue(markdown, "id") || "").trim();
  const mode = String(input.mode || "text");
  const forceResend = Boolean(input.forceResend);
  const imageBase64 = String(input.imageBase64 || "");
  const chatId = telegramChannelId(env);

  if (!telegramBotToken(env)) {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: "TELEGRAM_BOT_TOKEN fehlt am Worker",
      skipped: false
    };
  }

  const registry = await readTelegramPostsRegistry(env);
  const existing = registry.posts?.[postId];
  if (!forceResend && (existing?.status === "sent" || existing?.telegramStatus === "sent")) {
    return {
      sent: false,
      status: "sent",
      telegramStatus: "sent",
      skipped: true,
      reason: "Beitrag wurde bereits an Telegram gesendet.",
      telegramMessageId: existing.telegramMessageId || null,
      telegramSentAt: existing.telegramSentAt || null
    };
  }

  const fields = parsePostForTelegram(markdown, { postId, websiteOrigin: siteOrigin(env) });
  const validation = validateTelegramPost(fields);
  if (!validation.ok) {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: validation.errors.join(" "),
      errors: validation.errors,
      skipped: false
    };
  }

  const html = buildTelegramHtml(fields);
  const preview = buildTelegramPreview(fields);
  if (preview.tooLong && mode === "text") {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: "Telegram-Text ist zu lang.",
      skipped: false
    };
  }

  const sendText = mode === "text" || mode === "both";
  const sendImage = (mode === "image" || mode === "both") && imageBase64;

  if ((mode === "image" || mode === "both") && !imageBase64) {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: "Bildbeitrag fehlt oder konnte nicht generiert werden.",
      skipped: false
    };
  }

  try {
    let messageId = null;

    if (sendImage) {
      const caption = preview.captionTooLong ? shortenForCaption(html) : html;
      const photoResult = await sendTelegramPhoto(env, { chatId, imageBase64, caption });
      messageId = photoResult?.message_id || null;
      if (mode === "both" || preview.captionTooLong) {
        const followup = await sendTelegramText(env, { chatId, text: html });
        messageId = followup?.message_id || messageId;
      }
    } else if (sendText) {
      const textResult = await sendTelegramText(env, { chatId, text: html });
      messageId = textResult?.message_id || null;
    } else {
      throw httpError("Kein Telegram-Modus gewählt", 400);
    }

    const statusPatch = {
      status: "sent",
      telegramStatus: "sent",
      telegramMessageId: messageId,
      telegramSentAt: new Date().toISOString(),
      telegramError: ""
    };
    if (postId) await writeTelegramPostStatus(env, postId, statusPatch);

    return {
      ok: true,
      sent: true,
      skipped: false,
      target: chatId,
      mode,
      previewLength: html.length,
      ...statusPatch
    };
  } catch (error) {
    const fail = {
      status: "failed",
      telegramStatus: "failed",
      telegramError: error.message || String(error),
      telegramSentAt: new Date().toISOString()
    };
    if (postId) await writeTelegramPostStatus(env, postId, fail).catch(() => null);
    return { sent: false, skipped: false, ...fail };
  }
}

async function routeLatestTelegramChannelPost(env, { force = false, silent = false } = {}) {
  try {
    if (!isTelegramTopicRoutingEnabled(env)) {
      return { ok: true, skipped: true, reason: "Telegram-Topic-Routing deaktiviert" };
    }
    if (!telegramBotToken(env)) {
      return { ok: false, skipped: true, reason: "TELEGRAM_BOT_TOKEN fehlt" };
    }
    const targetChatId = telegramTopicsChatId(env);
    if (!targetChatId) {
      return { ok: false, skipped: true, reason: "TELEGRAM_TOPICS_CHAT_ID fehlt" };
    }

    const updates = await telegramApiCall(env, "getUpdates", {
      limit: 100,
      allowed_updates: ["channel_post", "message"]
    });
    const list = Array.isArray(updates) ? updates : [];
    const channelPosts = [...list]
      .reverse()
      .map((u) => u?.channel_post)
      .filter((post) => post && (post.text || post.caption));
    if (!channelPosts.length) {
      return { ok: true, skipped: true, reason: "Kein channel_post gefunden" };
    }

    const registry = await readTelegramPostsRegistry(env);
    const historyMap = collectTopicMapFromRouteHistory(registry);
    const configuredMap = parseTelegramTopicMap(env);
    const learnedMap = collectTopicMapFromTelegramUpdates(list);
    const topicMap = { ...historyMap, ...learnedMap, ...configuredMap };

    let selectedPost = null;
    let selectedTags = [];
    let threadIds = [];

    for (const candidate of channelPosts) {
      const sourceChatId = candidate.chat?.id;
      const messageId = candidate.message_id;
      const text = String(candidate.text || candidate.caption || "").trim();
      const tags = extractHashtagsFromTelegramText(text);
      if (!tags.length) continue;

      const candidateThreadIds = resolveTelegramTopicThreadIds(tags, topicMap, env);
      if (!candidateThreadIds.length) continue;

      if (!force) {
        const fullySent = candidateThreadIds.every((threadId) => {
          const routeKey = `route:${sourceChatId}:${messageId}:${threadId}`;
          return registry.posts?.[routeKey]?.status === "sent";
        });
        if (fullySent) continue;
      }

      selectedPost = candidate;
      selectedTags = tags;
      threadIds = candidateThreadIds;
      break;
    }

    if (!selectedPost) {
      return { ok: true, skipped: true, reason: "Kein neuer passender Hashtag-Post für Themenrouting gefunden" };
    }

    const sourceChatId = selectedPost.chat?.id;
    const messageId = selectedPost.message_id;
    const tags = selectedTags;

    if (!threadIds.length) {
      const routeKey = `route:${sourceChatId}:${messageId}:unmapped`;
      await writeTelegramPostStatus(env, routeKey, {
        status: "failed",
        telegramStatus: "failed",
        reason: "Kein Thread-Mapping für Hashtag",
        sourceChatId,
        sourceMessageId: messageId,
        hashtags: tags
      });
      return { ok: false, skipped: true, reason: "Kein Thread-Mapping für Hashtag", tags };
    }
    const sentTo = [];
    const skippedTo = [];
    for (const threadId of threadIds) {
      const routeKey = `route:${sourceChatId}:${messageId}:${threadId}`;
      if (!force && registry.posts?.[routeKey]?.status === "sent") {
        skippedTo.push({ routeKey, threadId });
        continue;
      }

      const copied = await telegramApiCall(env, "copyMessage", {
        chat_id: targetChatId,
        from_chat_id: sourceChatId,
        message_id: messageId,
        message_thread_id: threadId
      });
      await writeTelegramPostStatus(env, routeKey, {
        status: "sent",
        telegramStatus: "sent",
        sourceChatId,
        sourceMessageId: messageId,
        targetChatId,
        targetThreadId: threadId,
        copiedMessageId: copied?.message_id || null,
        hashtags: tags
      });
      sentTo.push({ routeKey, threadId, copiedMessageId: copied?.message_id || null });
    }
    if (!sentTo.length && skippedTo.length) {
      return { ok: true, skipped: true, reason: "Bereits geroutet", tags, threadIds, skippedTo };
    }
    return {
      ok: true,
      sent: sentTo.length > 0,
      sourceChatId,
      sourceMessageId: messageId,
      targetChatId,
      targetThreadIds: threadIds,
      hashtags: tags,
      sentTo,
      skippedTo
    };
  } catch (error) {
    if (!silent) return { ok: false, sent: false, error: error?.message || String(error) };
    console.error("telegram topic routing failed:", error?.message || error);
    return { ok: false, sent: false, error: error?.message || String(error) };
  }
}
