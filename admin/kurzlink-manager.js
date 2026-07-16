/**
 * DAR Admin – Geschütztes Kurzlink-System für geprüfte Quellen
 * Wird von admin/index.html eingebunden.
 */
(function (global) {
  "use strict";

  const SHORT_DOMAIN = "dar-al-tawhid.de";
  const CODE_RE = /^a(\d+)$/i;

  const ALLOWED_DOMAIN_ROOTS = [
    "islamweb.net",
    "shamela.ws",
    "al-maktaba.org",
    "ketabonline.com",
    "dorar.net",
    "quran.ksu.edu.sa",
    "archive.org",
    "waqfeya.net"
  ];

  const ALLOWED_DOMAINS = ALLOWED_DOMAIN_ROOTS.concat(
    ALLOWED_DOMAIN_ROOTS.map((d) => `www.${d}`),
    ["s2.ketabonline.com"]
  );

  function isAllowedHost(host) {
    const h = String(host || "")
      .toLowerCase()
      .replace(/^www\./, "");
    return ALLOWED_DOMAIN_ROOTS.some((root) => h === root || h.endsWith(`.${root}`));
  }

  const PLATFORM_OPTIONS = [
    "Islamweb",
    "Shamela",
    "al-Maktaba",
    "Ketabonline",
    "Dorar",
    "quran.ksu.edu.sa",
    "Archive",
    "Waqfeya",
    "PDF/Scan (lokal)"
  ];

  const STATUS_LABELS = {
    draft: "Entwurf",
    unverified: "Entwurf",
    verified: "Geprüft",
    active: "Aktiv",
    error: "Fehlerhaft",
    disabled: "Deaktiviert"
  };

  const PUBLISH_BLOCK_MSG =
    "Dieser Beitrag kann nicht veröffentlicht werden, weil der Quellenlink nicht vollständig geprüft wurde.";

  function normalizeCode(code) {
    const raw = String(code || "").trim().toLowerCase();
    return CODE_RE.test(raw) ? raw : "";
  }

  function shortUrlNormal(code) {
    const c = normalizeCode(code);
    return c ? `${SHORT_DOMAIN}/${c}` : "";
  }

  function shortUrlHttps(code) {
    const c = normalizeCode(code);
    return c ? `https://${SHORT_DOMAIN}/${c}` : "";
  }

  function isShortlinkUrl(url) {
    const u = String(url || "").trim();
    if (!u) return false;
    return new RegExp(`^(https?:\\/\\/)?(www\\.)?${SHORT_DOMAIN.replace(/\./g, "\\.")}\\/a\\d+\\/?$`, "i").test(u);
  }

  function extractCodeFromUrl(url) {
    const m = String(url || "").trim().match(/\/(a\d+)\/?$/i);
    return m ? normalizeCode(m[1]) : "";
  }

  function domainFromUrl(url) {
    try {
      const u = new URL(String(url || "").trim());
      return String(u.hostname || "").toLowerCase().replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }

  function isLocalSourcePath(url) {
    const u = String(url || "").trim();
    return /^\/assets\/sources\//i.test(u) || /^assets\/sources\//i.test(u);
  }

  function isAllowedTargetUrl(url) {
    const u = String(url || "").trim();
    if (!u) return false;
    if (isLocalSourcePath(u)) return true;
    if (!/^https?:\/\//i.test(u)) return false;
    const host = domainFromUrl(u);
    if (!host) return false;
    return isAllowedHost(host);
  }

  function detectPlatform(url) {
    if (isLocalSourcePath(url)) return "PDF/Scan (lokal)";
    const host = domainFromUrl(url);
    if (!host) return "";
    if (host.includes("islamweb")) return "Islamweb";
    if (host.includes("shamela")) return "Shamela";
    if (host.includes("maktaba")) return "al-Maktaba";
    if (host.includes("ketabonline")) return "Ketabonline";
    if (host.includes("dorar")) return "Dorar";
    if (host.includes("quran.ksu")) return "quran.ksu.edu.sa";
    if (host.includes("archive.org")) return "Archive";
    if (host.includes("waqfeya")) return "Waqfeya";
    return "";
  }

  function hasTextFragment(url) {
    return /#:~:text=/i.test(String(url || ""));
  }

  function isHttpsUrl(url) {
    try {
      return new URL(String(url || "").trim()).protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  function isPublicRedirectStatus(status) {
    const s = String(status || "").toLowerCase();
    return s === "active" || s === "verified";
  }

  function normalizeRegistry(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const entries = {};
    Object.keys(data.entries || {}).forEach((key) => {
      const code = normalizeCode(key);
      if (!code) return;
      entries[code] = { ...data.entries[key], code };
    });
    let nextSerial = Number(data.nextSerial || 1);
    if (!Number.isFinite(nextSerial) || nextSerial < 1) nextSerial = 1;
    Object.keys(entries).forEach((code) => {
      const n = parseInt(code.slice(1), 10);
      if (n >= nextSerial) nextSerial = n + 1;
    });
    return {
      version: Number(data.version || 1),
      updatedAt: String(data.updatedAt || ""),
      nextSerial,
      sha: String(data.sha || ""),
      entries
    };
  }

  function getNextCode(registry) {
    const reg = normalizeRegistry(registry);
    return `a${reg.nextSerial}`;
  }

  function listEntries(registry) {
    return Object.values(normalizeRegistry(registry).entries).sort((a, b) => {
      const na = parseInt(String(a.code || "").slice(1), 10) || 0;
      const nb = parseInt(String(b.code || "").slice(1), 10) || 0;
      return na - nb;
    });
  }

  function findEntry(registry, code) {
    const c = normalizeCode(code);
    return c ? normalizeRegistry(registry).entries[c] || null : null;
  }

  function findEntryForPost(registry, filename) {
    const fn = String(filename || "").trim();
    if (!fn) return null;
    return listEntries(registry).find((e) => String(e.postFilename || "") === fn) || null;
  }

  function extractShortlinkFromMarkdown(markdown) {
    const text = String(markdown || "");
    const fm = text.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!fm) return "";
    const m = fm[1].match(/^source_shortlink:\s*["']?(a\d+)["']?\s*$/im);
    return m ? normalizeCode(m[1]) : "";
  }

  function formatSourceLine(code, https) {
    const c = normalizeCode(code);
    if (!c) return "";
    return https ? `🔗 Quelle: ${shortUrlHttps(c)}` : `🔗 Quelle: ${shortUrlNormal(c)}`;
  }

  function injectShortlinkIntoMarkdown(markdown, code) {
    const c = normalizeCode(code);
    if (!c) return String(markdown || "");
    let out = String(markdown || "");
    const m = out.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!m) return out;
    let yaml = m[1];
    const body = m[2] || "";
    const https = shortUrlHttps(c);
    const normal = shortUrlNormal(c);
    const sourceLine = formatSourceLine(c, false);

    if (/^source_shortlink:\s/m.test(yaml)) {
      yaml = yaml.replace(/^source_shortlink:\s*.*$/m, `source_shortlink: "${c}"`);
    } else {
      yaml = `${yaml.trimEnd()}\nsource_shortlink: "${c}"`;
    }

    if (/^source:\s/m.test(yaml)) {
      if (!yaml.includes(normal)) {
        yaml = yaml.replace(/^source:\s*["']?(.*?)["']?\s*$/m, (full, val) => {
          const base = String(val || "").trim();
          if (base.includes(normal) || base.includes(https)) return full;
          return `source: "${base ? base + " " : ""}${sourceLine}"`;
        });
      }
    } else {
      yaml = `${yaml.trimEnd()}\nsource: "${sourceLine}"`;
    }

    const linkEntry = `  - label: "→ Quelle"\n    url: "${https}"`;
    const linksBlock = yaml.match(/^links:\s*\n([\s\S]*?)(?=\n[A-Za-z0-9_-]+:|$)/m);
    if (linksBlock) {
      const block = linksBlock[0];
      if (!block.includes(https) && !block.includes(normal)) {
        yaml = yaml.replace(block, `${block.trimEnd()}\n${linkEntry}`);
      }
    } else if (/^logo:\s/m.test(yaml)) {
      yaml = yaml.replace(/^logo:\s/m, `links:\n${linkEntry}\nlogo: `);
    } else {
      yaml = `${yaml.trimEnd()}\nlinks:\n${linkEntry}`;
    }

    return `---\n${yaml.trimEnd()}\n---\n\n${body.trim()}`.trimEnd() + "\n";
  }

  function parseValue(v) {
    v = String(v || "").trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
    return v;
  }

  function parseYamlScalarSimple(yaml, key) {
    const m = String(yaml || "").match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  }

  function parseLinksFromYaml(yaml) {
    const links = [];
    const block = String(yaml || "").match(/^links:\s*\n([\s\S]*?)(?=\n[A-Za-z0-9_-]+:|$)/m);
    if (!block) return links;
    let item = null;
    block[1].split(/\r?\n/).forEach((line) => {
      const lm = line.match(/^\s*-\s*label:\s*(.*)$/);
      if (lm) {
        item = { label: parseValue(lm[1]), url: "" };
        links.push(item);
        return;
      }
      const um = line.match(/^\s*url:\s*(.*)$/);
      if (um && item) item.url = parseValue(um[1]);
    });
    return links;
  }

  function firstAllowedTargetFromMarkdown(markdown) {
    const text = String(markdown || "");
    const fm = text.match(/^---\s*\n([\s\S]*?)\n---/);
    const yaml = fm ? fm[1] : "";
    const urls = [];
    parseLinksFromYaml(yaml).forEach((l) => urls.push(l.url));
    const slideUrls = yaml.match(/^\s*url:\s*(.+)$/gm) || [];
    slideUrls.forEach((line) => {
      const u = parseValue(String(line).replace(/^\s*url:\s*/, ""));
      urls.push(u);
    });
    for (const raw of urls) {
      const u = String(raw || "").trim();
      if (!u || isShortlinkUrl(u)) continue;
      if (isAllowedTargetUrl(u)) return u;
    }
    return "";
  }

  function deriveKurzlinkFromPost(markdown, meta) {
    const text = String(markdown || "");
    const fm = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    const yaml = fm ? fm[1] : "";
    const body = fm ? (fm[2] || "").trim() : text.trim();
    const scholar = parseYamlScalarSimple(yaml, "scholar");
    const book = parseYamlScalarSimple(yaml, "book");
    const source = parseYamlScalarSimple(yaml, "source");
    const title = String(meta?.title || parseYamlScalarSimple(yaml, "title") || "").replace(/^📖\s*/, "").trim();
    const quote =
      body
        .replace(/^#+\s+/gm, "")
        .split(/\n{2,}/)[0]
        ?.trim()
        .slice(0, 600) || title;
    const targetUrl = firstAllowedTargetFromMarkdown(text);
    const citation = source.replace(/🔗\s*Quelle:.*/gi, "").trim().slice(0, 240);
    const platform = targetUrl ? detectPlatform(targetUrl) : "";
    const textHighlight = targetUrl && hasTextFragment(targetUrl) ? "yes" : targetUrl ? "no" : "not_possible";
    const draft = emptyDraft({
      code: meta?.code || extractShortlinkFromMarkdown(text),
      postFilename: meta?.filename || "",
      postId: meta?.postId || "",
      scholar,
      book,
      quote: quote || title
    });
    return {
      ...draft,
      targetUrl,
      platform,
      work: book || draft.work,
      citation: citation || source.slice(0, 240),
      textHighlight,
      textHighlightNote:
        textHighlight === "not_possible" && !targetUrl
          ? "Textmarkierung technisch nicht möglich, Quelle wurde manuell geprüft."
          : draft.textHighlightNote
    };
  }

  function buildImageShareText({ scholar, quote, statement, sourceCitation, code, sourceShortlink, adminNote } = {}) {
    const c = normalizeCode(code || sourceShortlink);
    const name = String(scholar || "").trim();
    const q = String(quote || statement || "").trim();
    const citation = String(sourceCitation || adminNote || "").trim();
    const shortLink = c ? formatInstagramLine(c) : "";
    const parts = [];
    if (name) parts.push(`${name} sagte:`, "", q);
    else if (q) parts.push(q);
    if (citation) parts.push("", `📝 ${citation}`);
    if (shortLink) parts.push("", shortLink);
    return parts.join("\n").trim();
  }

  function buildChannelShareText({
    title,
    hashtags,
    statement,
    quote,
    sourceCitation,
    code,
    sourceShortlink,
    fazit,
    scholar,
    postType,
    contentType,
    adminNote
  } = {}) {
    const pt = String(postType || contentType || "channel").toLowerCase();
    if (pt.includes("image") || pt === "instagram_image") {
      return buildImageShareText({ scholar, quote, statement, sourceCitation, code, sourceShortlink, adminNote });
    }
    const c = normalizeCode(code || sourceShortlink);
    const titleClean = String(title || "")
      .replace(/^📖\s*/, "")
      .trim();
    const titleLine = titleClean ? `📖 ${titleClean}` : "";
    const tags = String(hashtags || "")
      .trim()
      .replace(/^#/, "");
    const tagLine = tags
      ? tags
          .split(/\s+/)
          .filter(Boolean)
          .map((t) => (t.startsWith("#") ? t : `#${t}`))
          .join(" ")
      : "";
    const body = String(statement || quote || "").trim();
    const citation = String(sourceCitation || "").trim();
    const shortLink = c ? formatInstagramLine(c) : "";
    const fazitLine = String(fazit || "").trim();
    const parts = [];
    if (titleLine) parts.push(titleLine);
    if (tagLine) parts.push(tagLine);
    if (body) parts.push("", body);
    if (citation) parts.push("", `📝 ${citation}`);
    if (shortLink) parts.push("", shortLink);
    if (fazitLine) parts.push("", `🌙 **Fazit:** ${fazitLine}`);
    return parts.join("\n").trim();
  }

  function validateCreateInput(input, registry) {
    const errors = [];
    const targetUrl = String(input?.targetUrl || "").trim();
    const quote = String(input?.quote || "").trim();
    const adminNote = String(input?.adminNote || "").trim();
    const textHighlightException = input?.textHighlightException === true;
    const textHighlightNote = String(input?.textHighlightNote || "").trim();

    if (!targetUrl) errors.push("Ziel-Link fehlt");
    else if (!isHttpsUrl(targetUrl) && !isLocalSourcePath(targetUrl)) errors.push("Ziel-Link muss HTTPS sein");
    else if (!isAllowedTargetUrl(targetUrl)) errors.push("Domain nicht erlaubt");

    if (!quote) errors.push("Zitierte Aussage fehlt");
    if (!adminNote) errors.push("Quellenangabe fehlt");

    const hasFragment = hasTextFragment(targetUrl);
    if (targetUrl && !isLocalSourcePath(targetUrl)) {
      if (!hasFragment && !textHighlightException) errors.push("Textmarkierung fehlt");
      if (!hasFragment && textHighlightException && !textHighlightNote) {
        errors.push("Ausnahme für fehlende Textmarkierung muss bestätigt werden");
      }
    }

    const dupWarnings = findDuplicateWarnings({ targetUrl, quote }, registry, "");
    dupWarnings.forEach((w) => {
      if (/möglicherweise bereits verwendet/i.test(w)) errors.push(w.replace(/^Achtung:\s*/i, ""));
    });

    return { ok: !errors.length, errors };
  }

  function buildCreatePayload(input) {
    const targetUrl = String(input?.targetUrl || "").trim();
    const textHighlightException = input?.textHighlightException === true;
    return {
      targetUrl,
      title: String(input?.title || "").trim(),
      hashtags: String(input?.hashtags || "").trim(),
      statement: String(input?.statement || "").trim(),
      sourceCitation: String(input?.sourceCitation || "").trim(),
      fazit: String(input?.fazit || "").trim(),
      scholar: String(input?.scholar || "").trim(),
      postType: String(input?.postType || input?.contentType || "channel").trim(),
      adminNote: String(input?.adminNote || input?.sourceCitation || "").trim(),
      quote: String(input?.quote || input?.statement || "").trim(),
      sourcePlatform: String(input?.sourcePlatform || input?.platform || detectPlatform(targetUrl) || "").trim(),
      contentType: String(input?.contentType || "instagram_channel").trim(),
      textHighlightException,
      textHighlightNote: textHighlightException ? String(input?.textHighlightNote || "").trim() : "",
      registrySha: String(input?.registrySha || "").trim()
    };
  }
  function buildNormalShareSourceLine(code) {
    const c = normalizeCode(code);
    return c ? formatSourceLine(c, false) : "";
  }

  function validateAutoEntry(entry, registry, { existingCode = "" } = {}) {
    const errors = [];
    const e = { ...(entry || {}) };
    const code = normalizeCode(e.code);
    const reg = normalizeRegistry(registry);
    if (!code) errors.push("Kurzcode fehlt");
    if (!String(e.postFilename || "").trim()) errors.push("Beitrag fehlt");
    const taken = reg.entries[code];
    if (taken && normalizeCode(existingCode) !== code && String(taken.postFilename || "") !== String(e.postFilename || "")) {
      errors.push(`Kurzcode ${code} ist bereits vergeben`);
    }
    const targetUrl = String(e.targetUrl || "").trim();
    if (targetUrl && !isAllowedTargetUrl(targetUrl)) errors.push("Quelle nicht erlaubt");
    return { ok: !errors.length, errors, entry: { ...e, code, targetUrl, status: e.status || "unverified" } };
  }

  function formatInstagramLine(code) {
    const c = normalizeCode(code);
    return c ? `🔗 ${shortUrlHttps(c)}` : "";
  }

  const CHATGPT_IMPORT_PROMPT = `Erstelle Instagram-Channel-Beiträge mit automatischem Kurzlink über die Admin-API.

Für jeden Beitrag liefere:
1. Titel, Hashtags, Beitragstext, kurze Quellenangabe (ohne langen Link), Zitat, Fazit
2. Originalquellenlink mit Textmarkierung #:~:text=Start,Ende
3. Diesen API-Block (wird von der Admin-App automatisch verarbeitet):

QUELLEN_IMPORT
\`\`\`json
{
  "links": [
    {
      "targetUrl": "https://www.islamweb.net/…#:~:text=Start,Ende",
      "adminNote": "Buch, Band, Seite, Gelehrter",
      "quote": "zitierte Aussage"
    }
  ]
}
\`\`\`

Regeln:
- Nur erlaubte Domains: islamweb.net, shamela.ws, al-maktaba.org, ketabonline.com, dorar.net, quran.ksu.edu.sa, archive.org, waqfeya.net
- Jeder Link braucht Textmarkierung #:~:text=Start,Ende wenn möglich
- Im Instagram-Text KEIN langer Quellenlink — nur: 🔗 https://dar-al-tawhid.de/aX (wird automatisch erzeugt)
- KEIN Platzhalter [QUELLE] — die Admin-App erzeugt den fertigen Kurzlink direkt`;

  const GPT_ACTION_OPENAPI_URL = "https://dar-al-tawhid.de/content/admin/gpt-instagram-channel-openapi.json";

  const GPT_ACTION_INSTRUCTIONS = `Du bist der Instagram-Autor für DAR AL TAWHID.

WICHTIG — AUTOMATISCHER KURZLINK:
Wenn der Nutzer einen Beitrag will, rufe IMMER createInstagramChannelPost auf.
Erfinde NIEMALS einen Kurzlink. Gib NIEMALS [QUELLE] aus.
Gib result.instagramPost 1:1 zurück — kopierbereit.

ZWEI BEITRAGSTYPEN — strikt trennen:

1) BILD-BEITRAG (postType: "image") — wenn Nutzer Bild, Grafik, Zitat-Bild will:
   Nur: Gelehrter + direkte Aussage (Originalwortlaut) + Quellenangabe + Kurzlink.
   VERBOTEN auf dem Bild / im Text: Erklärung, Fazit, Einordnung, 👉, "zum Hadīth", Kontext, Deutung, Zusammenfassung.
   Pflichtfelder: postType="image", scholar, quote (nur wörtliche Aussage), sourceCitation, targetUrl, adminNote, sourcePlatform
   quote = NUR die direkte Aussage des Gelehrten — kein Rahmentext davor oder danach.

2) CHANNEL-BEITRAG (postType: "channel") — längerer Instagram-Text:
   Pflicht: title, hashtags, statement, sourceCitation, targetUrl, adminNote, quote, fazit

Ablauf:
1. Originalquelle (nur erlaubte Domains) mit #:~:text=Start,Ende
2. createInstagramChannelPost aufrufen
3. Nur instagramPost ausgeben

Erlaubte Domains: islamweb.net, shamela.ws, al-maktaba.org, ketabonline.com, dorar.net, quran.ksu.edu.sa, archive.org, waqfeya.net

Bei API-Fehler: „Kurzlink konnte nicht erstellt werden“ — keinen falschen Link erfinden.

OpenAPI-Schema: ${GPT_ACTION_OPENAPI_URL}`;

  function normalizeImportLink(raw) {
    if (typeof raw === "string") {
      const targetUrl = String(raw || "").trim();
      return targetUrl ? { targetUrl, adminNote: "", platform: "" } : null;
    }
    if (!raw || typeof raw !== "object") return null;
    const targetUrl = String(raw.targetUrl || raw.url || raw.quelle || raw.source || "").trim();
    if (!targetUrl) return null;
    return {
      targetUrl,
      adminNote: String(raw.adminNote || raw.note || raw.bemerkung || raw.citation || "").trim(),
      platform: String(raw.platform || "").trim(),
      textHighlightNote: String(raw.textHighlightNote || "").trim()
    };
  }

  function parseJsonImportBlock(text) {
    try {
      const data = JSON.parse(String(text || "").trim());
      if (Array.isArray(data)) return data.map(normalizeImportLink).filter(Boolean);
      if (Array.isArray(data?.links)) return data.links.map(normalizeImportLink).filter(Boolean);
      const one = normalizeImportLink(data);
      return one ? [one] : [];
    } catch (e) {
      return null;
    }
  }

  function extractUrlsFromText(text) {
    const re = /https?:\/\/[^\s)\]"'<>]+/gi;
    const seen = new Set();
    const links = [];
    for (const match of String(text || "").matchAll(re)) {
      let url = match[0].replace(/[.,;:!?)]+$/, "");
      if (isShortlinkUrl(url)) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      links.push({ targetUrl: url, adminNote: "", platform: detectPlatform(url) });
    }
    return links;
  }

  function parseChatGptImport(text) {
    const raw = String(text || "").trim();
    if (!raw) return { links: [], errors: ["Kein Text zum Importieren"] };

    const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlock) {
      const parsed = parseJsonImportBlock(codeBlock[1].trim());
      if (parsed?.length) return { links: parsed, errors: [] };
    }

    const marker = raw.match(/QUELLEN_IMPORT\s*([\s\S]*?)$/i);
    if (marker) {
      const block = marker[1].trim();
      const parsed = parseJsonImportBlock(block);
      if (parsed?.length) return { links: parsed, errors: [] };
      const fromUrls = extractUrlsFromText(block);
      if (fromUrls.length) return { links: fromUrls, errors: [] };
    }

    const parsed = parseJsonImportBlock(raw);
    if (parsed?.length) return { links: parsed, errors: [] };

    const fromUrls = extractUrlsFromText(raw);
    if (fromUrls.length) return { links: fromUrls, errors: [] };

    return { links: [], errors: ["Keine Quellen-URLs erkannt — QUELLEN_IMPORT-JSON oder https://-Links einfügen"] };
  }

  function buildImportPreviewBlock(created) {
    return (created || [])
      .map((item) => item.instagramLine || formatInstagramLine(item.code))
      .filter(Boolean)
      .join("\n");
  }

  function validateRedirectSave(entry, registry, { existingCode = "", forVerified = false } = {}) {
    const errors = [];
    const warnings = [];
    const e = { ...(entry || {}) };
    const code = normalizeCode(e.code);
    const reg = normalizeRegistry(registry);

    if (!code) errors.push("Kurzcode fehlt");
    else if (!CODE_RE.test(code)) errors.push("Kurzcode ungültig");
    else {
      const taken = reg.entries[code];
      if (taken && normalizeCode(existingCode) !== code) errors.push(`Kurzcode ${code} ist bereits vergeben`);
    }

    const targetUrl = String(e.targetUrl || "").trim();
    if (!targetUrl) errors.push("Ziel-Link fehlt (Islamweb, Shamela, al-Maktaba …)");
    else if (!isAllowedTargetUrl(targetUrl)) errors.push("Quelle nicht erlaubt — nur geprüfte Domains");

    const platform = String(e.platform || "").trim() || detectPlatform(targetUrl);
    if (!platform) warnings.push("Quellenplattform konnte nicht erkannt werden — bitte wählen");

    const th = hasTextFragment(targetUrl) ? "yes" : String(e.textHighlight || "no");
    if (forVerified && targetUrl && !hasTextFragment(targetUrl) && !isLocalSourcePath(targetUrl)) {
      if (th !== "not_possible" || !String(e.textHighlightNote || "").trim()) {
        errors.push("Für Instagram: Ziel-Link braucht Textmarkierung (#:~:text=…) oder bestätigte Ausnahme");
      }
    }

    if (forVerified && !isPublicRedirectStatus(String(e.status || "unverified"))) {
      errors.push("Erst als geprüft/aktiv markieren, dann leitet der Link zur Quelle weiter");
    }

    warnings.push(...findDuplicateWarnings(e, reg, code));

    return {
      ok: !errors.length,
      errors,
      warnings,
      entry: { ...e, code, targetUrl, platform, textHighlight: th, status: e.status || "unverified" }
    };
  }

  function emptyDraft({ code, postFilename, postId, scholar, book, quote } = {}) {
    return {
      code: normalizeCode(code) || "",
      targetUrl: "",
      platform: "",
      work: String(book || ""),
      citation: "",
      quote: String(quote || ""),
      textHighlight: "no",
      textHighlightNote: "",
      status: "unverified",
      verifiedAt: "",
      adminNote: "",
      postFilename: String(postFilename || ""),
      postId: String(postId || ""),
      scholar: String(scholar || ""),
      redirectType: "302"
    };
  }

  function validateEntry(entry, registry, { forPublish = false, existingCode = "" } = {}) {
    const errors = [];
    const warnings = [];
    const e = { ...(entry || {}) };
    const code = normalizeCode(e.code);
    const reg = normalizeRegistry(registry);

    if (!code) errors.push("Kurzcode fehlt");
    else if (!CODE_RE.test(code)) errors.push("Kurzcode muss a1, a2, a3 … sein");
    else {
      const taken = reg.entries[code];
      if (taken && normalizeCode(existingCode) !== code) {
        errors.push(`Kurzcode ${code} ist bereits vergeben`);
      }
    }

    const targetUrl = String(e.targetUrl || "").trim();
    if (!targetUrl) errors.push("Ziel-Link fehlt");
    else if (!isAllowedTargetUrl(targetUrl)) errors.push("Quelle nicht erlaubt — nur geprüfte Domains oder /assets/sources/");

    const platform = String(e.platform || "").trim();
    if (!platform) errors.push("Quellenplattform fehlt");

    if (!String(e.work || "").trim()) errors.push("Werk (Buchname) fehlt");
    if (!String(e.citation || "").trim()) errors.push("Exakte Quellenangabe fehlt (Band, Seite, Nummer …)");
    if (!String(e.quote || "").trim()) errors.push("Zitierte Aussage fehlt");

    const th = String(e.textHighlight || "no");
    if (!["yes", "no", "not_possible"].includes(th)) errors.push("Textmarkierung: Ja/Nein/technisch nicht möglich wählen");
    if (th === "yes" && targetUrl && !hasTextFragment(targetUrl) && !isLocalSourcePath(targetUrl)) {
      errors.push("Textmarkierung ist Pflicht — Ziel-Link braucht #:~:text=START,ENDE");
    }
    if (th === "not_possible" && !String(e.textHighlightNote || "").trim()) {
      errors.push('Bei „technisch nicht möglich“ muss bestätigt werden: „Textmarkierung technisch nicht möglich, Quelle wurde manuell geprüft.“');
    }

    const status = String(e.status || "unverified");
    if (forPublish && !isPublicRedirectStatus(status)) errors.push("Prüfstatus muss Aktiv oder Geprüft sein");

    if (forPublish && errors.length) {
      errors.unshift(PUBLISH_BLOCK_MSG);
    }

    warnings.push(...findDuplicateWarnings(e, reg, code));

    return { ok: !errors.length, errors, warnings, entry: { ...e, code, targetUrl, platform, status } };
  }

  function normalizeForCompare(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function findDuplicateWarnings(entry, registry, selfCode) {
    const warnings = [];
    const reg = normalizeRegistry(registry);
    const target = String(entry?.targetUrl || "").trim();
    const quote = normalizeForCompare(entry?.quote);
    const scholar = normalizeForCompare(entry?.scholar);
    const self = normalizeCode(selfCode || entry?.code);

    listEntries(reg).forEach((other) => {
      if (normalizeCode(other.code) === self) return;
      if (target && String(other.targetUrl || "").trim() === target) {
        warnings.push(`Achtung: Diese Quelle oder Aussage wurde möglicherweise bereits verwendet. Bitte prüfen. (Ziel-Link = ${other.code})`);
      }
      if (quote && normalizeForCompare(other.quote) === quote) {
        warnings.push(`Achtung: Diese Quelle oder Aussage wurde möglicherweise bereits verwendet. Bitte prüfen. (gleiche Aussage = ${other.code})`);
      }
      if (scholar && quote && normalizeForCompare(other.scholar) === scholar) {
        const oq = normalizeForCompare(other.quote);
        if (oq && (oq === quote || oq.includes(quote.slice(0, 40)) || quote.includes(oq.slice(0, 40)))) {
          warnings.push(`Achtung: Diese Quelle oder Aussage wurde möglicherweise bereits verwendet. Bitte prüfen. (${other.code}: ${other.scholar})`);
        }
      }
    });

    return [...new Set(warnings)];
  }

  function validatePostForPublish(markdown, registry) {
    const code = extractShortlinkFromMarkdown(markdown);
    if (!code) {
      return { ok: false, errors: [PUBLISH_BLOCK_MSG, "Kurzcode fehlt im Beitrag (source_shortlink)"], warnings: [] };
    }
    const entry = findEntry(registry, code);
    if (!entry) {
      return { ok: false, errors: [PUBLISH_BLOCK_MSG, `Kurzlink ${code} nicht in der Registry`], warnings: [] };
    }
    return validateEntry(entry, registry, { forPublish: true, existingCode: code });
  }

  function buildRedirectHtml(entry) {
    const code = normalizeCode(entry?.code);
    const status = String(entry?.status || "unverified");
    const target = String(entry?.targetUrl || "").trim();
    const safeTarget = target.replace(/"/g, "&quot;").replace(/</g, "&lt;");
    if (status === "disabled") {
      return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Quellenlink deaktiviert</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1419;color:#e8eef5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}main{max-width:420px}h1{font-size:1.25rem}p{color:#9fb0c3;line-height:1.5}</style></head>
<body><main><h1>Quellenlink deaktiviert</h1><p>Dieser Quellenlink (${code}) wurde deaktiviert oder wird aktuell geprüft.</p><p><a href="https://${SHORT_DOMAIN}/" style="color:#8cb4ff">Zur Startseite</a></p></main></body></html>`;
    }
    if (!isPublicRedirectStatus(status) || !target) {
      return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Quellenlink in Prüfung</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1419;color:#e8eef5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}main{max-width:420px}h1{font-size:1.25rem}p{color:#9fb0c3;line-height:1.5}</style></head>
<body><main><h1>Quellenlink in Prüfung</h1><p>Dieser Quellenlink (${code}) wurde deaktiviert oder wird aktuell geprüft.</p><p><a href="https://${SHORT_DOMAIN}/" style="color:#8cb4ff">Zur Startseite</a></p></main></body></html>`;
    }
    const refresh = String(entry?.redirectType || "302") === "301" ? "0" : "0";
    return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta http-equiv="refresh" content="${refresh};url=${safeTarget}">
<link rel="canonical" href="${safeTarget}"><meta name="robots" content="noindex"><title>Weiterleitung zur Quelle</title></head>
<body><p>Weiterleitung zur geprüften Quelle … <a href="${safeTarget}">Hier klicken</a></p>
<script>location.replace(${JSON.stringify(target)});<\/script></body></html>`;
  }

  function redirectPathForCode(code) {
    const c = normalizeCode(code);
    return c ? `${c}/index.html` : "";
  }

  global.DARKurzlink = {
    SHORT_DOMAIN,
    ALLOWED_DOMAINS,
    PLATFORM_OPTIONS,
    STATUS_LABELS,
    PUBLISH_BLOCK_MSG,
    normalizeCode,
    shortUrlNormal,
    shortUrlHttps,
    isShortlinkUrl,
    extractCodeFromUrl,
    isAllowedTargetUrl,
    detectPlatform,
    hasTextFragment,
    normalizeRegistry,
    getNextCode,
    listEntries,
    findEntry,
    findEntryForPost,
    extractShortlinkFromMarkdown,
    formatSourceLine,
    formatInstagramLine,
    CHATGPT_IMPORT_PROMPT,
    GPT_ACTION_OPENAPI_URL,
    GPT_ACTION_INSTRUCTIONS,
    parseChatGptImport,
    buildImportPreviewBlock,
    normalizeImportLink,
    validateRedirectSave,
    injectShortlinkIntoMarkdown,
    deriveKurzlinkFromPost,
    buildChannelShareText,
    buildImageShareText,
    buildNormalShareSourceLine,
    validateCreateInput,
    buildCreatePayload,
    isPublicRedirectStatus,
    validateAutoEntry,
    emptyDraft,
    validateEntry,
    findDuplicateWarnings,
    validatePostForPublish,
    buildRedirectHtml,
    redirectPathForCode
  };
})(typeof window !== "undefined" ? window : global);
