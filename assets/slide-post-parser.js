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

  function yamlQuote(value) {
    return '"' + String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }

  function slugifyAdminTitle(value) {
    return String(value || "beitrag")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "beitrag";
  }

  function setYamlField(yaml, key, value) {
    const line = `${key}: ${yamlQuote(value)}`;
    const re = new RegExp(`^${key}:\\s*.*$`, "m");
    if (re.test(yaml)) return yaml.replace(re, line);
    return (String(yaml || "").trimEnd() + "\n" + line).trim();
  }

  function removeYamlField(yaml, key) {
    return String(yaml || "")
      .split(/\r?\n/)
      .filter((line) => !new RegExp(`^${key}:\\s*`).test(line.trim()))
      .join("\n")
      .trim();
  }

  function ensureSlideFrontmatter(markdown, fallback) {
    const raw = sanitizeSlideMarkdownBody(markdown);
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    let yaml = match ? match[1] || "" : "";
    const body = match ? match[2] || "" : raw;
    const id = frontmatterField(yaml, "id") || fallback?.id || fallback?.slug || slugifyAdminTitle(fallback?.title || "beitrag");
    const title = frontmatterField(yaml, "title") || fallback?.title || id;
    yaml = setYamlField(yaml, "id", id);
    yaml = setYamlField(yaml, "title", title);
    yaml = setYamlField(yaml, "type", "slide");
    yaml = setYamlField(yaml, "layout", "slides");
    if (!frontmatterField(yaml, "status")) yaml = setYamlField(yaml, "status", fallback?.status || "published");
    return `---\n${yaml.trim()}\n---\n\n${body.trim()}\n`;
  }

  function ensureSingleFrontmatter(markdown, fallback) {
    const raw = sanitizeSlideMarkdownBody(markdown);
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return raw;
    let yaml = match[1] || "";
    yaml = removeYamlField(removeYamlField(yaml, "type"), "layout");
    if (!frontmatterField(yaml, "status")) yaml = setYamlField(yaml, "status", fallback?.status || "published");
    return `---\n${yaml.trim()}\n---\n\n${String(match[2] || "").trim()}\n`;
  }

  function adminFallbackFromPanel(panel) {
    const q = (name) => panel?.querySelector(`[data-live-field="${name}"]`)?.value || "";
    return {
      title: q("title"),
      id: q("id") || q("slug"),
      slug: q("slug") || q("id"),
      status: q("status") || "published"
    };
  }

  function adminAnalyzeStatus(markdown, mode) {
    const audit = analyzeSlideMarkdown(markdown);
    if (mode === "slide") {
      if (audit.errors.length) return "Fehler: " + audit.errors.join(" · ");
      if (audit.slideCount) return `Slide-Modus erkannt · ${audit.slideCount} Slides`;
      if (!audit.hasBodyMarkers) return "Slide-Modus gewählt · bitte <!-- slide: 1 --> Marker einfügen";
      return "Slide-Modus vorbereitet";
    }
    if (audit.isSlide || audit.hasBodyMarkers) return "Achtung: Markdown enthält Slide-Marker";
    return "Einzelbeitrag vorbereitet";
  }

  function enhanceAdminPostEditor() {
    if (typeof document === "undefined") return;
    const panel = document.getElementById("liveEditEditorPanel");
    const markdown = panel?.querySelector('[data-live-field="markdown"]');
    const title = panel?.querySelector('[data-live-field="title"]');
    if (!panel || !markdown || !title) return;

    if (!panel.querySelector("[data-dar-post-mode-box]")) {
      const audit = analyzeSlideMarkdown(markdown.value || "");
      const inferred = audit.isSlide || audit.hasBodyMarkers ? "slide" : "single";
      const box = document.createElement("div");
      box.className = "live-edit-field dar-post-mode-box";
      box.setAttribute("data-dar-post-mode-box", "1");
      box.innerHTML = `
        <label>Post-Art</label>
        <div class="live-edit-devices" aria-label="Post-Art">
          <label class="btn" style="gap:7px"><input type="radio" name="darPostMode" value="single" ${inferred === "single" ? "checked" : ""}> Einzelbeitrag</label>
          <label class="btn primary" style="gap:7px"><input type="radio" name="darPostMode" value="slide" ${inferred === "slide" ? "checked" : ""}> Slide-Modus</label>
        </div>
        <p class="hint" data-dar-post-mode-status style="margin-top:8px">${adminAnalyzeStatus(markdown.value || "", inferred)}</p>`;
      const markdownField = markdown.closest(".live-edit-field") || markdown;
      markdownField.parentNode.insertBefore(box, markdownField);
    }

    const foot = panel.querySelector(".live-edit-editor-foot > div:last-child");
    if (foot && !foot.querySelector("[data-dar-post-publish-mode]")) {
      const single = document.createElement("button");
      single.type = "button";
      single.className = "btn";
      single.setAttribute("data-dar-post-publish-mode", "single");
      single.textContent = "Einzelbeitrag posten";
      const slide = document.createElement("button");
      slide.type = "button";
      slide.className = "btn primary";
      slide.setAttribute("data-dar-post-publish-mode", "slide");
      slide.textContent = "Slide-Modus posten";
      foot.insertBefore(single, foot.querySelector("[data-live-editor-publish]"));
      foot.insertBefore(slide, foot.querySelector("[data-live-editor-publish]"));
      const original = foot.querySelector("[data-live-editor-publish]");
      if (original) original.textContent = "Auswahl veröffentlichen";
    }

    panel.querySelectorAll('input[name="darPostMode"]').forEach((radio) => {
      radio.onchange = () => updateAdminPostModeStatus(panel);
    });
    markdown.oninput = () => updateAdminPostModeStatus(panel);
    updateAdminPostModeStatus(panel);
  }

  function selectedAdminPostMode(panel) {
    return panel?.querySelector('input[name="darPostMode"]:checked')?.value === "slide" ? "slide" : "single";
  }

  function updateAdminPostModeStatus(panel) {
    const markdown = panel?.querySelector('[data-live-field="markdown"]');
    const status = panel?.querySelector("[data-dar-post-mode-status]");
    if (!markdown || !status) return;
    status.textContent = adminAnalyzeStatus(markdown.value || "", selectedAdminPostMode(panel));
  }

  function prepareAdminPostMarkdown(panel, forcedMode) {
    const markdown = panel?.querySelector('[data-live-field="markdown"]');
    if (!markdown) return true;
    const mode = forcedMode || selectedAdminPostMode(panel);
    const fallback = adminFallbackFromPanel(panel);
    let next = markdown.value || "";

    if (mode === "slide") {
      next = ensureSlideFrontmatter(next, fallback);
      const check = validateSlideMarkdown(next);
      if (!check.ok) {
        alert("Slide-Modus blockiert:\n\n" + check.errors.join("\n"));
        return false;
      }
      if (!check.info.slideCount && !check.info.hasBodyMarkers) {
        alert("Slide-Modus blockiert: Es wurden keine <!-- slide: N --> Marker erkannt. Bitte den Markdown in Slides trennen.");
        return false;
      }
      if (check.warnings.length && !confirm("Slide-Modus mit Warnung veröffentlichen?\n\n" + check.warnings.join("\n"))) {
        return false;
      }
    } else {
      const audit = analyzeSlideMarkdown(next);
      if ((audit.isSlide || audit.hasBodyMarkers) && !confirm("Markdown enthält Slide-Marker oder Slide-Frontmatter. Wirklich als Einzelbeitrag posten?")) {
        return false;
      }
      next = ensureSingleFrontmatter(next, fallback);
    }

    markdown.value = next;
    markdown.dispatchEvent(new Event("input", { bubbles: true }));
    updateAdminPostModeStatus(panel);
    return true;
  }

  function installAdminPostModeEnhancer() {
    if (typeof document === "undefined" || global.__DAR_ADMIN_POST_MODE_ENHANCER__) return;
    global.__DAR_ADMIN_POST_MODE_ENHANCER__ = true;

    document.addEventListener(
      "click",
      function (event) {
        const custom = event.target?.closest?.("[data-dar-post-publish-mode]");
        if (custom) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const panel = document.getElementById("liveEditEditorPanel");
          const mode = custom.getAttribute("data-dar-post-publish-mode") === "slide" ? "slide" : "single";
          const radio = panel?.querySelector(`input[name="darPostMode"][value="${mode}"]`);
          if (radio) radio.checked = true;
          if (!prepareAdminPostMarkdown(panel, mode)) return;
          panel?.querySelector("[data-live-editor-publish]")?.click();
          return;
        }

        const publish = event.target?.closest?.("[data-live-editor-publish]");
        if (publish) {
          const panel = document.getElementById("liveEditEditorPanel");
          if (panel?.querySelector("[data-dar-post-mode-box]") && !prepareAdminPostMarkdown(panel)) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        }
      },
      true
    );

    const mo = new MutationObserver(() => enhanceAdminPostEditor());
    mo.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", enhanceAdminPostEditor);
    setTimeout(enhanceAdminPostEditor, 250);
  }

  global.DARSlidePostParser = {
    parseValue,
    normalizeSlideEntry,
    sanitizeSlideMarkdownBody,
    bodyHasSlideMarkers,
    isSlidePostMode,
    isSlidePostRecord,
    parseSlidesFromBody,
    splitFrontmatter,
    frontmatterField,
    analyzeSlideMarkdown,
    validateSlideMarkdown,
    ensureSlideFrontmatter,
    ensureSingleFrontmatter,
    prepareAdminPostMarkdown,
    installAdminPostModeEnhancer
  };

  installAdminPostModeEnhancer();
})(typeof window !== "undefined" ? window : global);
