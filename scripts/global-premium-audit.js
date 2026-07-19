#!/usr/bin/env node
/**
 * DAR AL TAWḤID — Global Premium Audit (Phase 1)
 * Scans codebase for recurring UI/UX debt patterns.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGETS = [
  "test/index.html",
  "index.html",
  "assets/spatial/spatial-components.css",
  "assets/app-card-layout.css",
  "assets/app-theme-surfaces.css",
  "styles/dar-design-system.css",
];

const PATTERNS = [
  { id: "hardcoded-hex", label: "Hardcoded hex colors", regex: /#[0-9a-fA-F]{3,8}\b/g },
  { id: "hardcoded-rgba", label: "Hardcoded rgba/rgb", regex: /rgba?\([^)]+\)/g },
  { id: "overflow-hidden", label: "overflow:hidden (clip risk)", regex: /overflow\s*:\s*hidden/g },
  { id: "nowrap", label: "white-space:nowrap", regex: /white-space\s*:\s*nowrap/g },
  { id: "fixed-height", label: "Fixed min-height >= 80px", regex: /min-height\s*:\s*(8\d|[9]\d|[1-9]\d{2,})px/g },
  { id: "100vh", label: "100vh usage", regex: /100vh/g },
  { id: "emoji-ui", label: "Emoji in nav/render strings", regex: /["'`][^"'`]*[\u{1F300}-\u{1FAFF}]/gu },
  { id: "autofill-missing", label: "Inputs without autofill override nearby", regex: /input\[type=/g, inverse: true },
  { id: "z-index-high", label: "z-index > 90", regex: /z-index\s*:\s*(\d{2,})/g },
  { id: "scroll-into-view", label: "scrollIntoView calls", regex: /scrollIntoView\s*\(/g },
  { id: "inline-style", label: "Inline style attributes", regex: /\sstyle="/g },
];

function read(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf8");
}

function countMatches(text, regex) {
  const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
  const re = new RegExp(regex.source, flags);
  return [...text.matchAll(re)].length;
}

function lineHits(text, regex, max = 8) {
  const lines = text.split(/\r?\n/);
  const hits = [];
  lines.forEach((line, i) => {
    if (regex.test(line)) hits.push({ line: i + 1, sample: line.trim().slice(0, 140) });
    regex.lastIndex = 0;
  });
  return hits.slice(0, max);
}

const findings = [];
const summary = { generatedAt: new Date().toISOString(), files: {}, totals: {} };

for (const file of TARGETS) {
  const text = read(file);
  if (!text) {
    summary.files[file] = { missing: true };
    continue;
  }
  const fileFindings = [];
  for (const p of PATTERNS) {
    const count = countMatches(text, p.regex);
    if (count === 0 && !p.inverse) continue;
    const entry = {
      id: p.id,
      label: p.label,
      count,
      samples: lineHits(text, p.regex, 5),
      plannedFix: plannedFixFor(p.id),
      status: "open",
    };
    fileFindings.push(entry);
    summary.totals[p.id] = (summary.totals[p.id] || 0) + count;
  }
  summary.files[file] = { findings: fileFindings };
  findings.push(...fileFindings.map((f) => ({ ...f, file })));
}

function plannedFixFor(id) {
  const map = {
    "hardcoded-hex": "Migrate to styles/tokens/colors.css semantic vars",
    "hardcoded-rgba": "Use theme tokens + color-mix",
    "overflow-hidden": "Audit per component; remove or add padding for Arabic/diacritics",
    nowrap: "Allow wrap except short labels; add min-width:0",
    "fixed-height": "Reduce feature card min-heights to 82–100px spec",
    "100vh": "Prefer 100dvh/100svh + visualViewport",
    "emoji-ui": "Replace with assets/icons SVG via DARSpatial",
    "autofill-missing": "styles/components/ui-inputs.css autofill block",
    "z-index-high": "Centralize z-index scale in navigation/states tokens",
    "scroll-into-view": "Debounce/guard scrollIntoView; preserve user scroll",
    "inline-style": "Move to design tokens / component CSS",
  };
  return map[id] || "Review in Phase 4+";
}

const gaps = [
  {
    area: "Design tokens",
    status: "in_progress",
    note: "styles/dar-design-system.css created; legacy inline :root still in index.html",
  },
  {
    area: "Unified inputs",
    status: "in_progress",
    note: "styles/components/ui-inputs.css maps legacy selectors; glass search uses focus-within",
  },
  {
    area: "Test vs Live parity",
    status: "open",
    note: "Spatial Premium only wired in test/index.html; live index.html still emoji nav",
  },
  {
    area: "Theme geometry",
    status: "open",
    note: "~1900 theme-specific layout overrides remain inline; radius/spacing aliased",
  },
  {
    area: "Bottom nav visibility",
    status: "open",
    note: "Contrast rules exist per theme but not centralized",
  },
];

const report = {
  phase: 6,
  title: "Global Premium Audit — Complete (Dar Test)",
  buildId: "app-shell-v290",
  summary,
  topFindings: findings.sort((a, b) => b.count - a.count).slice(0, 25),
  structuralGaps: gaps,
  completedPhases: [
    "Phase 1: audit scan + baseline report",
    "Phase 2: design tokens + unified inputs",
    "Phase 3: AppButton, AppCard, FeatureCard, Nav, Modal, States",
    "Phase 4: pilot Home, Mehr, Bottom Nav, Quran, global search",
    "Phase 5: remaining pages wrapped with dar-page-shell",
    "Phase 6: test matrix documented (Dar Test)",
  ],
  nextPhases: [
    "Phase 7: publish same commit to visitor app after Dar Test sign-off",
  ],
};

const outDir = path.join(ROOT, "docs");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "global-premium-audit-phase1.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log("GLOBAL-PREMIUM-AUDIT written:", outPath);
console.log("Top totals:", JSON.stringify(summary.totals, null, 2));
