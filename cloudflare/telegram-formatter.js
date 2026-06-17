const TELEGRAM_TEXT_LIMIT = 4096;
const TELEGRAM_CAPTION_LIMIT = 1024;
const WEBSITE_LABEL = "dar-al-tawhid.de";
const TELEGRAM_HANDLE = "@dar_al_tauhid";
const INSTAGRAM_HANDLE = "@dar_at_tawhid";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripEmojiPrefix(value) {
  return String(value || "").replace(/^[\s📖🖋️🌙📝🌐📥📸]+/u, "").trim();
}

function frontmatterValue(text, key) {
  const pattern = new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m");
  const match = String(text || "").match(pattern);
  return match ? match[1].trim() : "";
}

function parseFrontmatterBody(md) {
  const raw = String(md || "").replace(/^\uFEFF/, "");
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { frontmatter: "", body: raw.trim() };
  return { frontmatter: match[1] || "", body: (match[2] || "").trim() };
}

function inlineMarkdownToHtml(text) {
  let src = String(text || "");
  src = src.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  src = src.replace(/https?:\/\/\S+/gi, "");
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("***", i)) {
      const end = src.indexOf("***", i + 3);
      if (end > i) {
        tokens.push(`<b><i>${escapeHtml(src.slice(i + 3, end))}</i></b>`);
        i = end + 3;
        continue;
      }
    }
    if (src.startsWith("**", i)) {
      const end = src.indexOf("**", i + 2);
      if (end > i) {
        tokens.push(`<b>${escapeHtml(src.slice(i + 2, end))}</b>`);
        i = end + 2;
        continue;
      }
    }
    if (src[i] === "*" && src[i + 1] !== "*") {
      const end = src.indexOf("*", i + 1);
      if (end > i) {
        tokens.push(`<i>${escapeHtml(src.slice(i + 1, end))}</i>`);
        i = end + 1;
        continue;
      }
    }
    const nextSpecial = (() => {
      const a = src.indexOf("***", i);
      const b = src.indexOf("**", i);
      const c = src.indexOf("*", i);
      const hits = [a, b, c].filter((n) => n >= 0);
      return hits.length ? Math.min(...hits) : -1;
    })();
    const end = nextSpecial >= 0 ? nextSpecial : src.length;
    tokens.push(escapeHtml(src.slice(i, end)));
    i = end < 0 ? src.length : end;
  }
  return tokens.join("").replace(/\s+/g, " ").trim();
}

