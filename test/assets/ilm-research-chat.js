/* TEST-ONLY · ʿIlm-Recherche-Chat */
(function () {
  "use strict";
  if (!/\/test(\/|$)/.test(String(location.pathname || ""))) return;

  /* MAJLIS ARCHIVE STYLE BOOT V1340: usable even if late HTML imports are ignored. */
  (function ensureIlmArchiveStyles() {
    var id = "darIlmHistoryArchiveV1340";
    var coreId = "darIlmHistoryCoreV1340";
    function install() {
      var root = document.head || document.documentElement;
      if (!root || !document.createElement || !document.getElementById) return;
      if (!document.getElementById(id)) {
        var link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "/test/assets/ilm-history-archive-v1338.css?v=1340";
        root.appendChild(link);
      }
      if (!document.getElementById(coreId)) {
        var style = document.createElement("style");
        style.id = coreId;
        style.textContent =
          'body.is-ilm-chat-route .ilm-history-archive{display:block;max-width:760px;width:100%;margin:4px auto 14px;border:1px solid color-mix(in srgb,var(--ilm-accent) 24%,transparent);border-radius:12px;box-sizing:border-box;overflow:hidden;background:color-mix(in srgb,var(--ilm-header-bg) 36%,transparent)}' +
          'body.is-ilm-chat-route .ilm-history-archive>summary,body.is-ilm-chat-route .ilm-history-turn>summary{display:flex;align-items:center;gap:10px;list-style:none;cursor:pointer;padding:10px 12px;min-height:42px;font:600 12px/1.4 system-ui,sans-serif;color:var(--ilm-primary-text)}' +
          'body.is-ilm-chat-route .ilm-history-archive summary::-webkit-details-marker,body.is-ilm-chat-route .ilm-history-turn summary::-webkit-details-marker{display:none}' +
          'body.is-ilm-chat-route .ilm-history-archive summary::marker,body.is-ilm-chat-route .ilm-history-turn summary::marker{content:""}' +
          'body.is-ilm-chat-route .ilm-history-archive-label,body.is-ilm-chat-route .ilm-history-turn-question{flex:1;min-width:0}' +
          'body.is-ilm-chat-route .ilm-history-archive-list{padding:0 10px 7px;border-top:1px solid color-mix(in srgb,var(--ilm-accent) 16%,transparent)}' +
          'body.is-ilm-chat-route .ilm-history-turn{border-bottom:1px solid color-mix(in srgb,var(--ilm-accent) 12%,transparent)}' +
          'body.is-ilm-chat-route .ilm-history-turn-question{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}' +
          'body.is-ilm-chat-route .ilm-history-archive-icon,body.is-ilm-chat-route .ilm-history-archive-chevron,body.is-ilm-chat-route .ilm-history-turn-chevron,body.is-ilm-chat-route .ilm-history-turn-index{color:var(--ilm-accent)}' +
          'body.is-ilm-chat-route .ilm-history-turn-content{padding:8px 3px}';
        root.appendChild(style);
      }
    }
    install();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded",install,{once:true});
    }
  })();

  /* MAJLIS SPACING BOOT V1342: critical layout after legacy styles, test route only. */
  (function ensureMajlisSpacing() {
    var key = "darIlmSpacingCoreV1342";
    function install() {
      var root = document.head || document.documentElement;
      if (!root || !document.createElement || !document.getElementById || document.getElementById(key)) return;
      var style = document.createElement("style");
      style.id = key;
      style.textContent = [
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-examples-v1341{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;margin:17px 0 0!important;width:100%!important;padding:0!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-example-v1341{display:flex!important;flex-direction:row!important;align-items:center!important;min-height:75px!important;width:100%!important;min-width:0!important;max-width:100%!important;padding:13px 15px!important;margin:0!important;gap:12px!important;border-radius:14px!important;white-space:normal!important;box-sizing:border-box!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-example-text-v1341{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:7px!important;flex:1 1 auto!important;min-width:0!important;text-align:left!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-example-text-v1341>small,html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-example-text-v1341>b{display:block!important;position:static!important;float:none!important;white-space:normal!important;margin:0!important;max-width:100%!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-example-text-v1341>small{font:700 10px/1.3 system-ui,sans-serif!important;color:var(--ilm-accent)!important;text-transform:uppercase!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-example-text-v1341>b{font:630 14px/1.4 system-ui,sans-serif!important;color:var(--ilm-primary-text)!important;overflow-wrap:anywhere!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-paths{margin-top:31px!important;padding-bottom:18px!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-path-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;border:0!important;margin-top:16px!important}',
        'html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-path-grid>button.ilm-welcome-path{margin:0!important;min-width:0!important;min-height:91px!important;border:1px solid color-mix(in srgb,var(--ilm-accent) 21%,transparent)!important;border-radius:14px!important;padding:13px 12px!important}',
        'html body.is-ilm-chat-route .ilm-message-inner{padding-top:19px!important}',
        'html body.is-ilm-chat-route .ilm-message-inner .ilm-user-row{margin:12px 0 18px!important}',
        'html body.is-ilm-chat-route .ilm-message-inner .ilm-assistant-message{margin:7px 0 23px!important}',
        'html body.is-ilm-chat-route .ilm-answer-text .ilm-primary-references{margin-top:18px!important;padding-top:15px!important}',
        'html body.is-ilm-chat-route .ilm-answer-text .ilm-science-actions{margin:16px 0 11px!important;gap:9px!important}',
        '@media(min-width:760px){html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-examples-v1341{grid-template-columns:repeat(2,minmax(0,1fr))!important}}',
        '@media(max-width:355px){html body.is-ilm-chat-route .ilm-welcome--majlis .ilm-welcome-path-grid{grid-template-columns:minmax(0,1fr)!important}}'
      ].join("\n");
      root.appendChild(style);
    }
    install();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  })();

  /* MAJLIS HEADER LATE SAFETY V1345
     Retain a tiny critical style layer after old test headers on iOS Safari. */
  (function ensureMajlisNativeHeader() {
    var id = "darIlmNativeHeaderV1345";
    function install() {
      var root = document.head || document.documentElement;
      if (!root || !document.createElement || !document.getElementById || document.getElementById(id)) return;
      var style = document.createElement("style");
      style.id = id;
      style.textContent = [
        'html body.is-ilm-chat-route .ilm-chat-header{position:sticky!important;top:0!important;z-index:48!important;display:grid!important;grid-template-columns:88px minmax(0,1fr) 88px!important;align-items:center!important;gap:3px!important;width:100%!important;max-width:100%!important;min-height:70px!important;height:auto!important;margin:0!important;padding:10px max(12px,env(safe-area-inset-right,0px)) 10px max(12px,env(safe-area-inset-left,0px))!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:linear-gradient(180deg,color-mix(in srgb,var(--ilm-header-bg) 64%,var(--ilm-page-bg)),var(--ilm-page-bg))!important;overflow:visible!important}',
        'html body.is-ilm-chat-route .ilm-chat-header::before,html body.is-ilm-chat-route .ilm-chat-header::after{display:none!important;content:none!important}',
        'html body.is-ilm-chat-route .ilm-chat-header .ilm-header-title{justify-self:center!important;min-width:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:2px!important}',
        'html body.is-ilm-chat-route .ilm-chat-header .ilm-header-title b{font-size:clamp(1.24rem,4.7vw,1.55rem)!important;line-height:1.08!important;font-weight:620!important;white-space:nowrap!important;text-shadow:none!important}',
        'html body.is-ilm-chat-route .ilm-chat-header .ilm-header-title::after{display:none!important;content:none!important}',
        'html body.is-ilm-chat-route .ilm-chat-header .ilm-header-actions{justify-self:end!important;display:flex!important;flex-wrap:nowrap!important;gap:0!important;min-width:88px!important}',
        'html body.is-ilm-chat-route .ilm-chat-header .ilm-icon-btn,html body.is-ilm-chat-route .ilm-chat-header>button,html body.is-ilm-chat-route .ilm-chat-header .ilm-header-actions>button{width:44px!important;min-width:44px!important;max-width:44px!important;height:44px!important;min-height:44px!important;max-height:44px!important;border:0!important;border-radius:50%!important;background:transparent!important;background-image:none!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;color:var(--ilm-primary-text)!important;transform:none!important}',
        'html body.is-ilm-chat-route .ilm-chat-header .ilm-icon-btn:focus-visible,html body.is-ilm-chat-route .ilm-chat-header>button:focus-visible,html body.is-ilm-chat-route .ilm-chat-header .ilm-header-actions>button:focus-visible{outline:2px solid var(--ilm-accent)!important;outline-offset:-2px!important}',
        'html body.is-ilm-chat-route .ilm-history-archive:not([open]){width:max-content!important;max-width:100%!important;min-height:0!important;margin:4px 0 14px!important;border:0!important;background:transparent!important;box-shadow:none!important}',
        'html body.is-ilm-chat-route .ilm-history-archive:not([open])>summary{min-height:34px!important;padding:4px 8px!important;font-size:11px!important}',
        '@media(max-width:360px){html body.is-ilm-chat-route .ilm-chat-header{grid-template-columns:80px minmax(0,1fr) 80px!important;gap:2px!important;padding-left:5px!important;padding-right:5px!important}html body.is-ilm-chat-route .ilm-chat-header .ilm-header-actions{min-width:80px!important}html body.is-ilm-chat-route .ilm-chat-header .ilm-header-title b{font-size:clamp(1.08rem,4.8vw,1.24rem)!important}}'
      ].join("\n");
      root.appendChild(style);
    }
    install();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded",install,{once:true});
    }
  })();

  var ALLOW = [
    "islamweb.net",
    "shamela.ws",
    "dorar.net",
    "al-maktaba.org",
    "ketabonline.com",
    "waqfeya.net",
    "archive.org",
    "app.turath.io",
    "turath.io"
  ];
  var ABUSE = /\b(idiot|arsch|fuck|hurensohn|wichser|schlampe|bastard|kacke|schei[sß]e)\b/i;
  var TERMS = ["Tawḥīd", "ʿAqīdah", "Īmān", "Qurʾān", "Ḥadīṯ", "Ṣaḥābah", "Tābiʿīn", "Ijmāʿ", "Sunnah", "Salaf"];

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function clip(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    if (s.length <= n) return s;
    return s.slice(0, n).replace(/\s+\S*$/, "") + "…";
  }
  function hostOk(url) {
    try {
      var h = new URL(url, location.origin).hostname.replace(/^www\./, "");
      return ALLOW.some(function (d) { return h === d || h.endsWith("." + d); });
    } catch (e) { return false; }
  }
  function deepLink(src) {
    var url = "";
    if (src && Array.isArray(src.links)) {
      var hit = src.links.find(function (l) { return l && /^https?:/i.test(l.url); });
      if (hit) url = hit.url;
    }
    url = url || src.deep_link || src.source_url || src.url || src.markedUrl || src.finalUrl || "";
    if (!url) return "";
    if (/#page=|#:~:text=/.test(url)) return url;
    var q = clip(src.statement || src.excerpt || src.body || "", 48).replace(/[|\\{}]/g, "");
    if (q.length > 12 && !/\.pdf(\?|#|$)/i.test(url) && hostOk(url)) {
      return url.split("#")[0] + "#:~:text=" + encodeURIComponent(q.slice(0, 42));
    }
    if (src.page && /\.pdf(\?|#|$)/i.test(url) && !/#page=/.test(url)) {
      return url.split("#")[0] + "#page=" + encodeURIComponent(String(src.page));
    }
    return url;
  }
  function em(text) {
    var out = esc(text);
    TERMS.forEach(function (t) {
      var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, '<em class="ilm-em">$1</em>');
    });
    return out;
  }
  function seenIds(convo) {
    var ids = {};
    (convo && convo.messages || []).forEach(function (m) {
      var ev = m.reply && (m.reply.evidences || m.reply.sources);
      (ev || []).forEach(function (s) {
        var id = s.id || s.work || s.reference || s.excerpt;
        if (id) ids[String(id)] = true;
      });
      (m.reply && m.reply.sourceGroups || []).forEach(function (g) {
        (g.items || []).forEach(function (s) {
          if (s.id) ids[String(s.id)] = true;
        });
      });
    });
    return ids;
  }
  function toEvidence(item, origin) {
    var url = deepLink(item);
    var verified = item.verification_status === "verified" && !!(item.reference || item.work) && !!(item.excerpt || item.body || item.statement) && !!url && (hostOk(url) || url.indexOf(location.origin) === 0);
    // A canonical Arabic verse with a matching numeric in-app route is
    // locally inspectable even when no external PDF or web link exists.
    var ayaRoute = item.route && item.route.view === "quran-surah" ? String(item.route.value || "") : "";
    var localAyah = origin !== "external" && item.kind === "quran" &&
      /^(?:[1-9]|[1-9]\d|1[01]\d|11[0-4])\/(?:[1-9]\d{0,2})$/.test(ayaRoute) &&
      item.id === "quran-" + ayaRoute.replace("/", "-") &&
      /[\u0600-\u06ff]{5,}/.test(String(item.body || "")) &&
      String(item.excerpt || "").length >= 25 && !!item.reference;
    if (localAyah) verified = true;
    if (origin === "external") verified = false;
    return {
      speaker: item.speaker || item.author || "",
      speaker_type: item.kind || item.type || "",
      statement: clip(item.excerpt || item.statement || item.body || "", 2800),
      work: item.work || item.title || "",
      reference: item.reference || "",
      book: item.work || "",
      chapter: item.chapter || "",
      volume: item.volume || "",
      page: item.page || "",
      hadith_number: item.hadith_number || "",
      source_domain: origin === "external" ? "external" : "dar-al-tawhid",
      source_url: url,
      deep_link: url,
      verification_status: verified ? "verified" : (url ? "partially_verified" : "unverified"),
      authenticity: item.authenticity || "",
      notes: localAyah ? "Interner Qurʾān-Reader · Versnummer direkt prüfbar; keine eigenständige Rechtsauslegung" : (item.sourceTag || item.note || ""),
      id: item.id || "",
      route: item.route || null,
      groupLabel: item.groupLabel || ""
    };
  }
  function followUps(question, reply) {
    var q = String(question || "").toLowerCase();
    var extra = [];
    if (!/ṣaḥāb|sahab|gefährt/.test(q)) extra.push("Auch Aussagen der Ṣaḥābah anzeigen");
    if (!/salaf/.test(q)) extra.push("Nur frühe Salaf");
    extra.push("Weitere Belege");
    extra.push("Erklärung dazu");
    return extra;
  }
  function renderEvidence(ev, idx) {
    if (ev.verification_status === "unverified" && !ev.statement) return "";
    var kicker = ev.speaker
      ? (ev.speaker + (/prophet|rasul|ﷺ/i.test(ev.speaker) || ev.speaker_type === "sunnah" ? " ﷺ sagte:" : ":"))
      : (idx ? "Ein weiterer Beleg" : "Beleg");
    var open = "";
    if (ev.route && ["post","dua","quran-surah"].includes(String(ev.route.view || "")) && String(ev.route.value || "") && !/[<>"\u0000-\u001f]/.test(String(ev.route.value))) {
      open = '<button type="button" class="ilm-open-src" data-ilm-discovery-result="1" data-nav="' + esc(ev.route.view) + '" data-value="' + esc(ev.route.value) + '">↗ In der App öffnen</button>';
    } else if (ev.verification_status === "verified" && (ev.deep_link || (ev.route && ev.route.view === "quran-surah"))) {
      if (ev.deep_link && /^https?:/i.test(ev.deep_link) && (hostOk(ev.deep_link) || ev.deep_link.indexOf(location.origin + "/") === 0)) {
        open = '<a class="ilm-open-src" href="' + esc(ev.deep_link) + '" target="_blank" rel="noopener noreferrer">↗ Originalstelle öffnen</a>';
      } else if (ev.route && ev.route.view) {
        open = '<button type="button" class="ilm-open-src" data-ilm-open-route="' + esc(JSON.stringify(ev.route)) + '">↗ Originalstelle öffnen</button>';
      }
    } else if (ev.verification_status === "partially_verified" && ev.deep_link && hostOk(ev.deep_link)) {
      open = '<a class="ilm-open-src" href="' + esc(ev.deep_link) + '" target="_blank" rel="noopener noreferrer">↗ Fundstelle zur Prüfung öffnen</a>';
    }
    var meta = [ev.reference && ev.reference !== ev.work ? ev.reference : "", ev.chapter, ev.hadith_number ? "Nr. " + ev.hadith_number : "", ev.volume ? "Band " + ev.volume : "", ev.page ? "Seite " + ev.page : "", ev.notes].filter(Boolean).join(" · ");
    return (
      '<section class="ilm-evidence">' +
        '<p class="ilm-evidence-kicker">' + esc(kicker) + "</p>" +
        (ev.statement ? '<p class="ilm-quote">„' + em(ev.statement) + '“</p>' : "") +
        (ev.work ? '<p class="ilm-cite">' + esc(ev.work) + "</p>" : "") +
        (meta ? '<p class="ilm-cite-meta">' + esc(meta) + "</p>" : "") +
        open +
      "</section>"
    );
  }

  function decorateReply(question, reply, convo) {
    if (!reply || typeof reply !== "object") return reply;
    var items = [];
    (reply.sourceGroups || []).forEach(function (g) {
      (g.items || []).forEach(function (it) {
        items.push(toEvidence(it, it.kind === "external" ? "external" : "internal"));
      });
    });
    (reply.sources || []).forEach(function (s) {
      items.push(toEvidence({
        id: s.id, speaker: s.author || s.speaker || s.label || "",
        work: s.work || s.host || "", reference: s.reference,
        chapter: s.chapter, page: s.page, volume: s.volume,
        hadith_number: s.hadith_number, authenticity: s.authenticity,
        excerpt: s.excerpt || s.snippet || "",
        sourceTag: s.note || "",
        url: s.url || s.markedUrl || s.finalUrl || "",
        markedUrl: s.markedUrl, finalUrl: s.finalUrl,
        verification_status: s.verification_status
      }, s.origin === "external" ? "external" : "internal"));
    });
    var seen = {};
    var unique = [];
    items.forEach(function (ev) {
      var key = ev.id || ev.work + "|" + ev.statement.slice(0, 40);
      if (seen[key]) return;
      seen[key] = true;
      unique.push(ev);
    });
    var verified = unique.filter(function (e) { return e.verification_status === "verified"; });
    var rest = unique.filter(function (e) { return e.verification_status !== "verified"; });
    reply.evidences = verified.concat(rest).slice(0, 8);
    reply._ilmQuestion = String(question || "");
    reply.follow_up = followUps(question, reply);
    reply.research_hint = navigator.onLine ? "Fundstellen werden abgeglichen" : "Offline · interne Quellen";
    if (!reply.intro && reply.status === "ok") reply.intro = "Bāraka Allāhu fīk 🌙";
    return reply;
  }

  function waitReady(fn) {
    if (typeof window.renderIlm === "function") { fn(); return; }
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (typeof window.renderIlm === "function" || n > 80) {
        clearInterval(t);
        fn();
      }
    }, 50);
  }

  waitReady(function () {
    // ʿIlm SCIENCE CHAT · test only.  Show a precise answer first, original proofs on demand.
    function plain(value) {
      return String(value || "").replace(/<[^>]*>/g, "").replace(/^[\s„“"'•–-]+|[\s„“"']+$/g, "")
        .replace(/\*\*|__|#{1,4}\s/g, "").replace(/\s+/g, " ").trim();
    }
    function proofIntent(question) {
      var q = String(question || "");
      // A definition requested WITH evidence is still a question, not a request
      // to suppress explanation and display only raw proof excerpts.
      var definition = /(?:was\s+(?:ist|bedeutet)|erkl[aä]r|was\s+versteht\s+man\s+unter)/i.test(q);
      var exactQuote = /(?:exakt|wörtlich|wortlaut|original(?:text|aussage)?|wort.für.wort|zitiere|isn[aā]d)/i.test(q);
      if (definition && !exactQuote) return false;
      return /(?:exakt|wörtlich|wortlaut|original(?:text|aussage)?|beweis|beleg|quelle|isn[aā]d|nachweis|wort.für.wort|zitiere|überlieferung|hadith.nummer|ḥadīṯ.nummer)/i.test(q);
    }
    function sourceTitle(ev) {
      return [ev.speaker, ev.work, ev.reference !== ev.work ? ev.reference : "", ev.chapter, ev.hadith_number && ("Nr. " + ev.hadith_number),
        ev.volume && ("Bd. " + ev.volume), ev.page && ("S. " + ev.page)].filter(Boolean).join(" · ");
    }
    function readableSentence(text, maxLen) {
      var cleaned = plain(text).replace(/^.{0,70}(?:sagte|sprach):\s*/i, "");
      var parts = cleaned.split(/(?<=[.!?؛。])\s+/).filter(Boolean);
      var first = parts.find(function (s) { return s.length >= 35 && s.length <= maxLen; }) || parts[0] || cleaned;
      if (first.length > maxLen) {
        first = first.slice(0, maxLen).replace(/\s+\S*$/, "").trim() + "…";
      }
      return first;
    }
    /* ILM APP DISCOVERY V1333: one search index, concise answer, native in-app routes. */
    function isDiscoveryQuestion(text) {
      return /(?:\bwo\s+(?:finde|steht|gibt|lese)\b|\b(?:finde|suche|such|öffne|oeffne)\b|\b(?:in der app|auf der seite|welcher beitrag|welche beiträge|welche sura|welche sure|welcher vers|welcher ḥadīṯ|welcher hadith)\b|\bzeig(?:e)?\s+mir\s+(?:den|die|einen|das)\s+(?:beitrag|quelle|thema|stelle|vers))/i.test(String(text || ""));
    }
    function discoveryRoute(item) {
      var route = item && item.route;
      if (!route || !["post","dua","quran-surah"].includes(String(route.view || ""))) return null;
      var value = String(route.value == null ? "" : route.value).trim();
      if (!value || value.length > 170 || /[<>"'\x00-\x1f]/.test(value)) return null;
      return {view:route.view,value:value};
    }
    function discoveryItems(matches) {
      var used = Object.create(null);
      var found = [];
      (Array.isArray(matches) ? matches : []).forEach(function (it) {
        var route = discoveryRoute(it);
        if (!route) return;
        var key = route.view + ":" + route.value;
        if (used[key]) return;
        used[key] = true;
        found.push({
          title:String(it.title || it.work || "Inhalt öffnen").replace(/^[\s📖📚🖋✒️📜]+/gu,"").trim(),
          kind:String(it.kind || "posts"),
          route:route,
          summary:clip(String(it.excerpt || it.body || it.reference || "").replace(/^[\s📖📚🖋✒️📜]+/gu,"").trim(), 93),
          source:clip(it.reference || it.work || "", 92),
          id:String(it.id || ""),
          score:Number(it.score || 0)
        });
      });
      return found.slice(0, 7);
    }
    function discoveryKindLabel(item) {
      if (item.route.view === "quran-surah") return "Qurʾān · Āyah";
      if (item.route.view === "dua") return "Duʿāʾ";
      return "Beitrag · " + (item.kind === "sunnah" ? "Ḥadīṯ" : item.kind === "athar" ? "Athar" : "Wissen");
    }
    function discoveryItemHtml(item, index) {
      return '<button type="button" class="ilm-discovery-item" data-ilm-discovery-result="1" data-nav="' +
        esc(item.route.view) + '" data-value="' + esc(item.route.value) +
        '" aria-label="' + esc(item.title + " in der App öffnen") + '">' +
        '<span class="ilm-discovery-number" aria-hidden="true">' + String(index + 1).padStart(2, "0") + '</span>' +
        '<span class="ilm-discovery-copy"><span class="ilm-discovery-kind">' + esc(discoveryKindLabel(item)) +
        '</span><strong>' + esc(clip(item.title, 105)) + '</strong>' +
        (item.summary ? '<span class="ilm-discovery-summary">' + esc(item.summary) + '</span>' : '') +
        '</span><span class="ilm-discovery-arrow" aria-hidden="true">↗</span></button>';
    }
    function discoverySection(reply) {
      var navigational = !!reply._ilmIsDiscovery;
      var items = Array.isArray(reply._ilmDiscovery) ? reply._ilmDiscovery.slice(0,navigational ? 7 : 2) : [];
      if (!items.length) return "";
      var first = items.slice(0,navigational ? 3 : 2).map(discoveryItemHtml).join("");
      var more = navigational ? items.slice(3) : [];
      return '<section class="ilm-discovery" aria-label="Passende Inhalte der App">' +
        '<div class="ilm-discovery-head"><h3>' + (navigational ? 'In der App gefunden' : 'Passend zum Thema') + '</h3><span>Direkt öffnen</span></div>' +
        '<div class="ilm-discovery-results">' + first + '</div>' +
        (more.length ? '<details class="ilm-discovery-more"><summary>Weitere ' + more.length +
          ' Treffer anzeigen <span aria-hidden="true">⌄</span></summary><div class="ilm-discovery-results">' +
          more.map(function (it, i) { return discoveryItemHtml(it, i + 3); }).join("") + '</div></details>' : '') +
        '</section>';
    }

    /* MAJLIS QUALITY V1335 · test-only answer intent and bounded references */
    function ilmNormalize(text) {
      return String(text || "").toLowerCase()
        .replace(/[ḥḫḏṭṣḍẓʿʾ]/g,function(c){return ({"ḥ":"h","ḫ":"kh","ḏ":"dh","ṭ":"t","ṣ":"s","ḍ":"d","ẓ":"z","ʿ":"","ʾ":""})[c] || c;})
        .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
        .replace(/[^a-z0-9äöüß ]/g," ").replace(/\s+/g," ").trim();
    }
    function isBasicTawhidQuestion(question) {
      var q = ilmNormalize(question);
      return /(?:^| )(?:was (?:ist|bedeutet)|was versteht man unter|erklare|definition von) (?:den |die |das )?(?:tawhid|tauhid)(?: |$)/.test(q)
        && !/(?:hukm|urteil|takfir|gesetz|ibadah und|welcher vers|weitere belege|beweise|vertief|ausfuhrlich)/.test(q);
    }
    function tawhidFollowup(question) {
      var q = ilmNormalize(question);
      if (!/(?:tawhid|tauhid)/.test(q)) return "";
      if (/(?:weitere belege|weitere beweise|exakt|beweis|wortlaut)/.test(q)) return "proof";
      if (/(?:ausfuhrlich|vertief|genauer)/.test(q)) return "depth";
      return "";
    }
    /* MAJLIS RELEVANCE V1350: no keyword-only pseudo-proofs.
       The current QUESTION governs every displayed and composed source. */
    function ilmQuestionTerms(question) {
      var stop = /^(?:was|ist|sind|wie|wer|warum|bedeutet|definition|erklare|welche|welcher|welchen|einen|einer|einem|beweise|belege|authentische|authentischen|dazu|deine|quelle|quellen|lesen|genau|werden|gibt|wurde|fur|aus|zum|des|den|die|das|und|oder|im|islam|islamischen|bitte|mehr|mir|mit|nach|eine|ausgangsfrage|nachfrage|zeigen|zeige|genannten|vorigen)$/;
      return Array.from(new Set(ilmNormalize(question).split(" ").filter(function(word){
        return word.length >= 4 && !stop.test(word);
      })));
    }
    function ilmSubjectGate(question, source) {
      var q = " " + ilmNormalize(question) + " ";
      var s = " " + ilmNormalize(source) + " ";
      // A verse about a person's hands is not a proof on raising hands in salāh.
      // Require the ritual AND the requested action in the actual source text.
      var ruku = /\b(?:ruku|rukuh|verbeugung)\b/.test(q);
      var sujud = /\b(?:sujud|sudschud|niederwerfung)\b/.test(q);
      var prayer = /\b(?:gebet|beten|salah|salat|ruku|rukuh|verbeugung|sujud|niederwerfung)\b/.test(q);
      var hands = /\b(?:hand|hande|handen|heben|hochheben|hochw|hoch|gehoben|senken|unten)\b/.test(q);
      if (ruku && !/\b(?:ruku|rukuh|verbeugung|verbeugte|verbeugten)\b/.test(s)) return false;
      if (sujud && !/\b(?:sujud|sudschud|niederwerfung)\b/.test(s)) return false;
      if (prayer && hands) {
        if (!/\b(?:hand|hande|handen|hands|hochheben|heben|hebt|hob|hoben|gehoben|erhob|erhoben|erhebt|senkte|senken)\b/.test(s)) return false;
        if (!ruku && !sujud && !/\b(?:gebet|gebetes|gebets|beten|salah|salat|namaz|ruku|rukuh|verbeugung|sujud|niederwerfung)\b/.test(s)) return false;
      }
      return true;
    }
    function rankKnowledgeSources(question, list) {
      var terms = ilmQuestionTerms(question);
      if (!terms.length) return [];
      var seen = Object.create(null);
      return (Array.isArray(list) ? list : []).map(function(item,index) {
        var title = " " + ilmNormalize([item.title,item.work,item.reference].join(" ")) + " ";
        var body = " " + ilmNormalize([item.excerpt,item.statement,item.body].join(" ").slice(0,3000)) + " ";
        var source = title + body;
        var matched = terms.filter(function(word) {
          return title.includes(" " + word + " ") || body.includes(" " + word + " ");
        });
        var titleHits = matched.filter(function(word){return title.includes(" " + word + " ");}).length;
        return {item:item,order:index,hits:matched.length,titleHits:titleHits,
          relevant:ilmSubjectGate(question,source),
          weight:matched.length*3 + titleHits*3 + (item.kind==="sunnah" ? 1 : 0)};
      }).filter(function(row) {
        if (!row.relevant || row.hits < Math.min(2,terms.length)) return false;
        var key = String(row.item.id || row.item.title || row.item.reference || row.order);
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      }).sort(function(a,b){return b.weight-a.weight || a.order-b.order;})
        .map(function(row){return row.item;});
    }
    function ilmScriptureLinks(extended) {
      var rows = [
        {view:"quran-surah",value:"112/1",title:"al-Ikhlāṣ 112:1–4",caption:"Allahs Einzigkeit"},
        {view:"quran-surah",value:"16/36",title:"an-Naḥl 16:36",caption:"Allah allein dienen"}
      ];
      if (extended) {
        rows.push(
          {view:"quran-surah",value:"51/56",title:"adh-Dhāriyāt 51:56",caption:"Zweck der Anbetung"},
          {view:"quran-surah",value:"21/25",title:"al-Anbiyāʾ 21:25",caption:"Botschaft aller Gesandten"}
        );
      }
      return '<section class="ilm-primary-references" aria-label="Qurʾān-Grundlagen"><span class="ilm-primary-references-title">Qurʾān-Grundlagen</span>' +
        rows.map(function(r){
          return '<button type="button" class="ilm-primary-reference" data-ilm-discovery-result="1" data-nav="' +
            esc(r.view) + '" data-value="' + esc(r.value) + '"><span>' + esc(r.title) +
            '<small>' + esc(r.caption) + '</small></span><span aria-hidden="true">↗</span></button>';
        }).join("") + '</section>';
    }

    /* Verified core topic for the test question: Adab / good character. */
    function isBasicAdabQuestion(question) {
      var q = ilmNormalize(question);
      return /(?:^| )(?:was ist|was bedeutet|erklare|definition von|was versteht man unter) (?:der |die |das )?adab(?: |$)/.test(q);
    }
    function ilmAdabVerifiedSource() {
      return {
        id:"core-adab-bukhari-3559", speaker:"ʿAbdullāh ibn ʿAmr",
        statement:"Der Prophet ﷺ vermied anstößige Rede und erklärte sinngemäß, dass die Besten unter den Menschen diejenigen mit dem besten Charakter sind.",
        work:"Ṣaḥīḥ al-Buḫārī", reference:"Nr. 3559 · Ṣaḥīḥ Muslim Nr. 2321",
        verification_status:"verified", authenticity:"ṣaḥīḥ",
        source_domain:"dorar.net", source_url:"https://dorar.net/h/ToIF2N8R",
        deep_link:"https://dorar.net/h/ToIF2N8R"
      };
    }
    function ilmImanScriptureLinks() {
      return '<section class="ilm-primary-references" aria-label="Qurʾān-Grundlagen für Īmān">' +
        '<span class="ilm-primary-references-title">Qurʾān-Grundlagen</span>' +
        '<button type="button" class="ilm-primary-reference" data-ilm-discovery-result="1" data-nav="quran-surah" data-value="2/285"><span>al-Baqarah 2:285<small>Grundlagen des Glaubens</small></span><span aria-hidden="true">↗</span></button>' +
        '<button type="button" class="ilm-primary-reference" data-ilm-discovery-result="1" data-nav="quran-surah" data-value="4/136"><span>an-Nisāʾ 4:136<small>Aufruf zum Glauben</small></span><span aria-hidden="true">↗</span></button></section>';
    }
    function shortScientificAnswer(reply) {
      if (reply._ilmResearching) return reply._ilmResearchProgress || "Ich suche in Qurʾān, Sunnah und zugelassenen Originalquellen nach einer belegten Antwort …";
      if (reply._ilmResearchError) return reply._ilmResearchError;
      var ev = (reply.evidences || []).find(function (e) { return e.verification_status === "verified" && e.statement && e.statement.length > 24; });
      var txt = String(reply.directAnswer || "").trim();
      if (reply._ilmNoRelevantEvidence) return "Dazu liegen mir derzeit keine hinreichend passenden, geprüften Fundstellen vor. Ich verwende keine themenfremden Beiträge als Beweise.";
      if (!ev) {
        if (reply.status === "unavailable" || reply.status === "insufficient") {
          return "Für diese Frage liegt mir derzeit kein ausreichend gesicherter Beleg vor. Ich möchte dir keine unbelegte religiöse Aussage geben.";
        }
        return txt && !/[„“]/.test(txt) && txt.length <= 480
          ? txt : "Hierzu finde ich noch keine ausreichend eindeutige Textgrundlage. Bitte formuliere die Frage genauer oder verlange eine konkrete Fundstelle.";
      }
      // MAJLIS SOURCES-FIRST V1353: when Gemini is unavailable, show an
      // independently readable synthesis of ALL verified relevant quotations.
      // This is source exposition, not a newly invented fatwa.
      var proofs = (reply.evidences||[]).filter(function(e) {
        return e.verification_status === "verified" && (e.deep_link || (e.route && e.route.view === "quran-surah")) && e.statement && e.statement.length >= 24;
      }).slice(0,3);
      if (proofs.length >= 2) {
        return "Die belegten Überlieferungen unterscheiden folgende Sachverhalte: " +
          proofs.map(function(source,i) {
            return "["+(i+1)+"] "+clip(source.statement,390) + " (" + sourceTitle(source) + ").";
          }).join("\n\n") +
          "\n\nFür eine Beurteilung des persönlichen Einzelfalls müssen der tatsächliche Grund und die Umstände geprüft werden. Wa-Allāhu aʿlam.";
      }
      // MAJLIS EVIDENCE-FIRST V1351: while an answer is being composed,
      // present the verified source excerpt immediately instead of a bare spinner.
      // Do not invent a ruling or claim that a German paraphrase is original Arabic.
      if (ev.verification_status === "verified" && ev.deep_link) {
        var excerpt = clip(ev.statement, 470);
        var reference = sourceTitle(ev);
        return "Der überprüfbar referenzierte Quellenauszug lautet sinngemäß: „" + excerpt + "“" +
          (reference ? " (" + reference + ")." : ".") +
          (reply._ilmComposing
            ? " Ich gleiche die genaue Fragestellung noch mit den Belegen ab."
            : " Eine weitergehende rechtliche Einordnung benötigt zusätzliche einschlägige Belege. Wa-Allāhu aʿlam.");
      }
      return "Die gefundenen Auszüge sind noch nicht ausreichend überprüft. Ich gebe sie nicht als gesicherte religiöse Beweise aus. Wa-Allāhu aʿlam.";
    }
    function sourceDisclosure(reply, openProof) {
      var list = (reply.evidences || []).filter(function (e) { return e.verification_status === "verified" && !!e.statement && (e.deep_link || (e.route && e.route.view === "quran-surah")); });
      if (!list.length) return "";
      var count = openProof ? Math.min(5, list.length) : Math.min(Math.max(2,Number(reply._ilmCitationCount)||0,Number(reply._ilmRequestedEvidenceCount)||0),list.length);
      return '<details class="ilm-science-sources"' + (openProof ? ' open' : '') + '>' +
        '<summary><span class="ilm-science-source-icon" aria-hidden="true">⌁</span>' +
        '<span>' + (openProof ? "Originalbelege und Quellen" : "Belege und Fundstellen") +
        '</span><small>' + count + ' von ' + list.length + '</small><span class="ilm-science-chevron" aria-hidden="true">⌄</span></summary>' +
        '<div class="ilm-science-source-list">' +
        list.slice(0, count).map(function (e, i) {
          var label = e.verification_status === "verified" ? "Direktquelle hinterlegt" :
            e.verification_status === "partially_verified" ? "Fundstelle noch zu prüfen" : "Angabe nicht unabhängig verifiziert";
          return '<div class="ilm-science-source-item"><p class="ilm-science-index">Beleg ' + (i + 1) + '</p>' + renderEvidence(e, i) +
            '<p class="ilm-science-proof-status">' + esc(label) + '</p></div>';
        }).join("") + '</div></details>';
    }
    /* MAJLIS OPEN RESEARCH V1352
       When the internal catalogue has no verified relevant proof, ask the
       TEST Worker to search new primary sources. Never answer from unverified
       Google text or from the model's memory. */
    var ilmOpenResearchSerial = 0;
    function requestIlmOpenResearch(reply, question) {
      if (!reply || !navigator.onLine || !String(question||"").trim()) return;
      var id = "ilm-research-open-" + (++ilmOpenResearchSerial);
      reply._ilmAnswerId = id;
      reply._ilmResearching = true;
      reply._ilmResearchProgress = "Ich suche nach Quellen in der App und in externen Originalwerken …";
      reply._ilmNoRelevantEvidence = false;
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      // Gemini discovers cited sources; Groq may compose ONLY after Free-plan authorization.
      var timer = setTimeout(function(){ if(ctrl) ctrl.abort(); },55000);
      var started = Date.now();
      var progress = setInterval(function(){
        if(!reply._ilmResearching){clearInterval(progress);return;}
        var elapsed = Date.now()-started;
        reply._ilmResearchProgress = elapsed < 14000
          ? "Ich gleiche die Frage mit Quellen und Originaltexten ab …"
          : elapsed < 30000
            ? "Die Prüfung dauert etwas länger. Ich gleiche weitere Fundstellen ab …"
            : elapsed < 48000
              ? "Vertiefte Recherche: weitere Quellen und Nachweise werden geprüft …"
              : "Die Recherche läuft weiter. Ich überprüfe, was sich tatsächlich belegen lässt …";
        repaint();
      },6000);
      function repaint() {
        var node = document.querySelector('[data-ilm-answer-id="' + id + '"] .ilm-answer-text');
        if(node && document.body.classList.contains("is-ilm-chat-route")) {
          node.innerHTML = window.renderIlmAnswerText(reply);
        }
      }
      fetch("/test/api/ilm/research", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({question:String(question).slice(0,550),mode:(reply._ilmSourceOnly||proofIntent(question))?"sources":(reply._ilmAnswerMode||"detailed")}),
        signal:ctrl ? ctrl.signal : undefined
      }).then(function(response){
        return response.json().catch(function(){return {ok:false,error:"research_unavailable"};});
      }).then(function(data){
        if(!data || !data.ok || !Array.isArray(data.sources) || !data.sources.length ||
            typeof data.answer !== "string") {
          reply._ilmResearchError = data && (data.error === "rate_limited" || data.error === "gemini_quota_exhausted")
            ? "Das verfügbare Gemini-Kontingent ist derzeit ausgeschöpft. Ich verwende weiterhin unsere geprüften internen Quellen. Es wird kein kostenpflichtiger Ersatzdienst gestartet."
            : "Die Gemini-Recherche konnte diese Frage momentan nicht mit neuen Originalfundstellen beantworten. Unsere vorhandenen Quellen bleiben verfügbar; ich erfinde keine Nachweise.";
          return;
        }
        var evidence = data.sources.map(function(source){
          var record = toEvidence(source,"internal");
          record.source_domain = "extern-quelle-geprüft";
          return record;
        }).filter(function(source){
          return source.verification_status === "verified" && !!source.statement && !!source.deep_link;
        }).slice(0,3);
        if(!evidence.length) {
          reply._ilmResearchError = "Die gefundenen Quellen konnten nicht zuverlässig geöffnet oder überprüft werden. Wa-Allāhu aʿlam.";
          return;
        }
        var answer = String(data.answer).replace(/<[^>]*>/g,"").trim().slice(0,1700);
        if(answer.length < 25 || /\[(?:[4-9]|\d{2,})\]/.test(answer)) {
          reply._ilmResearchError = "Die recherchierten Fundstellen sind verfügbar, die Antwort ist aber noch nicht ausreichend sicher. Wa-Allāhu aʿlam.";
          return;
        }
        reply.evidences = evidence;
        reply._ilmGeneratedText = answer;
        reply._ilmProvider = data.provider === "gemini" ? "Gemini" : data.provider === "groq" ? "Groq" : "";
        reply._ilmSourceAutoOpen = true;
        reply._ilmCitationCount = evidence.length;
        reply._ilmNoRelevantEvidence = false;
        reply._ilmResearchError = "";
      }).catch(function(){
        reply._ilmResearchError = "Die externe Recherche ist derzeit nicht erreichbar. Ich bleibe bei nachprüfbaren Fundstellen. Wa-Allāhu aʿlam.";
      }).finally(function(){
        clearTimeout(timer);
        clearInterval(progress);
        reply._ilmResearchProgress = "";
        reply._ilmResearching = false;
        reply._ilmNoRelevantEvidence = !(reply.evidences||[]).some(function(e){return e.verification_status === "verified";});
        repaint();
      });
    }
    var scienceAnswerSerial = 0;
    function requestScienceComposition(reply, question) {
      if (!reply || proofIntent(question) || reply._ilmSourceOnly || !navigator.onLine) return;
      var rows = (reply.evidences || []).filter(function (e) { return e.verification_status === "verified" && (e.deep_link || (e.route && e.route.view === "quran-surah")) && e.statement && e.statement.length >= 18; }).slice(0,3);
      if (!rows.length) return;
      var requestId = "ilm-science-" + (++scienceAnswerSerial);
      reply._ilmAnswerId = requestId;
      reply._ilmComposing = true;
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 26000);
      fetch("/test/api/ilm/compose", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          question:String(question || "").slice(0,550),
          mode:reply._ilmAnswerMode || "detailed",
          evidence:rows.map(function (e) {
            return {
              speaker:e.speaker, work:e.work, reference:e.reference || e.work,
              authenticity:e.authenticity, verification_status:e.verification_status,
              statement:e.statement.slice(0,900)
            };
          })
        }),
        signal:ctrl ? ctrl.signal : undefined
      }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.ok || typeof data.answer !== "string") return;
          var answer = String(data.answer).replace(/<[^>]*>/g, "").replace(/\r\n/g, "\n").trim().slice(0,1650);
          if (answer.length < 35 || /\[(?:[4-9]|\d{2,})\]/.test(answer)) return;
          if (reply._ilmCoreAdab && !/(?:adab|anstand|benehmen|charakter|verhalten|umgang|akhl[aā]q)/i.test(answer)) return;
          reply._ilmGeneratedText = answer;
          reply._ilmProvider = data.provider === "gemini" ? "Gemini" : data.provider === "groq" ? "Groq" : "";
          reply._ilmCitationCount = rows.length;
          var node = document.querySelector('[data-ilm-answer-id="' + requestId + '"] .ilm-answer-text');
          if (node && document.body.classList.contains("is-ilm-chat-route")) {
            node.innerHTML = window.renderIlmAnswerText(reply);
          }
        }).catch(function () {}).finally(function () {
          clearTimeout(timer);
          reply._ilmComposing = false;
          if (!reply._ilmGeneratedText) {
            var node = document.querySelector('[data-ilm-answer-id="' + requestId + '"] .ilm-answer-text');
            if (node && document.body.classList.contains("is-ilm-chat-route")) {
              node.innerHTML = window.renderIlmAnswerText(reply);
            }
          }
        });
    }
    window.renderIlmAnswerText = function (reply) {
      if (!reply) return "";
      if (reply.status === "conversation" || reply.status === "clarification" || reply.status === "abuse") {
        var conversational = String(reply.directAnswer || reply.intro || "");
        return (reply._ilmGreetingPrefix ? '<p class="ilm-greeting-inline">' + esc(reply._ilmGreetingPrefix) + "</p>" : "") + '<div class="ilm-science-prose"><p>' + em(conversational) + "</p></div>";
      }
      var isProof = (proofIntent(reply._ilmOriginalQuestion || reply._ilmQuestion) || !!reply._ilmSourceOnly) && !reply._ilmTawhidFollowup;
      var anyProof = (reply.evidences || []).some(function(e){return e && e.statement && e.statement.length >= 18;});
      var countAsked = Number(reply._ilmRequestedEvidenceCount || 0);
      var verifiedSources = (reply.evidences || []).filter(function(e) {
        return e && e.verification_status === "verified" && e.statement && e.statement.length >= 18;
      }).length;
      var answer = reply._ilmResearching
        ? (reply._ilmResearchProgress || "Ich suche ergänzende Originalquellen und prüfe ihre Fundstellen …")
        : reply._ilmResearchError ? reply._ilmResearchError
        : isProof && reply._ilmGeneratedText
        ? reply._ilmGeneratedText
        : isProof
        ? (!anyProof ? "Zu dieser Frage liegen aktuell keine ausreichend belegten Originalstellen vor. Ich möchte keine Beweise erfinden."
          : countAsked > verifiedSources
            ? "Ich kann derzeit " + verifiedSources + " überprüfte " +
              (verifiedSources === 1 ? "Fundstelle" : "Fundstellen") +
              " zeigen. Weitere verlangte Belege sind bislang nicht ausreichend überprüft. Unten findest du die vorhandenen Fundstellen mit ihrem Prüfstatus."
            : "Hier sind die gefundenen Aussagen und ihre Fundstellen. Beachte den Prüfstatus jeder Quelle.")
        : (reply._ilmGeneratedText || shortScientificAnswer(reply));
      if (reply._ilmTawhidFollowup === "depth") {
        answer = "Tawḥīd ist das Bekenntnis zur Einzigkeit Allahs. Dazu gehört, dass Allah allein der Herr und Schöpfer ist, dass Ihm allein die Anbetung zusteht und dass Seine Namen und Eigenschaften gemäß Qurʾān und authentischer Sunnah bejaht werden.\n\nDie genannten Qurʾān-Stellen bilden hierfür grundlegende Belege. Die vollständigen Verse kannst du direkt in der App öffnen.";
      } else if (reply._ilmTawhidFollowup === "proof") {
        answer = "Hier findest du zusätzliche Qurʾān-Stellen zur Einzigkeit Allahs und dazu, dass Ihm allein die Anbetung zusteht. Öffne die Verse, um den vollständigen Wortlaut nachzulesen.";
      }
      if (reply._ilmIsDiscovery) answer = reply._ilmDiscovery.length
        ? "Ich habe dazu passende Inhalte in der App gefunden. Öffne einen Treffer, um den vollständigen Beitrag oder die Qurʾān-Stelle direkt zu lesen."
        : "Ich finde zu dieser Suche momentan keinen direkt öffnungsfähigen Treffer. Versuche einen konkreteren Begriff oder eine andere Schreibweise.";
      var html = (reply._ilmGreetingPrefix ? '<p class="ilm-greeting-inline">' + esc(reply._ilmGreetingPrefix) + '</p>' : '') + '<div class="ilm-science-prose">' + answer.split(/\n{2,}/).filter(Boolean).map(function (p) {
        var enriched = em(p.trim());
        if (reply._ilmCitationCount) {
          enriched = enriched.replace(/\[([1-3])\]/g,function(match,n){
            return Number(n) <= reply._ilmCitationCount
              ? '<button class="ilm-citation-ref" type="button" data-ilm-reveal-proof="' + n + '" aria-label="Beleg ' + n + ' öffnen">[' + n + ']</button>'
              : match;
          });
        }
        return '<p>' + enriched + '</p>';
      }).join("") + '</div>';
      if (reply._ilmBasicTawhid || reply._ilmTawhidFollowup) html += ilmScriptureLinks(!!reply._ilmTawhidFollowup);
      if (reply._ilmBasicIman) html += ilmImanScriptureLinks();
      if (!reply._ilmBasicTawhid && !reply._ilmBasicIman && !reply._ilmTawhidFollowup) html += discoverySection(reply);
      if (!reply._ilmIsDiscovery && !reply._ilmBasicTawhid && !reply._ilmBasicIman && !reply._ilmTawhidFollowup) html += sourceDisclosure(reply, isProof || !!reply._ilmSourceAutoOpen);
      if (reply._ilmStudyReminder) html += '<aside class="ilm-study-reminder" aria-label="Hinweis zum Weiterlernen">' +
        '<p>' + esc(reply._ilmStudyReminder) + '</p></aside>';
      var follows = reply._ilmBasicTawhid
        ? ["Zeige mir weitere Belege für Tawḥīd", "Erkläre Tawḥīd ausführlicher"]
        : reply._ilmIsDiscovery
        ? ["Erkläre mir das Thema", "Zeige mir den exakten Beweis"]
        : isProof
        ? ["Erkläre mir diese Belege verständlich", "Zeige weitere Belege zu meiner Frage"]
        : ["Zeige mir den exakten Wortlaut und Beweis", "Erkläre das genauer"];
      function actionLabel(x) {
        if (/weitere belege für taw/i.test(x)) return "Weitere Belege";
        if (/tawḥīd ausführlicher/i.test(x)) return "Tawḥīd vertiefen";
        if (/exakten wortlaut/i.test(x)) return "Wortlaut & Beweis";
        if (/erkläre das genauer/i.test(x)) return "Mehr erklären";
        if (/erkläre mir diese belege/i.test(x)) return "Belege erklären";
        if (/weitere belege zu meiner/i.test(x)) return "Weitere Fundstellen";
        if (/erkläre mir das thema/i.test(x)) return "Thema erklären";
        if (/exakten beweis/i.test(x)) return "Exakter Beweis";
        return x;
      }
      html += '<div class="ilm-science-actions" aria-label="Frage vertiefen">' + follows.map(function (x) {
        return '<button class="ilm-quick-follow" type="button" data-ilm-follow="' + esc(x) + '">' + esc(actionLabel(x)) + '</button>';
      }).join("") + "</div>";
      return html;
    };

    var oldAssist = window.renderIlmAssistantMessage;
    window.renderIlmAssistantMessage = function (message, isFirst) {
      var reply = message.reply || {};
      return (
        '<article class="ilm-assistant-message" data-ilm-assistant="' + esc(message.id) + '"' + (reply._ilmAnswerId ? ' data-ilm-answer-id="' + esc(reply._ilmAnswerId) + '"' : "") + (reply._ilmQuestion ? ' data-ilm-parent-question="' + esc(reply._ilmQuestion.slice(0,480)) + '"' : "") + '>' +
          '<p class="ilm-science-assistant-label">ʿILM <span>·</span> DĀR AL TAWḤĪD</p>' +
          '<div class="ilm-answer-text">' + window.renderIlmAnswerText(reply, isFirst) + "</div>" +
        "</article>"
      );
    };

    var oldWelcome = window.renderIlmWelcomeState;
    window.renderIlmWelcomeState = function () {
      var prompts = [
        ["Was ist Tawḥīd?", "Wissen verstehen"],
        ["Wo finde ich Belege zur Erhabenheit Allahs?", "In der App suchen"]
      ];
      return (
        '<div class="ilm-welcome ilm-welcome--majlis">' +
          '<section class="ilm-welcome-intro" aria-label="ʿIlm Wissensbereich">' +
            '<p class="ilm-welcome-kicker">DĀR AL TAWḤĪD · WISSENSBEREICH</p>' +
            '<h2>Frage mit Belegen</h2>' +
            '<p class="ilm-welcome-lead">Qurʾān, authentische Sunnah und Aussagen der frühen Generationen – klar geordnet und mit überprüfbaren Fundstellen.</p>' +
            '<div class="ilm-welcome-trust" aria-label="Quellenrahmen">' +
              '<span>Qurʾān</span><span>Sunnah</span><span>Salaf</span>' +
            '</div>' +
          '</section>' +
          '<section class="ilm-welcome-prompts" aria-label="Fragevorschläge">' +
            '<div class="ilm-welcome-prompts-head">' +
              '<div><h3>Frage stellen</h3><p>Wähle einen Einstieg oder schreibe unten deine eigene Frage.</p></div>' +
              '<span>Geprüfte Quellen</span>' +
            '</div>' +
            '<div class="ilm-welcome-examples-v1341" aria-label="Beispielfragen">' +
              prompts.map(function (item) {
                return '<button class="ilm-welcome-example-v1341" type="button" data-ilm-starter="' + esc(item[0]) + '">' +
                  '<span class="ilm-welcome-example-text-v1341"><small>' + esc(item[1]) + '</small><b>' + esc(item[0]) + '</b></span>' +
                  '<span class="ilm-welcome-example-arrow-v1341" aria-hidden="true">↗</span>' +
                '</button>';
              }).join("") +
            '</div>' +
          '</section>' +
          '<section class="ilm-welcome-paths" aria-label="Wissenswege">' +
            '<div class="ilm-welcome-paths-head"><h3>Wissenswege</h3><span>Weiter vertiefen</span></div>' +
            '<div class="ilm-welcome-path-grid">' +
              '<button type="button" class="ilm-welcome-path" data-nav="scholars"><span><b>Gelehrte</b><small>Frühe Imāme und Überlieferer</small></span><i aria-hidden="true">→</i></button>' +
              '<button type="button" class="ilm-welcome-path" data-nav="topics"><span><b>Themen</b><small>ʿAqīdah, Tawḥīd und Manhaj</small></span><i aria-hidden="true">→</i></button>' +
              '<button type="button" class="ilm-welcome-path" data-nav="hadith"><span><b>Ḥadīṯ</b><small>Sammlungen und Überlieferungen</small></span><i aria-hidden="true">→</i></button>' +
              '<button type="button" class="ilm-welcome-path" data-nav="bibliothek"><span><b>Bibliothek</b><small>PDFs, Abhandlungen und Quellen</small></span><i aria-hidden="true">→</i></button>' +
            '</div>' +
          '</section>' +
        '</div>'
      );
    };

    /* MAJLIS CHAT ARCHIVE V1338: archive whole earlier Q/A turns, not separate tall bubbles. */
    var expandedPastAnswers = Object.create(null);
    var archiveOpen = false;
    document.addEventListener("toggle",function(ev) {
      var elem = ev.target;
      if (!elem || !elem.matches) return;
      if (elem.matches("details.ilm-history-archive")) {
        archiveOpen = !!elem.open;
      } else if (elem.matches("details.ilm-history-turn")) {
        var id = elem.getAttribute("data-ilm-history-id") || "";
        if (id) expandedPastAnswers[id] = !!elem.open;
      }
    },true);
    var oldMsgs = window.renderIlmMessages;
    window.renderIlmMessages = function (conversation) {
      var messages = Array.isArray(conversation && conversation.messages) ? conversation.messages : [];
      if (!messages.length) return window.renderIlmWelcomeState();
      var latestUser = -1;
      messages.forEach(function(m,i) { if (m.role === "user") latestUser = i; });
      var phaseMap = {
        internal: ["Quellen werden geprüft …", "Qurʾān & Sunnah"],
        external: ["Quellen werden geprüft …", "Frühe Quellen"],
        compose: ["Fundstellen prüfen", "Geprüfte Quellen werden durchsucht …"]
      };
      function regularMessage(message) {
        if (message.role === "user") {
          return '<div class="ilm-user-row"><div class="ilm-user-bubble">' + esc(message.content || "") + "</div></div>";
        }
        if (message.role === "loading") {
          var ph = phaseMap[message.phase] || phaseMap.internal;
          return '<div class="ilm-loading-row"><span class="ilm-dots"><i></i><i></i><i></i></span>' +
            "<span>" + esc(ph[0]) + '</span><span class="ilm-loading-sub">' + esc(ph[1]) + "</span></div>";
        }
        return window.renderIlmAssistantMessage(message,false);
      }
      // If no user message exists, keep the original renderer behavior.
      if (latestUser < 0) return messages.map(regularMessage).join("");
      var older = messages.slice(0,latestUser);
      var archive = "";
      if (older.length) {
        var turns = [];
        var current = null;
        older.forEach(function(m,index) {
          if (m.role === "user") {
            if (current) turns.push(current);
            current = {id:String(m.id || index),question:String(m.content || "Frühere Frage"),answers:[],answerKeys:Object.create(null)};
          } else if (m.role !== "loading") {
            if (!current) current = {id:"older-" + index,question:"Frühere Antwort",answers:[],answerKeys:Object.create(null)};
            var archivedSignature = m.role === "assistant"
              ? String(window.renderIlmAnswerText(m.reply || {})).replace(/\s+/g," ").trim() : "";
            if (!archivedSignature || !current.answerKeys[archivedSignature]) {
              current.answers.push(regularMessage(m));
              if (archivedSignature) current.answerKeys[archivedSignature] = true;
            }
          }
        });
        if (current) turns.push(current);
        if (turns.length) {
          archive = '<details class="ilm-history-archive"' + (archiveOpen ? ' open' : '') +
            '><summary><span class="ilm-history-archive-icon" aria-hidden="true">↶</span>' +
            '<span class="ilm-history-archive-label">Frühere Fragen</span>' +
            '<small>' + turns.length + '</small>' +
            '<span class="ilm-history-archive-chevron" aria-hidden="true">⌄</span></summary>' +
            '<div class="ilm-history-archive-list">' +
            turns.map(function(t,i) {
              var id = esc(t.id);
              return '<details class="ilm-history-turn" data-ilm-history-id="' + id + '"' +
                (expandedPastAnswers[t.id] ? ' open' : '') + '><summary>' +
                '<span class="ilm-history-turn-index">' + String(i+1).padStart(2,"0") + '</span>' +
                '<span class="ilm-history-turn-question">' + esc(clip(t.question,125)) + '</span>' +
                '<span class="ilm-history-turn-chevron" aria-hidden="true">⌄</span></summary>' +
                '<div class="ilm-history-turn-content">' +
                (t.answers.join("") || '<p class="ilm-history-no-answer">Für diese Frage liegt noch keine gespeicherte Antwort vor.</p>') +
                '</div></details>';
            }).join("") +
            '</div></details>';
        }
      }
      // Only display one instance of an identical assistant answer within ONE
      // user turn. Different questions remain separate, even if asked repeatedly.
      // Some legacy flows append the same reply twice while completing research.
      function replySignature(message) {
        if (!message || message.role !== "assistant") return "";
        var rendered = window.renderIlmAnswerText(message.reply || {});
        return String(rendered || "").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/g," ")
          .replace(/\s+/g," ").trim();
      }
      function uniqueCurrentTurn(items) {
        var seen = Object.create(null);
        return items.filter(function(message) {
          if (!message || message.role === "user") { seen = Object.create(null); return true; }
          if (message.role === "loading") return true;
          if (message.role !== "assistant") return true;
          var signature = replySignature(message);
          if (!signature) return true;
          if (seen[signature]) return false;
          seen[signature] = true;
          return true;
        });
      }
      return archive + uniqueCurrentTurn(messages.slice(latestUser)).map(regularMessage).join("");
    };

    /* MAJLIS GREETING QUESTION V1344: parse the complete visitor intent. */
    function splitIlmGreeting(value) {
      var full = String(value || "").trim();
      var salutation = /^(?:as[\s-]*sal[aā]m(?:u)?|assal[aā]m(?:u)?|sal[aā]m(?:un)?|selam(?:un)?|السَّلَامُ|السلام)(?=[\s,.;!؟،]|$)/i.test(full);
      if (!salutation) return {greeting:false,question:full};
      var question = /(?:\bwas\s+(?:ist|sind|bedeutet|heißt|hat|sagte|sagt|gilt)\b|\b(?:wie|wo|wann|warum|wieso|wer|wen|welche[rsnm]?|welchen)\b|\b(?:erkl[aä]r|zeige|zeig|gib|finde|suche|kannst\s+du|darf|muss|soll|ich\s+m[oö]chte\s+wissen)\b)/i.exec(full);
      if (!question || question.index < 8) return {greeting:true,question:""};
      return {greeting:true,question:full.slice(question.index).replace(/^[\s,.;!؟،:]+/,"").trim()};
    }
    function ilmQueryWithoutGreeting(input) {
      var p = splitIlmGreeting(input);
      return p.question || String(input || "");
    }
    /* MAJLIS CONVERSATION INTENT V1349
       General-purpose follow-up context, without a domain-specific answer list.
       Read only the most recent user questions of this conversation. */
    function ilmFollowupIntent(value) {
      var q = ilmNormalize(value);
      // Follow-up requires a conversational reference or a short evidence request.
      // A complete new question ("Warum ist X ...?", "Wie funktioniert X?")
      // must never inherit a previous, unrelated topic.
      var referenced = /\b(das|dazu|daruber|darauf|diese|dieser|diesen|davon|dort|genannten|vorigen|letzten|er|ihn)\b/.test(q);
      var evidence = /^(?:(?:und |noch )?(?:gib|zeige|zeig|nenne|finde|suche) (?:mir )?(?:noch |weitere |andere |zwei |drei |vier |funf |5 |2 |3 )?(?:beweise|belege|quellen|uberlieferungen|aussagen|meinungen|fundstellen)(?: dazu)?|(?:quelle|belege|beweise|weitere quellen|mehr quellen|weitere belege) dazu)$/i.test(q);
      var shortRef = /^(?:(?:und |aber |doch )?(?:wer|welcher|welche|welchen|warum|wieso|weshalb|wo|wie) (?:hat (?:das|er)|sagte (?:das|er)|stehen (?:die|diese)|ist (?:das|dieser)|gibt es (?:daruber|dazu)|war(?:um)? (?:dieser|diese)|(?:sahabi|tabiin|salaf) (?:hat|sagte)))/i.test(q);
      var shortReference = /^(?:(?:und )?was (?:ist|bedeutet) (?:damit|dazu)(?: |$)|(?:und )?was ist das$|(?:warum|wieso) (?:gab es|gibt es) (?:daruber |dazu |diesen |einen )?(?:ikhtilaf|streit|unterschied)|(?:welche|welcher|welchen|wie viele) (?:belege|beweise|quellen|aussagen|uberlieferungen|meinungen|gelehrten|gelehrte) (?:gibt es )?(?:dazu|daruber)(?: [0-9]+)?$)/i.test(q);
      return evidence || (referenced && (shortRef || shortReference)) ||
        /^(?:warum (?:gab es |gibt es )?(?:diesen |einen )?ikhtilaf|welcher (?:sahabi|tabiin|gelehrte) (?:sagte|hat)|noch mehr|weiter|mehr dazu)$/i.test(q);
    }
    function ilmRecentTopic(value, conversation) {
      var current = ilmNormalize(value);
      var messages = conversation && Array.isArray(conversation.messages) ? conversation.messages : [];
      for (var i = messages.length - 1, scanned = 0; i >= 0 && scanned < 70; i--, scanned++) {
        var m = messages[i];
        if (!m || m.role !== "user") continue;
        var candidate = ilmQueryWithoutGreeting(String(m.content || "")).trim();
        if (!candidate || ilmNormalize(candidate) === current || ilmFollowupIntent(candidate)) continue;
        if (ilmQuestionTerms(candidate).length && candidate.length >= 8) return candidate.slice(0,250);
      }
      return "";
    }
    function ilmResolvedQuery(value, conversation) {
      var current = ilmQueryWithoutGreeting(String(value || "")).trim();
      if (!ilmFollowupIntent(current)) return current;
      var subject = ilmRecentTopic(current,conversation);
      return subject ? "Ausgangsfrage: " + subject.replace(/[.!?]+$/,"") + ". Nachfrage dazu: " + current : current;
    }
    function ilmPriorTurnEvidence(conversation) {
      var messages = conversation && Array.isArray(conversation.messages) ? conversation.messages : [];
      for (var i = messages.length-1, n=0; i>=0 && n<16; i--,n++) {
        var m = messages[i];
        if (!m || m.role !== "assistant" || !m.reply) continue;
        var evidence = Array.isArray(m.reply.evidences) ? m.reply.evidences : [];
        // Carry over only items that still include an actual excerpt and reference.
        var items = evidence.filter(function(e) {
          return e && e.statement && e.statement.length >= 18
            && (e.reference || e.work) && e.verification_status === "verified";
        }).slice(0,4);
        if (items.length) return items;
      }
      return [];
    }
    function ilmRequestedEvidenceCount(question) {
      var q = ilmNormalize(question);
      if (!/(?:beweis|beleg|quelle|uberlieferung|aussage|fundstelle)/.test(q)) return 0;
      var m = /(?:^| )(ein|eine|einen|zwei|drei|vier|funf|1|2|3|4|5)(?: |$)/.exec(q);
      return m ? ({ein:1,eine:1,einen:1,zwei:2,drei:3,vier:4,funf:5}[m[1]] || Number(m[1]) || 0) : 0;
    }
    function ilmStudyReminder(value, conversation) {
      if (!conversation || !Array.isArray(conversation.messages)) return "";
      var current = ilmNormalize(ilmQueryWithoutGreeting(value));
      if (!ilmFollowupIntent(current)) return "";
      var count = 1;
      var messages = conversation.messages;
      var skippedCurrent = false;
      for (var i = messages.length - 1; i >= 0 && count < 76; i--) {
        var message = messages[i];
        if (!message || message.role !== "user") continue;
        var older = ilmNormalize(ilmQueryWithoutGreeting(String(message.content || "")));
        if (!older) continue;
        if (!skippedCurrent && older === current) {skippedCurrent=true;continue;}
        count++;
        // Only count the current connected chain back to its original question.
        if (!ilmFollowupIntent(older)) break;
      }
      if (count < 25 || count % 25 !== 0) return "";
      return "Wir haben dieses Thema schon aus verschiedenen Blickwinkeln betrachtet. Vielleicht hilft es, die bisherigen Belege in Ruhe durchzugehen. Ich kann sie dir kurz zusammenfassen; du kannst selbstverständlich jederzeit weiterfragen.";
    }
    function isBasicImanQuestion(value) {
      var q = ilmNormalize(value);
      return /(?:^| )(?:was (?:ist|bedeutet)|was versteht man unter|erklare|definition von) (?:den |die |das )?(?:iman|iiman)(?: |$)/.test(q)
        && !/(?:beweis|belege|quellen|wo finde|hadith nummer|wortlaut|ausfuhrlich)/.test(q);
    }
    /* MAJLIS VERIFIED CORE V1350 — small source-checked regression corpus.
       These are documentary records, not generated fatawa; expandable only after
       checking a primary work, its exact passage, and its direct source URL. */
    var ilmVerifiedCoreSources = [
      {
        id:"bukhari-703-ibn-umar-ruku-hands",
        kind:"sunnah",
        title:"Händeheben im Gebet beim Rukūʿ und beim Aufrichten",
        speaker:"ʿAbdullāh ibn ʿUmar",
        work:"Ṣaḥīḥ al-Buḫārī",
        reference:"Kitāb Ṣifat aṣ-Ṣalāh · Bāb Rafʿ al-Yadayn · Bericht 703 (Islamweb-Zählung)",
        chapter:"Heben der Hände beim Takbīr, Rukūʿ und Aufrichten",
        excerpt:"Ich sah den Gesandten Allahs ﷺ beim Stehen zum Gebet seine Hände bis auf Schulterhöhe heben. Er hob die Hände auch beim Takbīr zum Rukūʿ und wenn er seinen Kopf aus dem Rukūʿ erhob. Bei der Niederwerfung tat er das nicht.",
        authenticity:"ṣaḥīḥ",
        verification_status:"verified",
        url:"https://www.islamweb.net/ar/library/content/0/704/%D8%A8%D8%A7%D8%A8-%D8%B1%D9%81%D8%B9-%D8%A7%D9%84%D9%8A%D8%AF%D9%8A%D9%86-%D8%A5%D8%B0%D8%A7-%D9%83%D8%A8%D8%B1-%D9%88%D8%A5%D8%B0%D8%A7-%D8%B1%D9%83%D8%B9-%D9%88%D8%A5%D8%B0%D8%A7-%D8%B1%D9%81%D8%B9#:~:text=%D8%A5%D8%B0%D8%A7%20%D8%B1%D9%81%D8%B9%20%D8%B1%D8%A3%D8%B3%D9%87%20%D9%85%D9%86%20%D8%A7%D9%84%D8%B1%D9%83%D9%88%D8%B9"
      },
      {
        id:"bukhari-704-malik-ruku-hands",
        kind:"sunnah",
        title:"Händeheben beim Rukūʿ und nach dem Aufrichten",
        speaker:"Abū Qilābah über Mālik ibn al-Ḥuwayriṯ",
        work:"Ṣaḥīḥ al-Buḫārī",
        reference:"Kitāb Ṣifat aṣ-Ṣalāh · Bāb Rafʿ al-Yadayn · Bericht 704 (Islamweb-Zählung)",
        chapter:"Heben der Hände beim Takbīr, Rukūʿ und Aufrichten",
        excerpt:"Mālik ibn al-Ḥuwayriṯ hob beim Gebet die Hände zum Takbīr, vor dem Rukūʿ und nachdem er seinen Kopf aus dem Rukūʿ erhoben hatte. Er berichtete, dass der Gesandte Allahs ﷺ ebenso handelte.",
        authenticity:"ṣaḥīḥ",
        verification_status:"verified",
        url:"https://islamweb.net/ar/library/content/0/705/%D8%A8%D8%A7%D8%A8-%D8%B1%D9%81%D8%B9-%D8%A7%D9%84%D9%8A%D8%AF%D9%8A%D9%86-%D8%A5%D8%B0%D8%A7-%D9%83%D8%A8%D8%B1-%D9%88%D8%A5%D8%B0%D8%A7-%D8%B1%D9%83%D8%B9-%D9%88%D8%A5%D8%B0%D8%A7-%D8%B1%D9%81%D8%B9#:~:text=%D8%A5%D8%B0%D8%A7%20%D8%B1%D9%81%D8%B9%20%D8%B1%D8%A3%D8%B3%D9%87%20%D9%85%D9%86%20%D8%A7%D9%84%D8%B1%D9%83%D9%88%D8%B9%20%D8%B1%D9%81%D8%B9%20%D9%8A%D8%AF%D9%8A%D9%87"
      },
      {
        id:"bukhari-5273-khul-thabit-wife",
        kind:"sunnah",
        title:"Frau fordert Scheidung: Ḫulʿ bei ernsthafter Sorge um Pflichten in der Ehe",
        speaker:"ʿAbdullāh ibn ʿAbbās",
        work:"Ṣaḥīḥ al-Buḫārī",
        reference:"Nr. 5273 · Kitāb aṭ-Ṭalāq · Bāb al-Ḫulʿ",
        chapter:"Die Trennung durch Ḫulʿ",
        excerpt:"Die Ehefrau von Ṯābit ibn Qays sagte, sie beanstande weder seine Religion noch seinen Charakter, fürchte aber, ihre ehelichen Pflichten nicht erfüllen zu können. Der Prophet ﷺ fragte nach der Rückgabe seines Gartens; sie stimmte zu, und er wies Ṯābit an, den Garten anzunehmen und die Trennung auszusprechen. Das belegt die Zulässigkeit eines begründeten Ḫulʿ.",
        authenticity:"ṣaḥīḥ · Ṣaḥīḥ al-Buḫārī",
        verification_status:"verified",
        url:"https://dorar.net/h/obOg709f#:~:text="+encodeURIComponent("أتَرُدِّينَ عليه حَديقَتَه")
      },
      {
        id:"tirmidhi-1187-divorce-without-reason",
        kind:"sunnah",
        title:"Frau verlangt Scheidung ohne anerkannten Grund: Warnung des Propheten ﷺ",
        speaker:"Ṯawbān",
        work:"Sunan at-Tirmiḏī",
        reference:"Nr. 1187 · auch Sunan Abī Dāwūd Nr. 2226",
        chapter:"Scheidung ohne anerkannten Grund",
        excerpt:"Der Prophet ﷺ warnte ausdrücklich vor der Frau, die ohne anerkannten ernsthaften Grund von ihrem Mann die Scheidung fordert. Die Warnung richtet sich nicht pauschal gegen jede Frau, die eine Trennung erbitten muss. At-Tirmiḏī bezeichnete die Überlieferung als ḥasan; die genannte Fassung wird über Ṯawbān berichtet.",
        authenticity:"ḥasan · Bewertung durch at-Tirmiḏī",
        verification_status:"verified",
        url:"https://dorar.net/h/gvODSfk9#:~:text="+encodeURIComponent("أيما امرأةٍ سألت زوجها طلاقًا من غير بأسٍ")
      }
    ];
    if (typeof window.searchIlmKnowledge === "function") {
      var oldSearch = window.searchIlmKnowledge;
      window.searchIlmKnowledge = async function (question, conversation, options) {
        question = ilmResolvedQuery(question, conversation);
        var list = await oldSearch(question, conversation, options);
        // Add a targeted second lexical query for historical/diacritic variants.
        // Never replace the original answer set or flood the chat with parallel searches.
        var extra = "";
        if (/(?:hoheit|erhaben|über\s+(?:dem|den)\s+thron|über\s+seinen\s+geschöpfen|ʿulūw|uluw)/i.test(question))
          extra = "ʿUlūw Istiwāʾ Allah Thron";
        else if (/(?:istiw[aāʾ]|istawa)/i.test(question))
          extra = "Allah über dem Thron";
        if (extra && (!Array.isArray(list) || list.length < 6)) {
          try {
            var alt = await oldSearch(extra, conversation, options);
            var ids = Object.create(null);
            list = (Array.isArray(list) ? list : []).concat(Array.isArray(alt) ? alt : [])
              .filter(function (item) {
                var key = String(item.id || JSON.stringify(item.route || {}) + item.title);
                if (ids[key]) return false;
                ids[key] = true;
                return true;
              });
          } catch (_e) {}
        }
        // Add only records that pass the same subject gate as the main corpus.
        // Never display a verified hadith just because the user mentioned hands.
        var verifiedCore = rankKnowledgeSources(question,ilmVerifiedCoreSources);
        if (verifiedCore.length) {
          var mergedKeys = Object.create(null);
          list = (Array.isArray(list) ? list : []).concat(verifiedCore).filter(function(item){
            var key = String(item.id || item.title || "");
            if (mergedKeys[key]) return false;
            mergedKeys[key] = true;
            return true;
          });
        }
        var seen = seenIds(conversation);
        var more = /\b(mehr|weitere|noch\s+\d+|fünf|5)\b/i.test(String(question || ""));
        if (!more) return list;
        return (list || []).filter(function (item) { return !seen[String(item.id || "")]; });
      };
    }

    if (typeof window.ilmNeedsExternalResearch === "function") {
      window.ilmNeedsExternalResearch = function () { return navigator.onLine !== false; };
    }
    if (typeof window.fetchIlmExternalResearch === "function") {
      window.fetchIlmExternalResearch = window.fetchIlmExternalResearch;
    }

    if (typeof window.buildIlmAssistantReply === "function") {
      var oldBuild = window.buildIlmAssistantReply;
      window.buildIlmAssistantReply = function (question, matches, mode, external) {
        var greeting = splitIlmGreeting(question);
        question = greeting.question || question;
        var convo = typeof window.getActiveIlmConversation === "function"
          ? window.getActiveIlmConversation(window.getIlmStore && window.getIlmStore())
          : null;
        var scientificQuestion = ilmResolvedQuery(question, convo);
        var reply = oldBuild(scientificQuestion, matches, mode, external);
        var improved = decorateReply(scientificQuestion, reply, convo);
        if (improved) {
          improved._ilmOriginalQuestion = question;
          improved._ilmStudyReminder = ilmStudyReminder(question,convo);
          improved._ilmRequestedEvidenceCount = ilmRequestedEvidenceCount(question);
          improved._ilmGreetingPrefix = greeting.greeting && greeting.question ? "Wa-ʿalaykum as-salām wa-raḥmatullāhi wa-barakātuh." : "";
          improved._ilmSourceOnly = mode === "sources";
          improved._ilmAnswerMode = mode === "short" ? "short" : "detailed";
          improved._ilmTawhidFollowup = tawhidFollowup(question);
          var rankedMatches = rankKnowledgeSources(scientificQuestion, matches);
          var coreTawhid = isBasicTawhidQuestion(question);
          var coreIman = isBasicImanQuestion(question);
          var coreAdab = isBasicAdabQuestion(question) && !isDiscoveryQuestion(question);
          improved._ilmDiscovery = discoveryItems(rankedMatches).filter(function(item) {
            return !coreTawhid || !/\b(?:hukm|urteil|gesetzgebung|ṭāghūt)\b/i.test(item.title);
          }).slice(0,coreTawhid ? 2 : 7);
          improved._ilmIsDiscovery = isDiscoveryQuestion(question);
          improved._ilmBasicTawhid = coreTawhid && !improved._ilmIsDiscovery;
          improved._ilmBasicIman = coreIman && !improved._ilmIsDiscovery;
          if (improved._ilmBasicIman) {
            improved._ilmGeneratedText = "Īmān bedeutet Glaube. Der Prophet ﷺ erläuterte im Ḥadīṯ von Jibrīl sechs Glaubensgrundlagen: den Glauben an Allah, Seine Engel, Seine Bücher, Seine Gesandten, den Jüngsten Tag und die Vorherbestimmung (al-Qadar) – das Gute wie das Schlechte.\n\nBeleg: Ṣaḥīḥ Muslim, Ḥadīṯ Nr. 8 (Jibrīl). Im Qurʾān nennt al-Baqarah 2:285 den Glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten.";
            improved._ilmDiscovery = [];
            improved.evidences = [];
          }
          if (improved._ilmBasicTawhid || improved._ilmTawhidFollowup) {
            if (improved._ilmBasicTawhid) improved._ilmGeneratedText = "Tawḥīd bedeutet, Allah als den Einen anzuerkennen und Ihm allein die Anbetung zu widmen.\n\nIm Qurʾān betont Sūrah al-Ikhlāṣ (112:1–4) Allahs Einzigkeit. Sūrah an-Naḥl (16:36) nennt den Aufruf, Allah zu dienen und Ṭāghūt zu meiden.";
            improved.evidences = [];
            improved._ilmDiscovery = [];
          }
          if (coreAdab) {
            improved.status = "ok";
            improved._ilmCoreAdab = true;
            improved._ilmGeneratedText = "Adab (أدب) bedeutet Anstand, gutes Benehmen und einen respektvollen Umgang. Dazu gehören gute Worte, Rücksichtnahme und ein aufrichtiger Charakter.\n\nDer Prophet ﷺ erklärte sinngemäß, dass die Besten unter den Menschen diejenigen mit dem besten Charakter sind. [1] Beleg: Ṣaḥīḥ al-Buḫārī Nr. 3559, Ṣaḥīḥ Muslim Nr. 2321.";
            improved.evidences = [ilmAdabVerifiedSource()];
            improved._ilmDiscovery = [];
            improved._ilmCitationCount = 1;
          }
          improved._ilmMatches = rankedMatches;
          // Retain the best question-matching entries as the answer's evidence,
          // not the incidental order of cards in the original post index.
          if (!improved._ilmBasicTawhid && !improved._ilmBasicIman && !improved._ilmCoreAdab) {
            var picked = rankedMatches.slice(0, 5).map(function(e){return toEvidence(e,"internal")}).filter(function(e){return e.verification_status === "verified"});
            var terms = ilmQuestionTerms(scientificQuestion);
            var relevantExternal = (improved.evidences || []).filter(function(e) {
              var contents = " " + ilmNormalize([e.work,e.reference,e.statement].join(" ")) + " ";
              return e.source_domain === "external" &&
                terms.filter(function(w){return contents.includes(" " + w + " ")}).length >= Math.min(2,terms.length) && ilmSubjectGate(scientificQuestion,contents) && e.verification_status === "verified";
            });
            improved.evidences = picked.concat(relevantExternal).slice(0,8);
            improved._ilmNoRelevantEvidence = !improved.evidences.length;
          }
          if (ilmFollowupIntent(question) && !improved._ilmIsDiscovery) {
            var oldSources = ilmPriorTurnEvidence(convo);
            var keys = Object.create(null);
            var allSources = (improved.evidences || []).concat(oldSources);
            improved.evidences = allSources.filter(function(ev) {
              var key = String(ev.id || ilmNormalize(ev.statement).slice(0,110));
              if (keys[key]) return false;
              keys[key] = true;
              return true;
            }).slice(0,8);
            if (improved.evidences.length) improved._ilmNoRelevantEvidence = false;
          }
        }
        // A complete new question may need evidence OUTSIDE our own app.
        // Do not force visitors into a tiny pre-written answer catalogue.
        if(improved && !improved._ilmIsDiscovery && !improved._ilmBasicTawhid &&
            !improved._ilmBasicIman && !improved._ilmCoreAdab &&
            !improved._ilmTawhidFollowup &&
            (improved.status === "ok" || improved.status === "insufficient" || improved.status === "unavailable") &&
            !(improved.evidences||[]).some(function(e){return e.verification_status === "verified" && e.statement})) {
          requestIlmOpenResearch(improved,scientificQuestion);
        }
        // Only religious explanation requests go to the bounded source-based composer.
        if (improved && improved.status === "ok" && !improved._ilmIsDiscovery && !improved._ilmBasicTawhid && !improved._ilmBasicIman && !improved._ilmTawhidFollowup && !improved._ilmSourceOnly) requestScienceComposition(improved, scientificQuestion);
        return improved;
      };
    }

    if (typeof window.buildIlmConversationReply === "function") {
      var oldConv = window.buildIlmConversationReply;
      window.buildIlmConversationReply = function (text) {
        if (ABUSE.test(String(text || ""))) {
          return {
            title: "Adab",
            status: "abuse",
            intro: "",
            directAnswer: "Bāraka Allāhu fīk — in diesem ʿIlm-Bereich bitte ich um ruhige, respektvolle Sprache. Ich beleidige nicht zurück. Formuliere deine Frage sachlich, dann helfe ich dir gern weiter. Wa-Allāhu aʿlam.",
            follow_up: ["Was ist Īmān?", "Zeig mir Beweise aus Qurʾān und Sunnah."]
          };
        }
        var greeting = splitIlmGreeting(text);
        var r = oldConv(greeting.question || text);
        if (greeting.greeting && !greeting.question && r) {
          r.directAnswer = "Wa-ʿalaykum as-salām wa-raḥmatullāhi wa-barakātuh. Stelle gern deine Frage zu ʿIlm.";
        } else if (greeting.greeting && greeting.question && r) {
          r._ilmGreetingPrefix = "Wa-ʿalaykum as-salām wa-raḥmatullāhi wa-barakātuh.";
        }
        return r;
      };
    }

    if (typeof window.classifyIlmPrompt === "function") {
      var oldClass = window.classifyIlmPrompt;
      window.classifyIlmPrompt = function (text) {
        if (ABUSE.test(String(text || ""))) return { type: "conversation" };
        var convo = typeof window.getActiveIlmConversation === "function"
          ? window.getActiveIlmConversation(window.getIlmStore && window.getIlmStore())
          : null;
        return oldClass(ilmResolvedQuery(text,convo));
      };
    }


    // Anchor a newly submitted question in the readable region; never jump to the bottom
    // just because the answer or references become long.
    (function installScienceScrollAnchor() {
      var lastQuestion = "";
      var pending = false;
      function adjust() {
        pending = false;
        if (!document.body || !document.body.classList.contains("is-ilm-chat-route")) return;
        var shell = document.querySelector(".ilm-chat-shell");
        if (!shell) return;
        var users = shell.querySelectorAll(".ilm-user-row");
        if (!users.length) { lastQuestion = ""; return; }
        var last = users[users.length - 1];
        var content = String(last.textContent || "").trim();
        if (!content || content === lastQuestion) return;
        lastQuestion = content;
        var scroller = last.closest(".ilm-chat-messages, .ilm-messages, .ilm-thread, .ilm-chat-history");
        if (!scroller) {
          for (var n = last.parentElement; n && n !== document.body; n = n.parentElement) {
            if (n.scrollHeight > n.clientHeight + 40 && getComputedStyle(n).overflowY !== "visible") { scroller = n; break; }
          }
        }
        if (scroller) {
          var top = last.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 20;
          scroller.scrollTo({top:Math.max(0,top),behavior:"instant"});
        } else {
          var y = window.scrollY + last.getBoundingClientRect().top - 110;
          if (y > 0) window.scrollTo({top:y,behavior:"instant"});
        }
      }
      var observer = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(adjust);
      });
      function boot() {
        observer.observe(document.body, {childList:true,subtree:true});
        adjust();
      }
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
      else boot();
    })();

    /* ILM DISCOVERY RETURN V1333: do not replace the site's navigation/history stack. */
    (function installIlmDiscoveryReturn() {
      var KEY = "darIlmDiscoveryReturnV1333";
      var MAX_AGE = 45 * 60 * 1000;
      var scrollSelectors = ".ilm-chat-messages, .ilm-messages, .ilm-thread, .ilm-chat-history";
      var pending = false;
      var restoring = false;
      var observing = false;
      var observer;
      function stopObserve() {
        if (observing && observer) observer.disconnect();
        observing = false;
      }
      function startObserve() {
        if (!observing && observer && document.body) {
          observer.observe(document.body,{childList:true,subtree:true});
          observing = true;
        }
      }
      function read() {
        try {
          var saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
          if (!saved || !saved.target || Date.now() - Number(saved.at || 0) > MAX_AGE) {
            sessionStorage.removeItem(KEY);
            return null;
          }
          return saved;
        } catch (_e) { return null; }
      }
      function save(el) {
        if (!document.body || !document.body.classList.contains("is-ilm-chat-route")) return;
        var view = el.getAttribute("data-nav") || "";
        var value = el.getAttribute("data-value") || "";
        if (!discoveryRoute({route:{view:view,value:value}})) return;
        var scroller = document.querySelector(scrollSelectors);
        var state = {
          target:{view:view,value:value},
          scrollY:window.scrollY || 0,
          innerScroll:scroller ? Number(scroller.scrollTop || 0) : null,
          fromHash:String(location.hash || "#ilm"),
          visited:false,
          at:Date.now()
        };
        try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (_e) {}
        startObserve();
      }
      function isTargetRoute(state) {
        if (!state || !document.body || document.body.classList.contains("is-ilm-chat-route")) return false;
        var currentHash = String(location.hash || "").toLowerCase();
        var expectedView = state.target.view;
        var matchHash = currentHash.includes(expectedView);
        var classes = {
          "post":"is-post-route",
          "dua":"is-dua-route",
          "quran-surah":"is-quran-reader-route"
        };
        return matchHash || document.body.classList.contains(classes[expectedView] || "ilm-unknown");
      }
      function restoreChatScroll(state) {
        if (restoring) return;
        restoring = true;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var scroller = document.querySelector(scrollSelectors);
            if (scroller && state.innerScroll != null) {
              scroller.scrollTop = Math.max(0, Number(state.innerScroll) || 0);
            } else if (state.scrollY > 0) {
              window.scrollTo({top:Number(state.scrollY) || 0,behavior:"instant"});
            }
            restoring = false;
          });
        });
      }
      function sync() {
        pending = false;
        var saved = read();
        var root = document.getElementById("appView");
        if (!root) return;
        var existing = root.querySelector("[data-ilm-discovery-return]");
        if (!saved) { if (existing) existing.remove(); stopObserve(); return; }
        if (document.body.classList.contains("is-ilm-chat-route")) {
          if (existing) existing.remove();
          // A pointerdown can mutate the DOM before navigation; do not discard the return trip yet.
          if (!saved.visited) return;
          try { sessionStorage.removeItem(KEY); } catch (_e) {}
          stopObserve();
          restoreChatScroll(saved);
          return;
        }
        if (!isTargetRoute(saved)) {
          if (existing) existing.remove();
          return;
        }
        if (!saved.visited) {
          saved.visited = true;
          try { sessionStorage.setItem(KEY, JSON.stringify(saved)); } catch (_e) {}
        }
        if (existing) return;
        var bar = document.createElement("div");
        bar.className = "ilm-discovery-return";
        bar.setAttribute("data-ilm-discovery-return","1");
        bar.innerHTML = '<button type="button" data-ilm-discovery-back="1" aria-label="Zurück zur ʿIlm-Unterhaltung">' +
          '<span aria-hidden="true">‹</span><span>Zurück zum ʿIlm-Chat</span></button>' +
          '<span class="ilm-discovery-return-note">Deine Unterhaltung bleibt erhalten</span>';
        root.insertBefore(bar,root.firstChild);
      }
      function schedule() {
        if (pending) return;
        pending = true;
        requestAnimationFrame(sync);
      }
      function goBack() {
        var saved = read();
        var navTab = document.querySelector('[data-bottom-nav="ilm"]');
        if (navTab && typeof navTab.click === "function") {
          navTab.click();
        } else if (typeof window.navigate === "function") {
          window.navigate("ilm","");
        } else {
          location.hash = "#ilm";
        }
        if (saved) {
          // The view is rendered by the original router, never by a duplicate reader.
          setTimeout(function () {
            if (document.body.classList.contains("is-ilm-chat-route")) {
              restoreChatScroll(saved);
              try { sessionStorage.removeItem(KEY); } catch (_e) {}
            }
          },60);
        }
      }
      document.addEventListener("click",function (ev) {
        var link = ev.target && ev.target.closest && ev.target.closest('[data-ilm-discovery-result="1"]');
        if (link) { save(link); return; }
        var back = ev.target && ev.target.closest && ev.target.closest('[data-ilm-discovery-back="1"]');
        if (!back) return;
        ev.preventDefault();
        ev.stopPropagation();
        goBack();
      },true);
      document.addEventListener("pointerdown",function (ev) {
        var link = ev.target && ev.target.closest && ev.target.closest('[data-ilm-discovery-result="1"]');
        if (link) save(link);
      },true);
      window.addEventListener("popstate",schedule);
      window.addEventListener("hashchange",schedule);
      observer = new MutationObserver(schedule);
      function boot() {
        if (!document.body) return;
        if (read()) { startObserve(); schedule(); }
      }
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
      else boot();
    })();


    /* MAJLIS MENU V1335: reuse existing working actions, reorganize only visual presentation. */
    (function installIlmMenuRefinement() {
      function refineMenu() {
        if (!document.body || !document.body.classList.contains("is-ilm-chat-route")) return;
        var menu = document.querySelector(".ilm-menu-popover");
        if (!menu || menu.dataset.ilmRefined === "1") return;
        var actions = Array.prototype.slice.call(menu.querySelectorAll("button"));
        if (actions.length < 6) return;
        var groups = {conversation:[],mode:[],danger:[],close:[],other:[]};
        actions.forEach(function(button) {
          var name = String(button.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
          if (name.includes("antwortmodus")) {
            button.classList.add("ilm-menu-mode-option");
            button.dataset.ilmMode = /kurz/.test(name) ? "short" : /quellen/.test(name) ? "sources" : "detailed";
            groups.mode.push(button);
          } else if (/gespräch löschen|chat löschen/.test(name)) {
            button.classList.add("ilm-menu-destructive-action");
            groups.danger.push(button);
          } else if (/^schließen$/.test(name)) {
            button.classList.add("ilm-menu-close-button");
            button.setAttribute("aria-label","Menü schließen");
            groups.close.push(button);
          } else if (/chat schließen/.test(name)) {
            button.classList.add("ilm-menu-exit-action");
            groups.other.push(button);
          } else {
            groups.conversation.push(button);
          }
          button.classList.add("ilm-menu-compact-action");
        });
        menu.dataset.ilmRefined = "1";
        menu.classList.add("ilm-menu-refined");
        // Preserve event delegation: only regroup if these buttons already belong directly to the popover.
        if (!actions.every(function(button){return button.parentElement === menu})) return;
        function section(label,klass,buttons) {
          if (!buttons.length) return null;
          var el = document.createElement("section");
          el.className = "ilm-menu-group " + klass;
          if (label) {
            var title = document.createElement("p");
            title.className = "ilm-menu-group-title";
            title.textContent = label;
            el.appendChild(title);
          }
          buttons.forEach(function(button){el.appendChild(button)});
          return el;
        }
        var titlebar = document.createElement("div");
        titlebar.className = "ilm-menu-titlebar";
        var title = document.createElement("span");
        title.textContent = "Gespräch & Einstellungen";
        titlebar.appendChild(title);
        groups.close.forEach(function(btn){titlebar.appendChild(btn)});
        menu.insertBefore(titlebar,menu.firstChild);
        [
          section("Gespräch","ilm-menu-group-chat",groups.conversation),
          section("Antwortdarstellung","ilm-menu-group-modes",groups.mode),
          section("Verwaltung","ilm-menu-group-danger",groups.danger.concat(groups.other))
        ].filter(Boolean).forEach(function(group){menu.appendChild(group)});
      }
      function schedule() {
        // The native app renders the menu after click; do not replace its click handlers.
        requestAnimationFrame(refineMenu);
        setTimeout(refineMenu,40);
      }
      document.addEventListener("click",function(ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest(".ilm-chat-header") || t.closest(".ilm-menu-popover")) schedule();
      },false);
      document.addEventListener("keydown",function(ev) {
        if (ev.key === "Enter" || ev.key === " ") schedule();
      },false);
    })();

    document.addEventListener("click",function(ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest("[data-ilm-reveal-proof]");
      if (!btn) return;
      ev.preventDefault();
      var msg = btn.closest(".ilm-assistant-message");
      var panel = msg && msg.querySelector(".ilm-science-sources");
      if (!panel) return;
      panel.open = true;
      var idx = Number(btn.getAttribute("data-ilm-reveal-proof")) - 1;
      var card = panel.querySelectorAll(".ilm-science-source-item")[idx];
      if (card && typeof card.scrollIntoView === "function") card.scrollIntoView({block:"nearest",behavior:"smooth"});
    },false);

    document.addEventListener("click", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("[data-ilm-follow]") : null;
      if (!t) return;
      ev.preventDefault();
      var q = t.getAttribute("data-ilm-follow") || "";
      var message = t.closest(".ilm-assistant-message");
      var original = message ? message.getAttribute("data-ilm-parent-question") || "" : "";
      if (original && /(?:exakt|beweis|beleg|erkläre|weitere|genauer)/i.test(q)) q = original + " — " + q;
      if (q && typeof window.submitIlmQuestion === "function") window.submitIlmQuestion(q);
    }, true);
  });
})();
