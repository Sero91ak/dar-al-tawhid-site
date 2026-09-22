/* TEST-ONLY · ʿIlm-Recherche-Chat */
(function () {
  "use strict";
  if (!/\/test(\/|$)/.test(String(location.pathname || ""))) return;

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
    var verified = !!(item.reference || item.work) && !!(item.excerpt || item.body || item.statement);
    if (origin === "external") verified = false;
    return {
      speaker: item.speaker || item.author || "",
      speaker_type: item.kind || item.type || "",
      statement: clip(item.excerpt || item.statement || item.body || "", 280),
      work: item.work || item.title || "",
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
      notes: item.sourceTag || item.note || "",
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
      ? (ev.speaker + ( /prophet|rasul|ﷺ/i.test(ev.speaker) || ev.speaker_type === "sunnah" ? " ﷺ sagte:" : " sagte:"))
      : (idx ? "Ein weiterer Beleg" : "Beleg");
    var open = "";
    if (ev.verification_status === "verified" && (ev.deep_link || ev.route)) {
      if (ev.deep_link && /^https?:/i.test(ev.deep_link) && (hostOk(ev.deep_link) || ev.source_domain === "dar-al-tawhid" || ev.deep_link.indexOf(location.origin) === 0)) {
        open = '<a class="ilm-open-src" href="' + esc(ev.deep_link) + '" target="_blank" rel="noopener noreferrer">↗ Originalstelle öffnen</a>';
      } else if (ev.route && ev.route.view) {
        open = '<button type="button" class="ilm-open-src" data-ilm-open-route="' + esc(JSON.stringify(ev.route)) + '">↗ Originalstelle öffnen</button>';
      }
    } else if (ev.verification_status === "partially_verified" && ev.deep_link && hostOk(ev.deep_link)) {
      open = '<a class="ilm-open-src" href="' + esc(ev.deep_link) + '" target="_blank" rel="noopener noreferrer">↗ Fundstelle zur Prüfung öffnen</a>';
    }
    var meta = [ev.chapter, ev.hadith_number ? "Nr. " + ev.hadith_number : "", ev.volume ? "Band " + ev.volume : "", ev.page ? "Seite " + ev.page : "", ev.notes].filter(Boolean).join(" · ");
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
      items.push(toEvidence(s, s.origin === "external" ? "external" : "internal"));
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
    reply.evidences = verified.concat(rest.slice(0, 2));
    reply.follow_up = followUps(question, reply);
    reply.research_hint = navigator.onLine ? "Online-Recherche aktiv ✦" : "Geprüfte Quellen werden durchsucht …";
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
    var oldAnswer = window.renderIlmAnswerText;
    window.renderIlmAnswerText = function (reply, isFirst) {
      if (!reply) return "";
      if (reply.status === "conversation" || reply.status === "clarification" || reply.status === "abuse") {
        var html = '<p class="ilm-intro">' + em(reply.directAnswer || reply.intro || "") + "</p>";
        (reply.follow_up || reply.followUpQuestions || []).forEach(function (f) {
          html += '<div class="ilm-follow"><button type="button" data-ilm-follow="' + esc(f) + '">✦ ' + esc(f) + "</button></div>";
        });
        return html;
      }
      var parts = [];
      if (reply.research_hint) parts.push('<div class="ilm-status-line">' + esc(reply.research_hint) + "</div>");
      if (reply.intro) parts.push('<p class="ilm-intro">' + em(reply.intro) + "</p>");
      if (reply.directAnswer && reply.status !== "unavailable") {
        String(reply.directAnswer).split(/\n{2,}/).forEach(function (p) {
          if (p.trim()) parts.push("<p>" + em(p.trim()) + "</p>");
        });
      } else if (reply.status === "unavailable") {
        parts.push("<p>" + em(reply.intro || reply.directAnswer || "Keine ausreichend sichere Fundstelle konnte bestätigt werden.") + "</p>");
      }
      (reply.evidences || []).forEach(function (ev, i) {
        if (ev.verification_status === "unverified" && !ev.statement) return;
        parts.push(renderEvidence(ev, i));
      });
      if (reply.explanation || reply.summary) {
        parts.push(
          '<div class="ilm-summary"><b>Kurz zusammengefasst</b><p>' +
            em(reply.summary || reply.explanation) +
            "</p><p>Wa-Allāhu aʿlam.</p></div>"
        );
      }
      var follows = reply.follow_up || [];
      if (follows.length) {
        parts.push(
          '<div class="ilm-follow">' +
            follows.map(function (f) {
              return '<button type="button" data-ilm-follow="' + esc(f) + '">✦ ' + esc(f) + "</button>";
            }).join("") +
          "</div>"
        );
      }
      return parts.join("") || (oldAnswer ? oldAnswer(reply, isFirst) : "");
    };

    var oldAssist = window.renderIlmAssistantMessage;
    window.renderIlmAssistantMessage = function (message, isFirst) {
      var reply = message.reply || {};
      return (
        '<article class="ilm-assistant-message" data-ilm-assistant="' + esc(message.id) + '">' +
          '<div class="ilm-answer-text">' + window.renderIlmAnswerText(reply, isFirst) + "</div>" +
        "</article>"
      );
    };

    var oldWelcome = window.renderIlmWelcomeState;
    window.renderIlmWelcomeState = function () {
      return (
        '<div class="ilm-welcome"><section class="ilm-welcome-card">' +
          "<h2>ʿIlm</h2>" +
          "<p>As-salāmu ʿalaykum. Frage nach Qurʾān, Sunnah, Ṣaḥābah und den frühen Imāmen. Die Antwort bleibt an den geprüften Quellen.</p>" +
          '<div class="ilm-starter-chips">' +
            [
              "Was ist Īmān?",
              "Was sagte der Prophet ﷺ über Īmān?",
              "Gibt es dazu einen Ijmāʿ?"
            ].map(function (p) {
              return '<button class="ilm-starter-chip" type="button" data-ilm-starter="' + esc(p) + '">' + esc(p) + "</button>";
            }).join("") +
          "</div></section></div>"
      );
    };

    var oldMsgs = window.renderIlmMessages;
    window.renderIlmMessages = function (conversation) {
      var messages = Array.isArray(conversation && conversation.messages) ? conversation.messages : [];
      if (!messages.length) return window.renderIlmWelcomeState();
      var assistantSeen = false;
      var phaseMap = {
        internal: ["Quellen werden geprüft …", "Qurʾān & Sunnah"],
        external: ["Quellen werden geprüft …", "Frühe Quellen"],
        compose: ["Fundstellen prüfen", "Geprüfte Quellen werden durchsucht …"]
      };
      return messages.map(function (message) {
        if (message.role === "user") {
          return '<div class="ilm-user-row"><div class="ilm-user-bubble">' + esc(message.content || "") + "</div></div>";
        }
        if (message.role === "loading") {
          var ph = phaseMap[message.phase] || phaseMap.internal;
          return (
            '<div class="ilm-loading-row"><span class="ilm-dots"><i></i><i></i><i></i></span>' +
            "<span>" + esc(ph[0]) + '</span><span class="ilm-loading-sub">' + esc(ph[1]) + "</span></div>"
          );
        }
        var html = window.renderIlmAssistantMessage(message, !assistantSeen);
        assistantSeen = true;
        return html;
      }).join("");
    };

    if (typeof window.searchIlmKnowledge === "function") {
      var oldSearch = window.searchIlmKnowledge;
      window.searchIlmKnowledge = async function (question, conversation, options) {
        var list = await oldSearch(question, conversation, options);
        var seen = seenIds(conversation);
        var more = /\b(mehr|weitere|noch\s+\d+|fünf|5)\b/i.test(String(question || ""));
        if (!more) return list;
        return (list || []).filter(function (item) { return !seen[String(item.id || "")]; });
      };
    }

    if (typeof window.ilmNeedsExternalResearch === "function") {
      window.ilmNeedsExternalResearch = function () { return !!navigator.onLine; };
    }

    if (typeof window.buildIlmAssistantReply === "function") {
      var oldBuild = window.buildIlmAssistantReply;
      window.buildIlmAssistantReply = function (question, matches, mode, external) {
        var reply = oldBuild(question, matches, mode, external);
        var convo = typeof window.getActiveIlmConversation === "function"
          ? window.getActiveIlmConversation(window.getIlmStore && window.getIlmStore())
          : null;
        return decorateReply(question, reply, convo);
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
        var r = oldConv(text);
        if (/\b(salam|salā|selam)/i.test(text)) {
          r.directAnswer = "Wa-ʿalaykum as-salām wa-raḥmatullāhi wa-barakātuh 🌙 Stelle deine Frage zu ʿIlm, ich suche in den geprüften Quellen.";
        }
        return r;
      };
    }

    if (typeof window.classifyIlmPrompt === "function") {
      var oldClass = window.classifyIlmPrompt;
      window.classifyIlmPrompt = function (text) {
        if (ABUSE.test(String(text || ""))) return { type: "conversation" };
        return oldClass(text);
      };
    }

    document.addEventListener("click", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("[data-ilm-follow]") : null;
      if (!t) return;
      ev.preventDefault();
      var q = t.getAttribute("data-ilm-follow") || "";
      if (q && typeof window.submitIlmQuestion === "function") window.submitIlmQuestion(q);
    }, true);
  });
})();