function cleanPlainText(text) {
  return String(text || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/^>\s?/gm, "")
    .replace(/[#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBlockquote(body) {
  const lines = String(body || "").split(/\r?\n/);
  const quote = [];
  let inQuote = false;
  for (const line of lines) {
    if (/^>\s?/.test(line)) {
      inQuote = true;
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }
    if (inQuote && !line.trim()) break;
    if (inQuote && !/^>\s?/.test(line)) break;
  }
  return quote.join("\n").trim();
}

function extractConclusion(body) {
  const match = String(body || "").match(/🌙\s*\*?\*?Fazit:\*?\*?\s*([\s\S]*?)(?:\n\n|$)/i);
  if (match) return cleanPlainText(match[1]);
  const alt = String(body || "").match(/(?:^|\n)\*?\*?Fazit:\*?\*?\s*(.+)$/im);
  return alt ? cleanPlainText(alt[1]) : "";
}

function extractScholarFromBody(body) {
  const match = String(body || "").match(/🖋️\s*\*?\*?(.+?)\*?\*?\s+sagte/i);
  return match ? cleanPlainText(match[1]) : "";
}

function extractStatementIntro(body) {
  const match = String(body || "").match(/🖋️\s*[\s\S]*?sagte[^:]*:\s*\n*/i);
  if (!match) return "";
  return "";
}

function hasBlockedContent(text) {
  const value = String(text || "").toLowerCase();
  if (/tiktok\.com|vm\.tiktok/.test(value)) return "TikTok-Verlinkung ist nicht erlaubt.";
  if (/(?:^|\s)#\w+/m.test(text)) return "Hashtags am Ende oder im Text sind nicht erlaubt.";
  if (/https?:\/\/\S{40,}/i.test(text)) return "Lange Roh-URLs sind im Telegram-Text nicht erlaubt.";
  if (/<\/?[a-z][^>]*>/i.test(text) && !/^[\s\S]*$/.test(text)) {
    // raw html in source markdown outside formatter output
    if (/<script|<iframe|<style/i.test(text)) return "Unsichere HTML-Inhalte gefunden.";
  }
  return "";
}

export function parsePostForTelegram(markdown, { postId = "", websiteOrigin = "https://dar-al-tawhid.de" } = {}) {
  const { body } = parseFrontmatterBody(markdown);
  const title = stripEmojiPrefix(frontmatterValue(markdown, "title"));
  const scholar = frontmatterValue(markdown, "scholar") || frontmatterValue(markdown, "gelehrter") || extractScholarFromBody(body);
  const source = stripEmojiPrefix(
    cleanPlainText(frontmatterValue(markdown, "source") || frontmatterValue(markdown, "quelle"))
  );
  const category = frontmatterValue(markdown, "category");
  const topic = frontmatterValue(markdown, "topic");
  const id = postId || frontmatterValue(markdown, "id");
  const slug = String(id || "").trim();
  const websiteUrl = slug
    ? `${String(websiteOrigin).replace(/\/$/, "")}/?post=${encodeURIComponent(slug)}&v=${Date.now()}#post/${encodeURIComponent(slug)}`
    : `${String(websiteOrigin).replace(/\/$/, "")}/`;
  const statementRaw = extractBlockquote(body) || cleanPlainText(body.split("🌙")[0].split("🖋️").pop() || "");
  const conclusion = extractConclusion(body);
  return {
    title,
    scholar,
    statement: cleanPlainText(statementRaw),
    statementHtml: inlineMarkdownToHtml(statementRaw),
    conclusion,
    conclusionHtml: inlineMarkdownToHtml(conclusion),
    source,
    category,
    topic,
    postId: slug,
    websiteUrl,
    websiteLabel: WEBSITE_LABEL
  };
}

export function validateTelegramPost(fields) {
  const errors = [];
  if (!fields?.title) errors.push("Titel fehlt.");
  if (!fields?.scholar) errors.push("Gelehrter/Name fehlt.");
  if (!fields?.statement) errors.push("Aussage/Zitat fehlt.");
  if (!fields?.conclusion) errors.push("Fazit fehlt.");
  if (!fields?.source) errors.push("Quelle fehlt.");
  if (!fields?.websiteUrl) errors.push("Website-Link fehlt.");
  const blocked = hasBlockedContent([
    fields?.title,
    fields?.scholar,
    fields?.statement,
    fields?.conclusion,
    fields?.source
  ].join("\n"));
  if (blocked) errors.push(blocked);
  return { ok: errors.length === 0, errors };
}

function stripInlineMarkdown(text) {
  return String(text || "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .trim();
}

export function buildTelegramHtml(fields) {
  const title = inlineMarkdownToHtml(stripEmojiPrefix(fields.title));
  const scholar = escapeHtml(fields.scholar);
  const statement = escapeHtml(stripInlineMarkdown(fields.statement));
  const conclusion = fields.conclusionHtml || inlineMarkdownToHtml(fields.conclusion);
  const source = escapeHtml(stripEmojiPrefix(fields.source));
  return [
    `📖 <b>${title}</b>`,
    "",
    `🖋️ <b>${scholar} sagte:</b>`,
    "",
    `<blockquote><b><i>${statement}</i></b></blockquote>`,
    "",
    `🌙 <b>Fazit:</b> ${conclusion}`,
    "",
    `📝 Quelle: ${source}`,
    "",
    `🌐 Website: ${escapeHtml(fields.websiteLabel || WEBSITE_LABEL)}`,
    "",
    `📥 Telegram: ${TELEGRAM_HANDLE}`,
    `📸 Instagram: ${INSTAGRAM_HANDLE}`
  ].join("\n");
}

export function buildTelegramPreview(fields) {
  const html = buildTelegramHtml(fields);
  const validation = validateTelegramPost(fields);
  const tooLong = html.length > TELEGRAM_TEXT_LIMIT;
  const captionTooLong = html.length > TELEGRAM_CAPTION_LIMIT;
  return {
    html,
    plainPreview: html
      .replace(/<blockquote>/gi, "「")
      .replace(/<\/blockquote>/gi, "」")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&"),
    length: html.length,
    tooLong,
    captionTooLong,
    validation
  };
}

export function shortenForCaption(html, max = TELEGRAM_CAPTION_LIMIT) {
  if (html.length <= max) return html;
  const titleMatch = html.match(/📖 <b>[\s\S]*?<\/b>/);
  const title = titleMatch ? titleMatch[0] : "📖 <b>Neuer Beitrag</b>";
  const short = `${title}\n\n🌐 Website: ${WEBSITE_LABEL}\n📥 Telegram: ${TELEGRAM_HANDLE}`;
  return short.length <= max ? short : short.slice(0, max - 1) + "…";
}

export {
  TELEGRAM_TEXT_LIMIT,
  TELEGRAM_CAPTION_LIMIT,
  WEBSITE_LABEL,
  TELEGRAM_HANDLE,
  INSTAGRAM_HANDLE
};
