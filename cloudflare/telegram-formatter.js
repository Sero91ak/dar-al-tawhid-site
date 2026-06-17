/* DAR AL TAWḤID – Telegram HTML formatter (parse_mode HTML). */

const TELEGRAM_TEXT_LIMIT = 4096;
const TELEGRAM_CAPTION_LIMIT = 1024;
const DEFAULT_WEBSITE = "https://dar-al-tawhid.de";
const TELEGRAM_HANDLE = "@dar_al_tauhid";
const INSTAGRAM_HANDLE = "@dar_at_tawhid";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownInlineToHtml(input) {
  const source = String(input || "");
  const tokens = [];
  const re = /\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match;
  while ((match = re.exec(source))) {
    if (match.index > last) tokens.push({ type: "text", value: source.slice(last, match.index) });
    if (match[1] !== undefined) tokens.push({ type: "bi", value: match[1] });
    else if (match[2] !== undefined) tokens.push({ type: "b", value: match[2] });
    else tokens.push({ type: "i", value: match[3] });
    last = re.lastIndex;
  }
  if (last < source.length) tokens.push({ type: "text", value: source.slice(last) });
  return tokens
    .map((token) => {
      const safe = escapeHtml(token.value);
      if (token.type === "bi") return `<b><i>${safe}</i></b>`;
      if (token.type === "b") return `<b>${safe}</b>`;
      if (token.type === "i") return `<i>${safe}</i>`;
      return safe;
    })
    .join("");
}

function frontmatterValue(text, key) {
  const match = String(text || "").match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"));
  return match ? match[1].trim() : "";
}

function splitFrontmatter(markdown) {
  const text = String(markdown || "");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: "", body: text.trim() };
  return { frontmatter: match[1], body: match[2].trim() };
}

