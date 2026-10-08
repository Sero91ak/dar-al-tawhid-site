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
    var verified = item.verification_status === "verified" && !!(item.reference || item.work) && !!(item.excerpt || item.body || item.statement) && !!url && (hostOk(url) || url.indexOf(location.origin) === 0);
    if (origin === "external") verified = false;
    return {
      speaker: item.speaker || item.author || "",
      speaker_type: item.kind || item.type || "",
      statement: clip(item.excerpt || item.statement || item.body || "", 2800),
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
      ? (ev.speaker + (/prophet|rasul|ﷺ/i.test(ev.speaker) || ev.speaker_type === "sunnah" ? " ﷺ sagte:" : ":"))
      : (idx ? "Ein weiterer Beleg" : "Beleg");
    var open = "";
    if (ev.verification_status === "verified" && (ev.deep_link || ev.route)) {
      if (ev.deep_link && /^https?:/i.test(ev.deep_link) && (hostOk(ev.deep_link) || ev.deep_link.indexOf(location.origin + "/") === 0)) {
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
      return /(?:exakt|wörtlich|wortlaut|original(?:text|aussage)?|beweis|beleg|quelle|isn[aā]d|nachweis|wort.für.wort|zitiere|überlieferung|hadith.nummer|ḥadīṯ.nummer)/i.test(String(question || ""));
    }
    function sourceTitle(ev) {
      return [ev.speaker, ev.work, ev.chapter, ev.hadith_number && ("Nr. " + ev.hadith_number),
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
          title:String(it.title || it.work || "Inhalt öffnen"),
          kind:String(it.kind || "posts"),
          route:route,
          summary:clip(it.excerpt || it.body || it.reference || "", 125),
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
      var items = Array.isArray(reply._ilmDiscovery) ? reply._ilmDiscovery : [];
      if (!items.length) return "";
      var first = items.slice(0, 3).map(discoveryItemHtml).join("");
      var more = items.slice(3);
      return '<section class="ilm-discovery" aria-label="Passende Inhalte der App">' +
        '<div class="ilm-discovery-head"><h3>In der App gefunden</h3><span>Direkt öffnen</span></div>' +
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
        && !/(?:hukm|urteil|takfir|gesetz|ibadah und|welcher vers)/.test(q);
    }
    function rankKnowledgeSources(question, list) {
      var query = ilmNormalize(question);
      var words = query.split(" ").filter(function(w) {
        return w.length >= 4 && !/^(?:welche|einen|einer|einem|über|beweise|zeigen|finde|erklare|dazu|deine|seine|dieser|quelle|lesen|genau|genauer|werden|gibt|wurde)$/.test(w);
      });
      var seen = Object.create(null);
      return (Array.isArray(list) ? list : []).map(function (e,index) {
        var title = ilmNormalize([e.title,e.work,e.reference].join(" "));
        var body = ilmNormalize([e.excerpt,e.statement,e.body].join(" ").slice(0,1000));
        var hits = words.reduce(function(sum,w) {
          return sum + (title.includes(w) ? 5 : body.includes(w) ? 1 : 0);
        },0);
        var quality = e.kind === "quran" ? 1.5 : e.kind === "sunnah" ? 1 : 0;
        return {item:e,weight:hits+quality,order:index};
      }).filter(function(o) {
        var key = String(o.item.id || o.item.title || o.item.reference || o.order);
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      }).sort(function(a,b){return b.weight-a.weight || a.order-b.order})
        .map(function(o){return o.item});
    }
    function ilmScriptureLinks() {
      var rows = [
        {view:"quran-surah",value:"112/1",title:"al-Ikhlāṣ 112:1–4",caption:"Allahs Einzigkeit"},
        {view:"quran-surah",value:"16/36",title:"an-Naḥl 16:36",caption:"Allah allein dienen"}
      ];
      return '<section class="ilm-primary-references" aria-label="Qurʾān-Grundlagen"><span class="ilm-primary-references-title">Qurʾān-Grundlagen</span>' +
        rows.map(function(r){
          return '<button type="button" class="ilm-primary-reference" data-ilm-discovery-result="1" data-nav="' +
            esc(r.view) + '" data-value="' + esc(r.value) + '"><span>' + esc(r.title) +
            '<small>' + esc(r.caption) + '</small></span><span aria-hidden="true">↗</span></button>';
        }).join("") + '</section>';
    }

    function shortScientificAnswer(reply) {
      var ev = (reply.evidences || []).find(function (e) { return e.statement && e.statement.length > 24; });
      var txt = String(reply.directAnswer || "").trim();
      if (!ev) {
        if (reply.status === "unavailable" || reply.status === "insufficient") {
          return "Für diese Frage liegt mir derzeit kein ausreichend gesicherter Beleg vor. Ich möchte dir keine unbelegte religiöse Aussage geben.";
        }
        return txt && !/[„“]/.test(txt) && txt.length <= 480
          ? txt : "Hierzu finde ich noch keine ausreichend eindeutige Textgrundlage. Bitte formuliere die Frage genauer oder verlange eine konkrete Fundstelle.";
      }
      // A source list is not itself a prose answer. Never duplicate raw post text
      // merely to make the fallback look complete.
      if (reply._ilmComposing) {
        return "Ich ordne die gefundenen Aussagen und formuliere eine kurze Antwort anhand der vorhandenen Quellen.";
      }
      return "Passende Fundstellen sind vorhanden, aber ich kann gerade keine ausreichend sichere zusammenhängende Antwort erstellen. Öffne „Belege und Fundstellen“, um die Originalauszüge nachzuprüfen.";
    }
    function sourceDisclosure(reply, openProof) {
      var list = (reply.evidences || []).filter(function (e) { return !!(e.statement || e.deep_link); });
      if (!list.length) return "";
      var count = openProof ? Math.min(4, list.length) : Math.min(2, list.length);
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
    var scienceAnswerSerial = 0;
    function requestScienceComposition(reply, question) {
      if (!reply || proofIntent(question) || !navigator.onLine) return;
      var rows = (reply.evidences || []).filter(function (e) { return e.statement && e.statement.length >= 18; }).slice(0,3);
      if (!rows.length) return;
      var requestId = "ilm-science-" + (++scienceAnswerSerial);
      reply._ilmAnswerId = requestId;
      reply._ilmComposing = true;
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 13000);
      fetch("/test/api/ilm/compose", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          question:String(question || "").slice(0,550),
          evidence:rows.map(function (e) {
            return {
              speaker:e.speaker, work:e.work, reference:e.work,
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
          reply._ilmGeneratedText = answer;
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
        return '<div class="ilm-science-prose"><p>' + em(conversational) + "</p></div>";
      }
      var isProof = proofIntent(reply._ilmQuestion);
      var answer = isProof
        ? "Hier sind die nächstliegenden überlieferten Aussagen mit ihren Fundstellen. Bitte beachte den Prüfstatus jeder Quelle."
        : (reply._ilmGeneratedText || shortScientificAnswer(reply));
      if (reply._ilmIsDiscovery) answer = reply._ilmDiscovery.length
        ? "Ich habe dazu passende Inhalte in der App gefunden. Öffne einen Treffer, um den vollständigen Beitrag oder die Qurʾān-Stelle direkt zu lesen."
        : "Ich finde zu dieser Suche momentan keinen direkt öffnungsfähigen Treffer. Versuche einen konkreteren Begriff oder eine andere Schreibweise.";
      var html = '<div class="ilm-science-prose">' + answer.split(/\n{2,}/).filter(Boolean).map(function (p) {
        return '<p>' + em(p.trim()) + '</p>';
      }).join("") + '</div>';
      if (reply._ilmBasicTawhid) html += ilmScriptureLinks();
      if (!reply._ilmBasicTawhid) html += discoverySection(reply);
      if (!reply._ilmIsDiscovery && !reply._ilmBasicTawhid) html += sourceDisclosure(reply, isProof);
      var follows = reply._ilmBasicTawhid
        ? ["Zeige mir weitere Belege für Tawḥīd", "Erkläre Tawḥīd ausführlicher"]
        : reply._ilmIsDiscovery
        ? ["Erkläre mir das Thema", "Zeige mir den exakten Beweis"]
        : isProof
        ? ["Erkläre mir diese Belege verständlich", "Zeige weitere Belege zu meiner Frage"]
        : ["Zeige mir den exakten Wortlaut und Beweis", "Erkläre das genauer"];
      html += '<div class="ilm-science-actions" aria-label="Frage vertiefen">' + follows.map(function (x) {
        return '<button type="button" data-ilm-follow="' + esc(x) + '">' + esc(x) + '</button>';
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
        ["Was ist Tawḥīd?", "Grundlage"],
        ["Was ist Īmān?", "ʿAqīdah"],
        ["Was sagte der Prophet ﷺ über Īmān?", "Sunnah"],
        ["Gibt es dazu einen Ijmāʿ?", "Beweise"]
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
            '<div class="ilm-starter-chips">' +
              prompts.map(function (item) {
                return '<button class="ilm-starter-chip" type="button" data-ilm-starter="' + esc(item[0]) + '">' +
                  '<span class="ilm-starter-copy"><b>' + esc(item[0]) + '</b><small>' + esc(item[1]) + '</small></span>' +
                  '<span class="ilm-starter-arrow" aria-hidden="true">→</span>' +
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
        var reply = oldBuild(question, matches, mode, external);
        var convo = typeof window.getActiveIlmConversation === "function"
          ? window.getActiveIlmConversation(window.getIlmStore && window.getIlmStore())
          : null;
        var improved = decorateReply(question, reply, convo);
        if (improved) {
          var rankedMatches = rankKnowledgeSources(question, matches);
          var coreTawhid = isBasicTawhidQuestion(question);
          improved._ilmDiscovery = discoveryItems(rankedMatches).filter(function(item) {
            return !coreTawhid || !/\b(?:hukm|urteil|gesetzgebung|ṭāghūt)\b/i.test(item.title);
          }).slice(0,coreTawhid ? 2 : 7);
          improved._ilmIsDiscovery = isDiscoveryQuestion(question);
          improved._ilmBasicTawhid = coreTawhid && !improved._ilmIsDiscovery;
          if (improved._ilmBasicTawhid) {
            improved._ilmGeneratedText = "Tawḥīd bedeutet, Allah als den Einen anzuerkennen und Ihm allein die Anbetung zu widmen.\n\nIm Qurʾān betont Sūrah al-Ikhlāṣ (112:1–4) Allahs Einzigkeit. Sūrah an-Naḥl (16:36) nennt den Aufruf, Allah zu dienen und Ṭāghūt zu meiden.";
            improved.evidences = [];
            improved._ilmDiscovery = [];
          }
          improved._ilmMatches = rankedMatches;
        }
        // Only religious explanation requests go to the bounded source-based composer.
        if (improved && improved.status === "ok" && !improved._ilmIsDiscovery && !improved._ilmBasicTawhid) requestScienceComposition(improved, question);
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
