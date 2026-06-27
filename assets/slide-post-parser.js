/**
 * DAR AL TAWḤID — Slide-Beitrag Parser (Frontmatter + <!-- slide: N --> Body)
 */
(function (global) {
  "use strict";

  const SLIDE_MARKER_RE = /<!--\s*slide:\s*\d+\s*-->/gi;
  const SLIDE_MARKER_TEST = /<!--\s*slide:\s*\d+\s*-->/i;

  function parseValue(v) {
    v = String(v || "").trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      return v.slice(1, -1);
    }
    return v;
  }

  function normalizeSlideEntry(slide) {
    const links = Array.isArray(slide?.links)
      ? slide.links
          .filter((x) => x && String(x.url || "").trim())
          .map((x) => ({
            label: String(x.label || "Quelle").trim() || "Quelle",
            url: String(x.url || "").trim()
          }))
      : [];
    return {
      title: String(slide?.title || "").trim(),
      text: String(slide?.text || slide?.quote || slide?.statement || "").trim(),
      quote: String(slide?.quote || "").trim(),
      explanation: String(slide?.explanation || slide?.note || "").trim(),
      source: String(slide?.source || "").trim(),
      image: String(slide?.image || "").trim(),
      pdf: String(slide?.pdf || "").trim(),
      links
    };
  }

  function sanitizeSlideMarkdownBody(body) {
    let s = String(body || "").replace(/^\uFEFF/, "").trim();
    s = s.replace(/^```(?:markdown|md)?\s*\n/i, "").replace(/\n```\s*$/i, "");
    return s.trim();
  }

  function bodyHasSlideMarkers(body) {
    return SLIDE_MARKER_TEST.test(String(body || ""));
  }

  function isSlidePostMode(layout, type, body) {
    const mode = String(layout || type || "")
      .trim()
      .toLowerCase();
    if (mode === "slides" || mode === "slide") return true;
    return bodyHasSlideMarkers(body);
  }

  function isSlidePostRecord(post) {
    if (!post) return false;
    if (Array.isArray(post.slides) && post.slides.length) return true;
    return isSlidePostMode(post.layout, post.type, post.statement || post._rawBody || "");
  }

  function splitSlideChunk(chunk) {
    let text = sanitizeSlideMarkdownBody(chunk);
    text = text.replace(SLIDE_MARKER_RE, "").replace(/<!--[\s\S]*?-->/g, "");
    text = text.replace(/^---+$/gm, "").trim();
    if (!text) return null;

    let title = "";
    const titleMatch = text.match(/^#{1,3}\s+(.+?)(?:\n|$)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      text = text.replace(/^#{1,3}\s+.+?(?:\n|$)/, "").trim();
    }
    text = text.replace(/^---+$/gm, "").trim();
    if (!title && !text) return null;
    return normalizeSlideEntry({ title, text });
  }

  function parseSlidesFromBody(body) {
    const clean = sanitizeSlideMarkdownBody(body);
    if (!bodyHasSlideMarkers(clean)) return [];
    const parts = clean.split(SLIDE_MARKER_RE);
    const slides = [];
    for (const part of parts) {
      const slide = splitSlideChunk(part);
      if (slide && (slide.title || slide.text)) slides.push(slide);
    }
    return slides;
  }

  function splitFrontmatter(markdown) {
    const match = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return { yaml: "", body: String(markdown || "") };
    return { yaml: match[1] || "", body: match[2] || "" };
  }

  function frontmatterField(yaml, key) {
    const m = String(yaml || "").match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"));
    return m ? parseValue(m[1]) : "";
  }

  function analyzeSlideMarkdown(markdown) {
    const { yaml, body } = splitFrontmatter(markdown);
    const layout = frontmatterField(yaml, "layout");
    const type = frontmatterField(yaml, "type");
    const hasBodyMarkers = bodyHasSlideMarkers(body);
    const hasTypeSlide = /^(slide|slides)$/i.test(String(type || layout || "").trim());
    const isSlide = isSlidePostMode(layout, type, body);
    const slides = parseSlidesFromBody(body);
    const warnings = [];
    const errors = [];

    if (/^```(?:markdown|md)?/m.test(body)) {
      warnings.push("Markdown-Codeblock erkannt — vor dem Speichern entfernen");
    }
    if (hasTypeSlide && !slides.length && !/^slides:\s*$/m.test(yaml)) {
      errors.push('type: "slide" gesetzt, aber keine Slides erkannt (<!-- slide: N --> fehlt?)');
    }
    if (!hasTypeSlide && hasBodyMarkers) {
      warnings.push('Slide-Marker im Body, aber type: "slide" oder layout: "slides" fehlt');
    }
    if (hasTypeSlide && /^slides:\s*$/m.test(yaml) && !slides.length) {
      errors.push("Slide-Frontmatter ohne gültigen slides:-Block und ohne Body-Marker");
    }

    return {
      isSlide,
      slides,
      slideCount: slides.length,
      hasBodyMarkers,
      hasTypeSlide,
      warnings,
      errors
    };
  }

  function validateSlideMarkdown(markdown) {
    const info = analyzeSlideMarkdown(markdown);
    return {
      ok: !info.errors.length,
      errors: info.errors,
      warnings: info.warnings,
      info
    };
  }

  global.DARSlidePostParser = {
    parseValue,
    normalizeSlideEntry,
    sanitizeSlideMarkdownBody,
    bodyHasSlideMarkers,
    isSlidePostMode,
    isSlidePostRecord,
    parseSlidesFromBody,
    analyzeSlideMarkdown,
    validateSlideMarkdown
  };
})(typeof window !== "undefined" ? window : global);
