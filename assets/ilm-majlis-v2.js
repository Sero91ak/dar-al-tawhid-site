/* Majlis al-ʿIlm v2 – quellenbasierter Antwort-Pipeline-Kern */
(function initIlmMajlisV2(global) {
  "use strict";

  const SYNONYM_GROUPS = [
    ["tawhid", "tauhid", "tawḥīd", "tauḥīd", "einheit"],
    ["aqidah", "aqida", "aqeedah", "ʿaqīdah", "glaube", "iman"],
    ["hadith", "hadīth", "hadeeth", "sunnah"],
    ["istiwaa", "istiwa", "istiwāʾ", "istawa", "thron"],
    ["ibn taymiyyah", "ibn taimiyya", "ibn teymiye", "taymiyyah"],
    ["ibn kathir", "ibn kathīr", "kathir"],
    ["salaf", "salaf as salih", "salafussalih", "vorgänger"],
    ["sahaba", "sahabah", "gefährten", "gefahrten"],
    ["shirk", "polytheismus", "beitritt"],
    ["bidah", "bidʿah", "neuerung"],
    ["fatwa", "fetwa", "rechtsurteil"],
    ["takfir", "takfīr", "ausschluss"],
    ["quran", "koran", "qurʾān"],
    ["dua", "duʿāʾ", "bittgebet"],
    ["athar", "āthār", "aathar"],
    ["fiqh", "recht", "jurisprudenz"],
    ["zakat", "zakāh", "zakāt"],
    ["gebet", "salah", "ṣalāh", "salat"]
  ];

  const SCHOLAR_ALIASES = {
    "ibn taymiyyah": ["ibn taimiyya", "ibn teymiye", "taqi ad din"],
    "ibn kathir": ["ibn kathīr", "kathir"],
    "imam ahmad": ["ahmad ibn hanbal", "ahmad ibn hambal"],
    "imam malik": ["malik ibn anas"],
    "imam shafii": ["ash shafii", "ash-shafiʿī"]
  };

  const CLARIFICATION_TOPICS = {
    istiwaa: [
      "die Bedeutung des Wortes Istiwāʾ",
      "die Aussagen der Salaf dazu",
      "die Widerlegung einer bestimmten Auslegung",
      "eine bestimmte Qurʾān-Stelle"
    ],
    tawhid: [
      "die Definition von Tawḥīd",
      "Arten von Tawḥīd (Rubūbiyyah, Ulūhiyyah, Asmāʾ wa-Ṣifāt)",
      "Shirk und seine Formen",
      "praktische Auswirkungen im Alltag"
    ],
    hadith: [
      "Authentizität und Gradierung",
      "eine konkrete Überlieferungsnummer",
      "die Bedeutung im Kontext",
      "Anwendung auf eine Frage"
    ]
  };

  const PERSONAL_CASE_PATTERNS = [
    /\b(meine|mein|meinem)\s+(scheidung|ehe|erbe|kind|sorge)\b/i,
    /\b(darf ich|soll ich|ist es erlaubt).{0,40}(person|bruder|schwester|nachbar|chef)\b/i,
    /\b(takfīr|takfir)\s+(von|auf|gegen)\s+[a-zäöüß]/i,
    /\b(fatwa|fetwa)\s+(für|zu)\s+mein/i,
    /\bkonkrete?\s+(rechtsfall|einzelfall|situation)\b/i
  ];

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectLanguage(text) {
    const raw = String(text || "");
    if (/[\u0600-\u06ff]/.test(raw)) return "ar";
    if (/\b(nedir|nasil|hangi|icin|allah|peygamber|hadis|kuran)\b/i.test(raw)) return "tr";
    return "de";
  }

  function expandSynonyms(tokens) {
    const out = new Set(tokens || []);
    const hay = [...out].join(" ");
    SYNONYM_GROUPS.forEach((group) => {
      if (group.some((term) => hay.includes(normalize(term)) || [...out].some((t) => normalize(term).includes(t) || t.includes(normalize(term))))) {
        group.forEach((term) => out.add(normalize(term).split(" ").filter(Boolean).join(" ") || normalize(term)));
      }
    });
    Object.entries(SCHOLAR_ALIASES).forEach(([key, aliases]) => {
      if (hay.includes(key) || aliases.some((a) => hay.includes(normalize(a)))) {
        out.add(key);
        aliases.forEach((a) => out.add(normalize(a)));
      }
    });
    return [...out].filter(Boolean);
  }

  function fuzzyTokenInText(token, text) {
    if (!token || !text) return false;
    if (text.includes(token)) return true;
    if (token.length < 5) return false;
    const maxDist = token.length <= 6 ? 1 : 2;
    for (let i = 0; i <= text.length - token.length + maxDist; i++) {
      const slice = text.slice(i, i + token.length + maxDist);
      let dist = 0;
      const a = token;
      const b = slice.slice(0, token.length);
      for (let j = 0; j < Math.min(a.length, b.length); j++) {
        if (a[j] !== b[j]) dist++;
        if (dist > maxDist) break;
      }
      if (dist <= maxDist) return true;
    }
    return false;
  }

  function detectPersonalCase(question) {
    return PERSONAL_CASE_PATTERNS.some((p) => p.test(String(question || "")));
  }

  function detectAmbiguityTopic(question) {
    const q = normalize(question);
    if (/\bistiwaa?\b|\bistiwa\b/.test(q)) return "istiwaa";
    if (/\btawhid\b|\btauhid\b|\baqid/.test(q)) return "tawhid";
    if (/\bhadith\b|\bsunnah\b/.test(q)) return "hadith";
    return "";
  }

  function buildClarificationOptions(question) {
    const topic = detectAmbiguityTopic(question);
    const options = CLARIFICATION_TOPICS[topic] || [
      "einen religiösen Begriff oder ein Thema",
      "eine Qurʾān- oder Ḥadīth-Stelle",
      "einen Gelehrten oder ein Werk",
      "eine praktische Regel aus dem Dīn"
    ];
    return options.slice(0, 4);
  }

  function computeConfidence(matches, externalResults) {
    const top = Number(matches?.[0]?.score || 0);
    const strong = matches?.filter((m) => Number(m.score) >= 8).length || 0;
    const hasExternal = Array.isArray(externalResults) && externalResults.some((r) => r.snippet);
    if (strong >= 2 && top >= 10) return { level: "high", label: "Mit direkten Belegen" };
    if (top >= 7 || (strong >= 1 && top >= 6)) return { level: "medium", label: "Mit Einordnung" };
    if (hasExternal) return { level: "limited", label: "Die Fundlage ist begrenzt" };
    return { level: "limited", label: "Die Fundlage ist begrenzt" };
  }

  function mapSourceCard(item, origin) {
    const typeMap = {
      quran: "Quran",
      sunnah: "Hadith",
      athar: "Athar",
      dua: "Book",
      posts: "Scholar",
      quiz: "Book",
      external: "Book"
    };
    const link = (item.links || []).find((l) => /^https?:/i.test(l.url));
    return {
      type: typeMap[item.kind] || "Scholar",
      author: item.speaker || "",
      work: item.work || item.title || "",
      reference: item.reference || "",
      url: link?.url || item.markedUrl || item.finalUrl || item.url || "",
      origin: origin || (item.kind === "external" ? "external" : "internal"),
      excerpt: item.excerpt || "",
      note: item.sourceTag || "",
      route: item.route || null
    };
  }

  function buildStructuredSources(matches, externalResults) {
    const internal = (matches || []).slice(0, 8).map((m) => mapSourceCard(m, "internal"));
    const external = (Array.isArray(externalResults) ? externalResults : [])
      .filter((r) => r.snippet || r.reachable)
      .slice(0, 4)
      .map((r) => ({
        type: "Book",
        author: r.label || r.host || "",
        work: "Externe Recherche",
        reference: r.snippet ? "Auszug zur Prüfung" : "Fundstelle öffnen",
        url: r.markedUrl || r.finalUrl || r.url || "",
        origin: "external",
        excerpt: r.snippet || "",
        note: r.note || "Extern geprüft – nicht automatisch als Beleg übernommen"
      }));
    return [...internal, ...external];
  }

  function answerModeLabel(mode) {
    if (mode === "short") return "kurz";
    if (mode === "sources") return "nur_quellen";
    return "ausführlich";
  }

  function buildPersonalCaseReply(question, matches) {
    const general = (matches || []).slice(0, 2);
    return {
      title: "Allgemeine Regel – Einzelfall gesondert",
      status: "personal_case",
      researchMode: general.length ? "internal" : "insufficient",
      confidence: computeConfidence(matches, null),
      intro: "",
      directAnswer:
        "Zu persönlichen Einzelfällen (Ehe, Erbe, konkrete Personen, Takfīr einer bestimmten Person) kann ich hier keine individuelle Fatwā ersetzen.",
      explanation:
        "Ich kann dir die allgemeinen belegten Grundsätze zeigen. Für die konkrete Beurteilung braucht es vollständige Informationen und einen qualifizierten Gelehrten vor Ort oder schriftlich.",
      summary: "Allgemeine Regel ja – persönliche Fatwā nein.",
      sourceGroups: general.length ? [{ label: "Allgemeine Belege", items: general }] : [],
      sources: buildStructuredSources(general, null),
      differencesOfOpinion: [],
      followUpQuestions: [
        "Möchtest du die allgemeine belegte Regel zu diesem Thema sehen?",
        "Soll ich verwandte Grundsätze aus Qurʾān und Sunnah zeigen?"
      ],
      related: general.map((item) => ({ title: item.title, route: item.route, kind: item.kind })),
      contextHints: [question],
      sourceHints: general.map((item) => [item.speaker, item.work, item.reference].filter(Boolean).join(" · "))
    };
  }

  function buildSmartClarificationReply(question) {
    const options = buildClarificationOptions(question);
    return {
      title: "Rückfrage",
      status: "clarification",
      researchMode: "insufficient",
      confidence: { level: "limited", label: "Die Fundlage ist begrenzt" },
      intro: "",
      directAnswer: "Ich kann die Frage noch nicht eindeutig einem belegten Thema zuordnen. Meinst du:",
      clarificationOptions: options,
      explanation: "Wähle eine Option oder formuliere die Frage etwas genauer – dann suche ich gezielt in den internen Inhalten und freigegebenen Quellen.",
      summary: "",
      sourceGroups: [],
      sources: [],
      differencesOfOpinion: [],
      followUpQuestions: options,
      related: [],
      contextHints: [question],
      sourceHints: []
    };
  }

  function buildInsufficientReply(question, matches, externalResults, context) {
    const related = (matches || []).slice(0, 4).map((item) => ({
      title: item.title,
      route: item.route,
      kind: item.kind
    }));
    const hasExternal = Array.isArray(externalResults) && externalResults.some((r) => r.snippet || r.reachable);
    const prevHash = context?.lastFallbackHash || "";
    const hash = normalize(question).slice(0, 80);
    const repeat = prevHash && prevHash === hash;
    return {
      title: "Kein ausreichender Beleg",
      status: "unavailable",
      researchMode: hasExternal ? "internal_and_external" : "insufficient",
      confidence: { level: "limited", label: "Die Fundlage ist begrenzt" },
      intro: repeat
        ? "Auch bei erneuter Prüfung konnte ich keinen eindeutigeren Beleg finden."
        : "Ich konnte dazu in der internen Sammlung und den freigegebenen Quellen keinen ausreichend eindeutigen Beleg finden.",
      directAnswer: "Deshalb gebe ich keine sichere religiöse Aussage aus.",
      explanation: hasExternal
        ? "Externe Fundstellen sind unten zur manuellen Prüfung verlinkt. Sie gelten erst nach Prüfung als Beleg."
        : "Formuliere die Frage genauer oder wähle ein verwandtes Thema – ich helfe dir gern mit belegten Inhalten weiter.",
      summary: "Keine sichere Aussage ohne Beleg.",
      sourceGroups: hasExternal
        ? [{ label: "Externe Recherche", items: [context.buildExternalSource(question, externalResults)] }]
        : [],
      sources: buildStructuredSources([], externalResults),
      differencesOfOpinion: [],
      followUpQuestions: [
        "Frage präzisieren",
        "Verwandte belegte Themen anzeigen",
        hasExternal ? "Externe Fundstelle öffnen" : "Erneut genauer recherchieren"
      ],
      related,
      contextHints: [question],
      sourceHints: [],
      _fallbackHash: hash
    };
  }

  function buildSourcedReply(question, matches, options) {
    const mode = options?.mode || "detailed";
    const externalResults = options?.externalResults || null;
    const confidence = computeConfidence(matches, externalResults);
    const sources = buildStructuredSources(matches, externalResults);
    const top = (matches || []).slice(0, mode === "sources" ? 8 : mode === "short" ? 2 : 5);

    let directAnswer = "";
    if (mode === "sources") {
      directAnswer = "Hier sind die passendsten Belege aus der internen Sammlung:";
    } else {
      directAnswer = top
        .map((source) => {
          const head = [source.speaker, source.work].filter(Boolean).join(" · ") || source.title;
          const quote = String(source.excerpt || source.body || "").replace(/\s+/g, " ").trim();
          const clipped = quote.length > (mode === "short" ? 140 : 220) ? quote.slice(0, mode === "short" ? 139 : 219) + "…" : quote;
          return clipped ? `${head}: „${clipped}"` : head;
        })
        .join("\n\n");
    }

    const summary =
      mode === "short"
        ? "Kernaussage aus den stärksten internen Fundstellen – Details und Quellenkarten unten."
        : "Die Antwort stützt sich auf veröffentlichte Inhalte von DAR AL TAWḤID und geprüfte Metadaten.";

    const grouping = options.buildSourceGroups ? options.buildSourceGroups(matches) : [];

    return {
      title: mode === "sources" ? "Quellenübersicht" : "Antwort mit Quellen",
      status: "ok",
      researchMode: externalResults?.length ? "internal_and_external" : "internal",
      confidence,
      intro: options.language === "ar" ? "بسم الله. هذه أقرب المعلومات الموثقة في التطبيق:" : options.language === "tr" ? "Bismillah. Uygulamadaki en uygun kaynaklı içerikler:" : "As-salāmu ʿalaykum. Zu deiner Frage finden sich belegte Inhalte in DAR AL TAWḤID.",
      directAnswer,
      explanation:
        mode === "short"
          ? "Kurzfassung – öffne die Quellenkarten für den vollständigen Wortlaut."
          : "Zitat und Zusammenfassung sind getrennt. Authentizität und Zuordnung stammen aus den hinterlegten Metadaten, soweit vorhanden.",
      summary,
      sourceGroups: grouping,
      sources,
      differencesOfOpinion: confidence.level === "medium" ? ["Es kann je nach Auslegung Nuancen geben – prüfe die genannten Belege."] : [],
      followUpQuestions: ["Kürzer formulieren", "Weitere Beweise", "Nur Quellen anzeigen"],
      related: (matches || []).slice(0, 5).map((item) => ({ title: item.title, route: item.route, kind: item.kind })),
      contextHints: [question].concat(top.flatMap((item) => item.contextHints || [])).slice(0, 12),
      sourceHints: top.map((item) => [item.speaker, item.work, item.reference, item.title].filter(Boolean).join(" · "))
    };
  }

  function loadingPhaseText(phase, offline) {
    if (offline) return "Offline-Modus: Es werden nur bereits gespeicherte interne Inhalte verwendet.";
    if (phase === "internal") return "Interne Inhalte werden geprüft …";
    if (phase === "external") return "Freigegebene Quellen werden geprüft …";
    return "Antwort wird erstellt …";
  }

  function enhanceTokenize(baseTokenize, text) {
    const tokens = baseTokenize(text);
    return [...new Set([...tokens, ...expandSynonyms(tokens)])];
  }

  global.IlmMajlisV2 = {
    normalize,
    detectLanguage,
    expandSynonyms,
    fuzzyTokenInText,
    detectPersonalCase,
    detectAmbiguityTopic,
    buildClarificationOptions,
    computeConfidence,
    mapSourceCard,
    buildStructuredSources,
    buildPersonalCaseReply,
    buildSmartClarificationReply,
    buildInsufficientReply,
    buildSourcedReply,
    loadingPhaseText,
    enhanceTokenize,
    answerModeLabel
  };
})(typeof window !== "undefined" ? window : globalThis);