function cleanQuotes(value) {
  return String(value || "")
    .replace(/^[\s>]+/, "")
    .replace(/[\s>]+$/, "")
    .replace(/^[„""'''`]+/, "")
    .replace(/[„""'''`]+$/, "")
    .trim();
}

function stripMarkdownDecorations(value) {
  return String(value || "")
    .replace(/^#+\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/^\*+\s*/, "")
    .replace(/\*+$/, "")
    .trim();
}

function parseScholarFromBody(body) {
  const match = String(body || "").match(/🖋️\s*\*\*(.+?)\*\*\s*(sagte|sagt|berichtete|überlieferte|rlvt\.?)/i);
  if (!match) return "";
  return cleanQuotes(match[1]);
}

function parseStatementFromBody(body) {
  const text = String(body || "");
  const withoutScholar = text.replace(/^🖋️[^\n]*\n+/i, "").trim();
  const fazitIndex = withoutScholar.search(/\n🌙\s*\*\*Fazit:?\*\*/i);
  const chunk = fazitIndex >= 0 ? withoutScholar.slice(0, fazitIndex) : withoutScholar;
  const blockquote = chunk.match(/(?:^|\n)>\s*([\s\S]+?)(?=\n\n|$)/);
  if (blockquote) return cleanQuotes(stripMarkdownDecorations(blockquote[1]));
  const paragraph = chunk
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find(Boolean);
  return cleanQuotes(stripMarkdownDecorations(paragraph || ""));
}

function parseConclusionFromBody(body) {
  const match = String(body || "").match(/🌙\s*\*\*Fazit:?\*\*\s*([\s\S]+)$/i);
  return match ? cleanQuotes(stripMarkdownDecorations(match[1])) : "";
}

function containsRawUrl(value) {
  return /https?:\/\/\S+/i.test(String(value || ""));
}

function containsTikTok(value) {
  return /tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i.test(String(value || ""));
}

function containsTrailingHashtags(value) {
  return /(?:^|\n)\s*(?:#[\w\u0600-\u06FF_-]+\s*){2,}\s*$/u.test(String(value || ""));
}

function containsVisibleHtml(value) {
  return /<\/?[a-z][\s\S]*?>/i.test(String(value || ""));
}

function shortenText(value, maxLen) {
  const text = String(value || "").trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

export function parsePostFields(markdown, options = {}) {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const fm = frontmatter || markdown;
  const titleRaw = frontmatterValue(fm, "title") || frontmatterValue(markdown, "title");
  const title = titleRaw.replace(/^📖\s*/, "").trim();
  const scholar =
    parseScholarFromBody(body) ||
    frontmatterValue(fm, "scholar") ||
    frontmatterValue(fm, "gelehrter") ||
    "";
  const statement = parseStatementFromBody(body);
  const conclusion = parseConclusionFromBody(body);
  const source =
    frontmatterValue(fm, "source") ||
    frontmatterValue(fm, "quelle") ||
    "";
  const category = frontmatterValue(fm, "category") || "";
  const topic = frontmatterValue(fm, "topic") || "";
  const postId = frontmatterValue(fm, "id") || options.postId || "";
  const websiteUrl = options.websiteUrl || (postId ? `${DEFAULT_WEBSITE}/#post/${encodeURIComponent(postId)}` : DEFAULT_WEBSITE);

  return {
    title,
    titleDisplay: titleRaw.startsWith("📖") ? titleRaw : `📖 ${title}`,
    scholar,
    statement,
    conclusion,
    source,
    category,
    topic,
    postId,
    websiteUrl,
    websiteLabel: "dar-al-tawhid.de",
    links: []
  };
}

export function validateTelegramPost(fields, { forCaption = false } = {}) {
  const errors = [];
  const warnings = [];

  if (!fields.title) errors.push("Titel fehlt");
  if (!fields.scholar) errors.push("Gelehrter/Person fehlt");
  if (!fields.statement) errors.push("Aussage/Zitat fehlt");
  if (!fields.conclusion) errors.push("Fazit fehlt");
  if (!fields.source) errors.push("Quelle fehlt");
  if (!fields.websiteUrl) errors.push("Website-Link fehlt");

  const combined = [fields.statement, fields.conclusion, fields.source, fields.title].join("\n");
  if (containsRawUrl(fields.statement) || containsRawUrl(fields.conclusion)) {
    errors.push("Roh-URLs im Beitragstext sind nicht erlaubt");
  }
  if (containsTikTok(combined)) errors.push("TikTok-Verlinkung ist nicht erlaubt");
  if (containsTrailingHashtags(combined)) errors.push("Hashtags am Ende sind nicht erlaubt");
  if (containsVisibleHtml(combined)) errors.push("Sichtbare HTML-Tags im Rohtext gefunden");

  const html = buildTelegramHtml(fields);
  const limit = forCaption ? TELEGRAM_CAPTION_LIMIT : TELEGRAM_TEXT_LIMIT;
  if (html.length > limit) {
    warnings.push(`Telegram-Text ist zu lang (${html.length}/${limit} Zeichen)`);
  }
  if (fields.source.length > 240) {
    warnings.push("Quelle ist sehr lang – wird für Telegram gekürzt, vollständige Quelle bleibt auf der Website");
  }

  return { ok: errors.length === 0, errors, warnings, html, length: html.length, limit };
}

function formatStatementHtml(statement) {
  let raw = cleanQuotes(stripMarkdownDecorations(String(statement || "")));
  if (/^\*\*\*[\s\S]+\*\*\*$/.test(raw)) {
    raw = raw.replace(/^\*\*\*/, "").replace(/\*\*\*$/, "").trim();
  }
  const inner = markdownInlineToHtml(raw);
  return `<blockquote><b><i>${inner}</i></b></blockquote>`;
}

export function buildTelegramHtml(fields, options = {}) {
  const title = markdownInlineToHtml(fields.title);
  const scholarLabel = markdownInlineToHtml(`${fields.scholar} sagte:`);
  const statementBlock = formatStatementHtml(fields.statement);
  const conclusion = markdownInlineToHtml(fields.conclusion);
  const source = markdownInlineToHtml(
    shortenText(fields.source, options.maxSourceLength || 240)
  );
  const website = escapeHtml(fields.websiteLabel || "dar-al-tawhid.de");

  const lines = [
    `📖 <b>${title}</b>`,
    "",
    `🖋️ <b>${scholarLabel}</b>`,
    "",
    statementBlock,
    "",
    `🌙 <b>Fazit:</b> ${conclusion}`,
    "",
    `📝 Quelle: ${source}`,
    "",
    `🌐 Website: ${website}`,
    "",
    `📥 Telegram: ${escapeHtml(TELEGRAM_HANDLE)}`,
    `📸 Instagram: ${escapeHtml(INSTAGRAM_HANDLE)}`
  ];

  return lines.join("\n").trim();
}

export function buildTelegramCaption(fields) {
  const title = markdownInlineToHtml(fields.title);
  const scholar = markdownInlineToHtml(fields.scholar);
  const statement = markdownInlineToHtml(shortenText(fields.statement, 180));
  const website = escapeHtml(fields.websiteLabel || "dar-al-tawhid.de");
  const html = [
    `📖 <b>${title}</b>`,
    "",
    `🖋️ <b>${scholar} sagte:</b>`,
    `<blockquote><b><i>${statement}</i></b></blockquote>`,
    "",
    `🌐 ${website}`
  ].join("\n");
  if (html.length <= TELEGRAM_CAPTION_LIMIT) return { caption: html, followUp: null };
  const shortCaption = [`📖 <b>${title}</b>`, "", `🌐 ${website}`].join("\n");
  return { caption: shortCaption, followUp: buildTelegramHtml(fields) };
}

export function buildTelegramPreviewPackage(markdown, options = {}) {
  const fields = parsePostFields(markdown, options);
  const validation = validateTelegramPost(fields);
  const captionPack = buildTelegramCaption(fields);
  return {
    fields,
    html: validation.html,
    plainPreview: validation.html.replace(/<[^>]+>/g, ""),
    validation,
    caption: captionPack.caption,
    followUp: captionPack.followUp,
    limits: {
      text: TELEGRAM_TEXT_LIMIT,
      caption: TELEGRAM_CAPTION_LIMIT
    }
  };
}

export function buildTelegramTestMessage() {
  return {
    html: "<b>DAR AL TAWḤID Test</b>\nTelegram-Verbindung funktioniert.",
    plain: "DAR AL TAWḤID Test\nTelegram-Verbindung funktioniert."
  };
}

export {
  TELEGRAM_TEXT_LIMIT,
  TELEGRAM_CAPTION_LIMIT,
  DEFAULT_WEBSITE,
  TELEGRAM_HANDLE,
  INSTAGRAM_HANDLE
};
