import { DAR_VIDEO_PROFILE } from "./profile.js";

const FALLBACK_STATEMENTS = [
  {
    id: "vs-stmt-001",
    speaker: "Ibn al-Qayyim",
    de: "Wahres Wissen ist das, was die Seele demütig macht und das Handeln verbessert.",
    source: "Madārij as-Sālikīn · sinngemäß",
    topic: "Wissen und Demut",
    used: false
  },
  {
    id: "vs-stmt-002",
    speaker: "ʿUmar ibn ʿAbd al-ʿAzīz",
    de: "Die beste Sache nach dem Glauben ist das Festhalten an der Sunnah.",
    source: "Überliefert bei Ibn Baṭṭah · sinngemäß",
    topic: "Sunnah",
    used: false
  },
  {
    id: "vs-stmt-003",
    speaker: "al-Ḥasan al-Baṣrī",
    de: "Wer sein Herz mit dem Gedenken Allāhs füllt, dem wird die Welt klein.",
    source: "Āthār der Salaf · sinngemäß",
    topic: "Dhikr",
    used: false
  },
  {
    id: "vs-stmt-004",
    speaker: "Imām Mālik",
    de: "Die letzten dieser Ummah werden nur durch das gerettet, wodurch die Ersten gerettet wurden.",
    source: "Überlieferung bei ash-Shāṭibī · sinngemäß",
    topic: "Manhaj",
    used: false
  },
  {
    id: "vs-stmt-005",
    speaker: "Ibn Taymiyyah",
    de: "Geduld und Gewissheit sind der Weg zu Führung.",
    source: "Majmūʿ al-Fatāwā · sinngemäß",
    topic: "Geduld",
    used: false
  }
];

function normalizeStatement(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;
  const de = String(raw.de || raw.text || raw.statement || "").trim();
  const source = String(raw.source || raw.citation || "").trim();
  if (!de || !source) return null;
  if (/erfind|placeholder|lorem|TODO/i.test(de) || /erfind|placeholder|TODO/i.test(source)) return null;
  return {
    id: String(raw.id || `vs-stmt-${String(index + 1).padStart(3, "0")}`),
    speaker: String(raw.speaker || raw.author || "Überlieferung").trim(),
    de,
    source,
    topic: String(raw.topic || raw.category || "Wissen").trim(),
    used: Boolean(raw.used)
  };
}

export async function loadStatementBank(env, helpers = {}) {
  const path = String(env.VIDEO_STUDIO_STATEMENTS_PATH || "content/admin/video-studio-statements.json");
  try {
    if (helpers.githubGet && helpers.base64ToUtf8) {
      const owner = env.GITHUB_OWNER || "Sero91ak";
      const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
      const branch = env.GITHUB_BRANCH || "main";
      const file = await helpers.githubGet(env, owner, repo, path, branch);
      if (file?.content) {
        const data = JSON.parse(helpers.base64ToUtf8(file.content));
        const list = Array.isArray(data.statements) ? data.statements : Array.isArray(data) ? data : [];
        const statements = list.map(normalizeStatement).filter(Boolean);
        if (statements.length) return { path, statements, sha: file.sha || "" };
      }
    }
  } catch (error) {
    console.warn("video-studio statements load failed:", error?.message || error);
  }
  return { path, statements: FALLBACK_STATEMENTS.map((s) => ({ ...s })), sha: "" };
}

function matchesBrief(statement, brief) {
  const q = String(brief || "").trim().toLowerCase();
  if (!q) return true;
  const hay = `${statement.de} ${statement.speaker} ${statement.topic} ${statement.source}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).some((part) => hay.includes(part)) || hay.includes(q);
}

export async function selectStatement(env, { brief = "", usedIds = [] } = {}, helpers = {}) {
  const bank = await loadStatementBank(env, helpers);
  const used = new Set((usedIds || []).map(String));
  const unused = bank.statements.filter((s) => !used.has(s.id) && !s.used);
  const pool = unused.length ? unused : bank.statements.filter((s) => !used.has(s.id));
  const briefed = pool.filter((s) => matchesBrief(s, brief));
  const pickFrom = briefed.length ? briefed : pool;
  if (!pickFrom.length) {
    return {
      ok: false,
      reason: "Keine neue, noch nicht verwendete Aussage verfügbar."
    };
  }
  const statement = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  const verified = Boolean(statement.de && statement.source && statement.speaker);
  if (!verified) {
    return { ok: false, reason: "Aussage unvollständig – Quelle oder Sprecher fehlt." };
  }
  return {
    ok: true,
    statement: {
      ...statement,
      profile: DAR_VIDEO_PROFILE.id,
      verified: true,
      selectedAt: new Date().toISOString()
    }
  };
}
