/**
 * DAR Admin – Quellen-Datei-Manager (Markdown/YAML-Hilfen)
 * Wird von admin/index.html eingebunden.
 */
(function (global) {
  "use strict";

  const SOURCE_LABEL_PRESETS = [
    "→ PDF/Scan",
    "→ Bild-Scan",
    "→ Scan",
    "→ Islamweb",
    "→ Shamela",
    "→ Dorar",
    "→ Ketabonline",
    "→ al-maktaba",
    "→ Quelle"
  ];

  function escYaml(v) {
    return String(v ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function parseValue(v) {
    v = String(v || "").trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
    return v;
  }

  function yamlTopLevelBlock(yaml, key) {
    const lines = String(yaml || "").split(/\r?\n/);
    const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`).test(line));
    if (start < 0) return [];
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^[A-Za-z0-9_-]+:\s*/.test(lines[i])) break;
      out.push(lines[i]);
    }
    return out;
  }

  function readYamlScalar(lines, start, baseIndent, fold) {
    const block = [];
    let i = start + 1;
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") {
        block.push("");
        continue;
      }
      const indent = (line.match(/^ */) || [""])[0].length;
      if (indent <= baseIndent && /^\s*[A-Za-z0-9_-]+:\s*/.test(line)) break;
      if (indent <= baseIndent && /^\s*-\s*/.test(line)) break;
      block.push(line.slice(Math.min(line.length, baseIndent + 2)));
    }
    return { value: fold ? block.join(" ").replace(/\s+/g, " ").trim() : block.join("\n").trim(), next: i - 1 };
  }

  function parseYamlLinks(lines, start, baseIndent, listStopIndent) {
    const links = [];
    let item = null;
    let i = start + 1;
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const indent = (line.match(/^ */) || [""])[0].length;
      if (indent <= baseIndent && /^\s*[A-Za-z0-9_-]+:\s*/.test(line)) break;
      if (listStopIndent != null ? indent <= listStopIndent && /^\s*-\s*/.test(line) : indent <= baseIndent && /^\s*-\s*/.test(line)) break;
      const label = line.match(/^\s*-\s*label:\s*(.*)$/);
      if (label) {
        item = { label: parseValue(label[1]), url: "" };
        links.push(item);
        continue;
      }
      const url = line.match(/^\s*url:\s*(.*)$/);
      if (url && item) item.url = parseValue(url[1]);
    }
    return { links: links.filter((x) => x.label || x.url), next: i - 1 };
  }

  function normalizeSlideEntry(slide) {
    const links = Array.isArray(slide?.links)
      ? slide.links
          .filter((x) => x && String(x.url || "").trim())
          .map((x) => ({ label: String(x.label || "Quelle").trim() || "Quelle", url: String(x.url || "").trim() }))
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

  function parseSlidesFromYaml(yaml) {
    const lines = yamlTopLevelBlock(yaml, "slides");
    if (!lines.length) return [];
    let listIndent = null;
    lines.forEach((line) => {
      const m = line.match(/^(\s*)-\s/);
      if (m && m[1].length >= 1) listIndent = listIndent === null ? m[1].length : Math.min(listIndent, m[1].length);
    });
    if (listIndent === null) return [];
    const slideStartRe = new RegExp(`^\\s{${listIndent}}-\\s*(.*)$`);
    const slides = [];
    let current = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const start = line.match(slideStartRe);
      if (start) {
        if (current) slides.push(current);
        current = { title: "", text: "", quote: "", explanation: "", source: "", image: "", pdf: "", links: [] };
        const inline = start[1].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (inline) current[inline[1]] = parseValue(inline[2]);
        continue;
      }
      if (!current) continue;
      const key = line.match(/^(\s+)([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!key) continue;
      const indent = key[1].length;
      const name = key[2];
      const raw = key[3].trim();
      if (name === "links") {
        const parsed = parseYamlLinks(lines, i, indent, listIndent);
        current.links = parsed.links;
        i = parsed.next;
        continue;
      }
      if (raw === "|" || raw === ">") {
        const scalar = readYamlScalar(lines, i, indent, raw === ">");
        current[name] = scalar.value;
        i = scalar.next;
        continue;
      }
      current[name] = parseValue(raw);
    }
    if (current) slides.push(current);
    return slides.map(normalizeSlideEntry).filter((s) => s.title || s.text || s.quote || s.explanation || s.source || s.links.length || s.image || s.pdf);
  }

  function splitFrontmatter(markdown) {
    const m = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    return m ? { yaml: m[1], body: m[2] || "" } : { yaml: "", body: String(markdown || "") };
  }

  function joinFrontmatter(yaml, body) {
    const y = String(yaml || "").trimEnd();
    const b = String(body || "").trim();
    return `---\n${y}\n---\n\n${b}\n`.replace(/\n{3,}/g, "\n\n");
  }

  function parsePostLinksFromYaml(yaml) {
    const lines = String(yaml || "").split(/\r?\n/);
    const start = lines.findIndex((l) => /^links:\s*$/.test(l));
    if (start < 0) return [];
    const links = [];
    let item = null;
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^[A-Za-z0-9_-]+:\s*/.test(line) && !/^\s/.test(line)) break;
      const lm = line.match(/^\s*-\s*label:\s*(.*)$/);
      if (lm) {
        item = { label: parseValue(lm[1]), url: "" };
        links.push(item);
        continue;
      }
      const um = line.match(/^\s*url:\s*(.*)$/);
      if (um && item) item.url = parseValue(um[1]);
    }
    return links.filter((x) => x.label || x.url);
  }

  function serializeLinksBlock(links, indent) {
    const pad = " ".repeat(indent);
    const ip = " ".repeat(indent + 2);
    let out = `${pad}links:\n`;
    (links || []).forEach((link) => {
      out += `${ip}- label: "${escYaml(link.label || "Quelle")}"\n`;
      out += `${ip}  url: "${escYaml(link.url || "")}"\n`;
    });
    return out.trimEnd();
  }

  function serializeSlidesBlock(slides) {
    const slidesArr = Array.isArray(slides) ? slides : [];
    if (!slidesArr.length) return "";
    let out = "slides:\n";
    slidesArr.forEach((slide, idx) => {
      const fields = ["title", "text", "quote", "explanation", "source", "image", "pdf"];
      const firstField = fields.find((key) => String(slide[key] || "").trim());
      if (firstField) {
        const val = String(slide[firstField]).trim();
        out += val.includes("\n")
          ? `  - ${firstField}: |\n${val.split("\n").map((line) => `      ${line}`).join("\n")}\n`
          : `  - ${firstField}: "${escYaml(val)}"\n`;
      } else {
        out += "  - title: \"Slide\"\n";
      }
      fields.slice(fields.indexOf(firstField || "title") + 1).forEach((key) => {
        const val = String(slide[key] || "").trim();
        if (!val) return;
        if (val.includes("\n")) {
          out += `    ${key}: |\n`;
          val.split("\n").forEach((line) => {
            out += `      ${line}\n`;
          });
        } else {
          out += `    ${key}: "${escYaml(val)}"\n`;
        }
      });
      if (slide.links?.length) {
        out += serializeLinksBlock(slide.links, 4) + "\n";
      }
    });
    return out.trimEnd();
  }

  function replaceYamlBlock(yaml, key, newBlock) {
    const lines = String(yaml || "").split("\n");
    const start = lines.findIndex((l) => new RegExp(`^${key}:\\s*$`).test(l) || new RegExp(`^${key}:\\s*`).test(l));
    if (start < 0) {
      if (!newBlock) return yaml;
      return `${String(yaml || "").trimEnd()}\n${newBlock}`.trimEnd();
    }
    let end = start + 1;
    if (/:\s*\S/.test(lines[start])) {
      while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === "")) end++;
    } else {
      while (end < lines.length) {
        if (/^[A-Za-z0-9_-]+:\s*/.test(lines[end]) && !/^\s/.test(lines[end])) break;
        end++;
      }
    }
    const before = lines.slice(0, start);
    const after = lines.slice(end);
    if (!newBlock) return [...before, ...after].join("\n").replace(/\n{3,}/g, "\n\n");
    return [...before, ...String(newBlock).split("\n"), ...after].join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function isSlidePostYaml(yaml) {
    const layout = String(yaml || "").match(/^layout:\s*["']?(.*?)["']?\s*$/m);
    if (layout && /slides/i.test(layout[1])) return true;
    return /^slides:\s*$/m.test(yaml);
  }

  function analyzePostSources(markdown) {
    const { yaml, body } = splitFrontmatter(markdown);
    const postLinks = parsePostLinksFromYaml(yaml);
    const slides = parseSlidesFromYaml(yaml);
    const isSlide = isSlidePostYaml(yaml);
    const attachments = String(yaml || "").match(/^attachments:\s*\n([\s\S]*?)(?=\n[A-Za-z0-9_-]+:|$)/m);
    const media = String(yaml || "").match(/^media:\s*\n([\s\S]*?)(?=\n[A-Za-z0-9_-]+:|$)/m);
    return {
      yaml,
      body,
      postLinks,
      slides,
      isSlide,
      attachments: attachments ? attachments[0] : "",
      media: media ? media[0] : "",
      source: (yaml.match(/^source:\s*(.*)$/m) || [])[1] ? parseValue((yaml.match(/^source:\s*(.*)$/m) || [])[1]) : ""
    };
  }

  function normalizeLinkTarget(target) {
    if (!target || target === "post" || target.scope === "post") return { scope: "post", indices: [] };
    if (typeof target === "number") return { scope: "slide", indices: [target] };
    if (Array.isArray(target)) return { scope: "slide", indices: target.map((n) => Number(n)).filter((n) => n >= 0) };
    if (target.scope === "slide") {
      const indices = Array.isArray(target.indices) ? target.indices : target.index != null ? [target.index] : [];
      return { scope: "slide", indices: indices.map((n) => Number(n)).filter((n) => n >= 0) };
    }
    return { scope: "post", indices: [] };
  }

  function appendLinkToMarkdownTarget(markdown, label, url, target) {
    const repaired = typeof repairYamlFrontmatter === "function" ? repairYamlFrontmatter(String(markdown || "")) : String(markdown || "");
    const { yaml, body } = splitFrontmatter(repaired);
    const t = normalizeLinkTarget(target);
    const entry = { label: String(label || "→ Quelle"), url: String(url || "") };

    if (t.scope === "slide" && t.indices.length) {
      let slides = parseSlidesFromYaml(yaml);
      if (!slides.length) throw new Error("Kein slides:-Block — Slide-Ziel nicht möglich");
      t.indices.forEach((idx) => {
        if (!slides[idx]) throw new Error(`Slide ${idx + 1} existiert nicht`);
        slides[idx].links = [...(slides[idx].links || []), { ...entry }];
      });
      let newYaml = replaceYamlBlock(yaml, "slides", serializeSlidesBlock(slides));
      return joinFrontmatter(newYaml, body);
    }

    const links = parsePostLinksFromYaml(yaml);
    links.push(entry);
    let newYaml;
    if (/^links:/m.test(yaml)) {
      newYaml = replaceYamlBlock(yaml, "links", serializeLinksBlock(links, 0));
    } else if (/^logo:\s/m.test(yaml)) {
      newYaml = yaml.replace(/^logo:\s/m, `${serializeLinksBlock(links, 0)}\nlogo: `);
    } else {
      newYaml = `${yaml.trimEnd()}\n${serializeLinksBlock(links, 0)}`;
    }
    return joinFrontmatter(newYaml, body);
  }

  function removeLinkFromMarkdownTarget(markdown, target, linkIndex) {
    const { yaml, body } = splitFrontmatter(markdown);
    const t = normalizeLinkTarget(target);
    const idx = Number(linkIndex);
    if (t.scope === "slide") {
      const slideIdx = t.indices[0];
      const slides = parseSlidesFromYaml(yaml);
      if (!slides[slideIdx]) throw new Error("Slide nicht gefunden");
      slides[slideIdx].links = (slides[slideIdx].links || []).filter((_, i) => i !== idx);
      const newYaml = replaceYamlBlock(yaml, "slides", serializeSlidesBlock(slides));
      return joinFrontmatter(newYaml, body);
    }
    const links = parsePostLinksFromYaml(yaml);
    links.splice(idx, 1);
    const newYaml = links.length ? replaceYamlBlock(yaml, "links", serializeLinksBlock(links, 0)) : replaceYamlBlock(yaml, "links", "");
    return joinFrontmatter(newYaml, body);
  }

  function updateLinkInMarkdownTarget(markdown, target, linkIndex, label, url) {
    const { yaml, body } = splitFrontmatter(markdown);
    const t = normalizeLinkTarget(target);
    const idx = Number(linkIndex);
    if (t.scope === "slide") {
      const slideIdx = t.indices[0];
      const slides = parseSlidesFromYaml(yaml);
      if (!slides[slideIdx] || !slides[slideIdx].links[idx]) throw new Error("Link nicht gefunden");
      slides[slideIdx].links[idx] = { label: String(label || ""), url: String(url || "") };
      const newYaml = replaceYamlBlock(yaml, "slides", serializeSlidesBlock(slides));
      return joinFrontmatter(newYaml, body);
    }
    const links = parsePostLinksFromYaml(yaml);
    if (!links[idx]) throw new Error("Link nicht gefunden");
    links[idx] = { label: String(label || ""), url: String(url || "") };
    const newYaml = replaceYamlBlock(yaml, "links", serializeLinksBlock(links, 0));
    return joinFrontmatter(newYaml, body);
  }

  function setSlideMediaField(markdown, slideIndex, field, value) {
    if (!["image", "pdf"].includes(field)) throw new Error("Nur image oder pdf erlaubt");
    const { yaml, body } = splitFrontmatter(markdown);
    const slides = parseSlidesFromYaml(yaml);
    const idx = Number(slideIndex);
    if (!slides[idx]) throw new Error(`Slide ${idx + 1} nicht gefunden`);
    slides[idx][field] = String(value || "").trim();
    const newYaml = replaceYamlBlock(yaml, "slides", serializeSlidesBlock(slides));
    return joinFrontmatter(newYaml, body);
  }

  function clearSlideMediaField(markdown, slideIndex, field) {
    return setSlideMediaField(markdown, slideIndex, field, "");
  }

  function extractSourcePathsFromMarkdown(markdown) {
    const paths = new Set();
    const re = /(?:\/assets\/sources\/|assets\/sources\/)([a-zA-Z0-9_./-]+\.(?:pdf|png|jpe?g|webp))(?:#page=\d+)?/gi;
    let m;
    while ((m = re.exec(String(markdown || "")))) {
      paths.add(`assets/sources/${m[1].replace(/^\/+/, "")}`);
    }
    return [...paths];
  }

  function urlLooksBroken(url) {
    const u = String(url || "").trim();
    if (!u) return true;
    if (/^https?:\/\//i.test(u)) return false;
    if (/^\/assets\/sources\//i.test(u) || /^assets\/sources\//i.test(u)) return false;
    if (/^\/sources\//i.test(u)) return false;
    if (/\.(pdf|png|jpe?g|webp)(\#|$)/i.test(u)) return false;
    return !/^\/[\w./-]+$/i.test(u);
  }

  function validateSourceSave(markdown, pendingUploads) {
    const errors = [];
    const warnings = [];
    const info = analyzePostSources(markdown);

    try {
      if (!/^---\s*\n[\s\S]*?\n---/m.test(String(markdown || ""))) errors.push("Frontmatter fehlt oder ist ungültig");
      if (info.isSlide && !info.slides.length) errors.push("Slide-Beitrag ohne gültigen slides:-Block");
      const allLinks = [
        ...info.postLinks.map((l, i) => ({ ...l, where: "Beitrag", index: i })),
        ...info.slides.flatMap((s, si) => (s.links || []).map((l, i) => ({ ...l, where: `Slide ${si + 1}`, index: i })))
      ];
      const seen = new Set();
      allLinks.forEach((link) => {
        const key = `${link.label}::${link.url}`;
        if (seen.has(key)) warnings.push(`Doppelter Link: ${link.label} (${link.where})`);
        seen.add(key);
        if (urlLooksBroken(link.url)) errors.push(`Kaputter Link in ${link.where}: ${link.url || "(leer)"}`);
      });
      const pendingPaths = new Set((pendingUploads || []).map((f) => String(f.path || "").replace(/^\/+/, "")));
      allLinks.forEach((link) => {
        const m = String(link.url || "").match(/^\/?(assets\/sources\/[^#\s]+)/i);
        if (m && !pendingPaths.has(m[1])) {
          /* online check client-side optional */
        }
      });
      pendingPaths.forEach((p) => {
        if (!p.startsWith("assets/sources/")) errors.push(`Upload-Pfad ungültig: ${p}`);
      });
    } catch (e) {
      errors.push(String(e.message || e));
    }

    return { ok: !errors.length, errors, warnings, info };
  }

  function postHasLocalSourceFiles(markdown) {
    return /assets\/sources\/|\/assets\/sources\//i.test(String(markdown || ""));
  }

  function postHasPdfOrImageLinks(markdown) {
    return /\.(pdf|png|jpe?g|webp)|#page=\d+|PDF\/Scan|Bild-Scan|Bildscan/i.test(String(markdown || ""));
  }

  function parseQuellenCatalogHead(text, filename) {
    const head = String(text || "").slice(0, 4500);
    const tags = [];
    const tagBlock = head.match(/^tags:\s*\n([\s\S]*?)(?=\n[A-Za-z0-9_-]+:|$)/m);
    if (tagBlock) {
      tagBlock[1].split("\n").forEach((line) => {
        const m = line.match(/^\s*-\s*(.*)$/);
        if (m) tags.push(parseValue(m[1]));
      });
    }
    const id = (head.match(/^id:\s*["']?(.*?)["']?\s*$/m) || [])[1] || filename.replace(/\.md$/i, "");
    const layout = (head.match(/^layout:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "";
    const isSlide = /slides/i.test(layout) || /^slides:\s*$/m.test(head);
    return {
      filename,
      title: (head.match(/^title:\s*["']?(.*?)["']?\s*$/m) || [])[1]?.replace(/^📖\s*/, "").trim() || filename.replace(/\.md$/i, ""),
      category: (head.match(/^category:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "Beiträge",
      topic: (head.match(/^topic:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "",
      scholar: (head.match(/^scholar:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "",
      book: (head.match(/^book:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "",
      id: parseValue(id),
      date: (head.match(/^date:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "",
      tags,
      isSlide,
      hasLinks: /^links:\s*$/m.test(head),
      hasPdfImage: postHasPdfOrImageLinks(head),
      hasLocalSources: postHasLocalSourceFiles(head)
    };
  }

  function filterQuellenCatalog(catalog, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => {
      const hay = [p.id, p.filename, p.title, p.category, p.topic, p.scholar, p.book, p.date, ...(p.tags || [])].join(" ").toLowerCase();
      return q.split(/\s+/).every((term) => hay.includes(term) || hay.includes(term.replace(/-/g, "")));
    });
  }

  global.DARQuellen = {
    SOURCE_LABEL_PRESETS,
    parseSlidesFromYaml,
    analyzePostSources,
    appendLinkToMarkdownTarget,
    removeLinkFromMarkdownTarget,
    updateLinkInMarkdownTarget,
    setSlideMediaField,
    clearSlideMediaField,
    extractSourcePathsFromMarkdown,
    validateSourceSave,
    parseQuellenCatalogHead,
    filterQuellenCatalog,
    postHasLocalSourceFiles,
    postHasPdfOrImageLinks,
    serializeSlidesBlock
  };
})(typeof window !== "undefined" ? window : globalThis);
