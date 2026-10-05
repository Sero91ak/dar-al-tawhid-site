/**
 * Medienablage für Content Studio.
 * Staging: versionierte statische Test-Assets im Repo.
 * Live: eigene öffentliche assets/kids-content Struktur.
 * Große Produktions-WAVs werden nicht erwartet; Studio lädt für Audio kompaktes M4A/AAC hoch.
 */
const MAX_COVER_BYTES = 12 * 1024 * 1024;
const MAX_AUDIO_BYTES = 32 * 1024 * 1024;

function clean(v, max = 500) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

function safeId(v) {
  return clean(v, 90)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw mediaError("Ungültige Mediendatei", 422);
  const mime = clean(match[1], 120).toLowerCase();
  const base64 = match[2].replace(/\s+/g, "");
  let bytes;
  try {
    bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch {
    throw mediaError("Base64-Mediendaten ungültig", 422);
  }
  return { mime, base64, bytes };
}

function extFor(mime, role) {
  const m = String(mime || "").toLowerCase();
  if (role === "cover") {
    if (m.includes("png")) return "png";
    if (m.includes("webp")) return "webp";
    if (m.includes("avif")) return "avif";
    return "jpg";
  }
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("aac")) return "aac";
  if (m.includes("mpeg")) return "mp3";
  if (m.includes("wav")) return "wav";
  return "m4a";
}

async function sha256Hex(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function validateMime(role, mime) {
  const m = String(mime || "").toLowerCase();
  if (role === "cover") {
    if (!/^image\/(png|jpeg|jpg|webp|avif)$/.test(m)) throw mediaError("Cover-Format nicht erlaubt", 415);
    return;
  }
  if (role === "audio") {
    if (!/^audio\/(mp4|m4a|aac|mpeg|mp3|wav|x-wav)$/.test(m)) throw mediaError("Audio-Format nicht erlaubt", 415);
    return;
  }
  throw mediaError("Medienrolle muss cover oder audio sein", 422);
}

export async function persistKidsContentMedia(env, input, helpers) {
  const id = safeId(input?.id);
  const role = clean(input?.role, 20).toLowerCase();
  const staging = input?.staging !== false;
  if (!id) throw mediaError("Content-ID fehlt", 400);
  if (!["cover", "audio"].includes(role)) throw mediaError("Unbekannte Medienrolle", 422);

  let payload;
  if (input?.dataUrl) {
    payload = decodeDataUrl(input.dataUrl);
  } else if (input?.remoteUrl) {
    const remote = clean(input.remoteUrl, 1800);
    if (!/^https:\/\//i.test(remote)) throw mediaError("Nur HTTPS-Remote-URLs sind erlaubt", 422);
    const response = await fetch(remote, { redirect: "follow" });
    if (!response.ok) throw mediaError(`Remote-Medium nicht erreichbar (${response.status})`, 502);
    const bytes = new Uint8Array(await response.arrayBuffer());
    payload = {
      mime: clean(response.headers.get("content-type") || (role === "cover" ? "image/jpeg" : "audio/mp4"), 120).split(";")[0].toLowerCase(),
      bytes,
      base64: bytesToBase64(bytes)
    };
  } else {
    throw mediaError("Mediendaten fehlen", 400);
  }

  validateMime(role, payload.mime);
  const max = role === "cover" ? MAX_COVER_BYTES : MAX_AUDIO_BYTES;
  if (payload.bytes.byteLength > max) {
    throw mediaError(`${role === "cover" ? "Cover" : "Audio"} zu groß (max. ${Math.round(max / 1024 / 1024)} MB)`, 413);
  }
  if (payload.bytes.byteLength < 128) throw mediaError("Mediendatei ist leer oder beschädigt", 422);

  const sha256 = await sha256Hex(payload.bytes);
  const ext = extFor(payload.mime, role);
  const short = sha256.slice(0, 14);
  const root = staging ? "kids/media/studio" : "assets/kids-content";
  const path = `${root}/${id}/${role}-${short}.${ext}`;

  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const batch = await helpers.githubCommitBatch(
    env,
    owner,
    repo,
    branch,
    [{ path, binary: true, contentBase64: payload.base64 }],
    `Kids Studio ${staging ? "staging " : ""}${role} ${id} ${short}`
  );

  return {
    ok: true,
    id,
    role,
    staging,
    asset: {
      url: "/" + path,
      key: path,
      mime: payload.mime,
      bytes: payload.bytes.byteLength,
      sha256,
      source: input?.source ? clean(input.source, 80) : "studio-upload",
      type: role,
      originalName: clean(input?.originalName, 160)
    },
    commitSha: batch?.commitSha || ""
  };
}

export async function promoteKidsContentMedia(env, item, helpers) {
  if (!item) throw mediaError("Content-Paket fehlt", 400);
  const id = safeId(item.id);
  const entries = [];
  const replacements = {};

  for (const role of ["cover", "audio"]) {
    const asset = item?.[role];
    const key = clean(asset?.key, 800).replace(/^\/+/, "");
    if (!key) continue;
    if (!key.startsWith("kids/media/studio/")) {
      replacements[role] = asset;
      continue;
    }

    const owner = env.GITHUB_OWNER || "Sero91ak";
    const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
    const branch = env.GITHUB_BRANCH || "main";
    const file = await helpers.githubGet(env, owner, repo, key, branch);
    const b64 = String(file?.content || "").replace(/\s+/g, "");
    if (!b64) throw mediaError(`Staging-${role} fehlt: ${key}`, 404);

    const ext = key.split(".").pop() || extFor(asset?.mime, role);
    const livePath = `assets/kids-content/${id}/${role}-${clean(asset?.sha256, 100).slice(0, 14) || Date.now().toString(36)}.${ext}`;
    entries.push({ path: livePath, binary: true, contentBase64: b64 });
    replacements[role] = { ...asset, key: livePath, url: "/" + livePath, source: "studio-promoted" };
  }

  if (entries.length) {
    await helpers.githubCommitBatch(
      env,
      env.GITHUB_OWNER || "Sero91ak",
      env.GITHUB_REPO || "dar-al-tawhid-site",
      env.GITHUB_BRANCH || "main",
      entries,
      `Promote Kids Studio media ${id}`
    );
  }

  return { ok: true, cover: replacements.cover || item.cover, audio: replacements.audio || item.audio };
}

function bytesToBase64(bytes) {
  let out = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    out += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(out);
}

function mediaError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}


const KIDS_ALPHABET_AUDIO_PATH = "kids/data/alphabet-audio.json";
const KIDS_ALPHABET_IDS = new Set([
  "alif","ba","ta","tha","jim","ha","kha","dal","dhal","ra","zay","sin","shin","sad",
  "dad","taa","zaa","ayn","ghayn","fa","qaf","kaf","lam","mim","nun","haa","waw","ya"
]);

function alphabetAudioSlot(manifest, letterId, kind, key = "") {
  const letter = manifest?.letters?.[letterId];
  if (!letter) return null;
  if (kind === "harakat") {
    if (!["fatha","kasra","damma"].includes(key)) return null;
    return letter?.harakat?.[key] || null;
  }
  if (!["name","word"].includes(kind)) return null;
  return letter?.[kind] || null;
}

export async function readKidsAlphabetAudioManifest(env, helpers) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const file = await helpers.githubGet(env, owner, repo, KIDS_ALPHABET_AUDIO_PATH, branch);
  if (!file?.content) throw mediaError("Alif-Bāʾ-Audio-Manifest fehlt", 404);
  let manifest;
  try {
    manifest = JSON.parse(helpers.base64ToUtf8(file.content));
  } catch {
    throw mediaError("Alif-Bāʾ-Audio-Manifest ist ungültig", 500);
  }
  return { manifest, sha: file.sha || "", path: KIDS_ALPHABET_AUDIO_PATH };
}

export async function verifyKidsAlphabetAudioSlot(env, input, helpers) {
  const letterId = safeId(input?.letterId);
  const kind = clean(input?.kind, 30).toLowerCase();
  const key = clean(input?.key, 30).toLowerCase();
  const text = clean(input?.text, 200);
  if (!KIDS_ALPHABET_IDS.has(letterId)) throw mediaError("Unbekannter Alif-Bāʾ-Buchstabe", 422);
  if (!["name","word","harakat"].includes(kind)) throw mediaError("Unbekannter Audio-Slot", 422);
  if (kind === "harakat" && !["fatha","kasra","damma"].includes(key)) throw mediaError("Unbekannte Ḥaraka", 422);

  const asset = input?.asset && typeof input.asset === "object" ? input.asset : {};
  const assetKey = clean(asset.key, 800).replace(/^\/+/, "");
  const assetUrl = clean(asset.url, 1200);
  const sha256 = clean(asset.sha256, 100).toLowerCase();
  const mime = clean(asset.mime, 100).toLowerCase();
  if (!assetKey || !assetKey.startsWith("kids/media/studio/alphabet-")) {
    throw mediaError("Audio stammt nicht aus dem freigegebenen Alif-Bāʾ-Stagingpfad", 422);
  }
  if (!/^audio\//.test(mime)) throw mediaError("Slot-Datei ist kein Audio", 415);
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw mediaError("Audio-Prüfsumme fehlt oder ist ungültig", 422);

  const state = await readKidsAlphabetAudioManifest(env, helpers);
  const slot = alphabetAudioSlot(state.manifest, letterId, kind, key);
  if (!slot) throw mediaError("Audio-Slot existiert nicht", 404);
  if (!text || text !== clean(slot.text, 200)) {
    throw mediaError("Arabischer Slot-Text stimmt nicht exakt mit dem Manifest überein", 422);
  }

  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const uploaded = await helpers.githubGet(env, owner, repo, assetKey, branch);
  if (!uploaded?.content) throw mediaError("Hochgeladene Audiodatei wurde im Repository nicht gefunden", 404);

  const verifiedUrl = assetUrl && assetUrl.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "/");
  slot.verified = true;
  slot.url = verifiedUrl || ("/" + assetKey);
  slot.sha256 = sha256;
  slot.qaBy = "owner-confirmed-voice-studio";
  slot.qaAt = new Date().toISOString();
  slot.sourceVoice = "authorized-owner-voice";
  slot.source = "serhat-voice-studio-human-approved";
  slot.sourceType = "owner-voice-generated-human-approved";
  slot.sourceProvider = "DĀR Voice Studio";
  slot.sourceSpeaker = "Serhat Abu Malik";
  slot.sourceLanguage = "Arabic";
  slot.voiceProfileId = "serhat-owner-voice-2026";
  slot.sameVoiceConfirmed = true;
  slot.canonicalVoice = letterId === "alif" && kind === "name";
  slot.verificationBasis = "Locally generated with the authorized Serhat voice in DĀR Voice Studio; owner listened to the complete candidate and explicitly approved pronunciation and voice before publication.";
  delete slot.sourcePage;
  delete slot.sourceFile;
  delete slot.license;
  delete slot.licenseUrl;
  delete slot.attribution;

  state.manifest.updatedAt = new Date().toISOString().slice(0, 10);
  const saved = await helpers.githubPut(
    env,
    owner,
    repo,
    state.path,
    JSON.stringify(state.manifest, null, 2) + "\n",
    `Verify Kids alphabet audio ${letterId} ${kind}${key ? ":" + key : ""}`,
    branch,
    state.sha
  );

  return {
    ok: true,
    letterId,
    kind,
    key,
    slot,
    commitSha: saved?.commit?.sha || ""
  };
}


export async function verifyKidsAlphabetExternalAudioSlot(env, input, helpers) {
  const letterId = safeId(input?.letterId);
  const kind = clean(input?.kind, 30).toLowerCase();
  const key = clean(input?.key, 30).toLowerCase();
  const text = clean(input?.text, 200);
  const sourceFile = clean(input?.sourceFile, 500);

  if (!KIDS_ALPHABET_IDS.has(letterId)) throw mediaError("Unbekannter Alif-Bāʾ-Buchstabe", 422);
  if (!["name","word","harakat"].includes(kind)) throw mediaError("Unbekannter Audio-Slot", 422);
  if (kind === "harakat" && !["fatha","kasra","damma"].includes(key)) throw mediaError("Unbekannte Ḥaraka", 422);
  if (!sourceFile) throw mediaError("Externe Quelldatei fehlt", 422);

  const state = await readKidsAlphabetAudioManifest(env, helpers);
  const slot = alphabetAudioSlot(state.manifest, letterId, kind, key);
  if (!slot) throw mediaError("Audio-Slot existiert nicht", 404);
  if (!text || text !== clean(slot.text, 200)) {
    throw mediaError("Arabischer Slot-Text stimmt nicht exakt mit dem Manifest überein", 422);
  }

  const candidates = Array.isArray(slot.alternateSources) ? slot.alternateSources : [];
  const candidate = candidates.find((item) => clean(item?.sourceFile, 500) === sourceFile);
  if (!candidate) throw mediaError("Externe Kandidatenquelle ist im Manifest nicht hinterlegt", 404);

  const provider = clean(candidate.sourceProvider, 500);
  const speaker = clean(candidate.sourceSpeaker, 200);
  const sourceType = clean(candidate.sourceType, 100);
  const license = clean(candidate.license, 100);
  const sourcePage = clean(candidate.sourcePage, 1200);
  const url = clean(candidate.url, 1200);
  const canonicalVoiceId = clean(state.manifest?.policy?.canonicalVoiceId, 200);

  const sameSeries =
    provider === "Wikimedia Commons / Escuela Internacional de Árabe" &&
    speaker === "Eiarabe" &&
    sourceType === "external-human-pronunciation" &&
    license === "CC-BY-4.0" &&
    /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(sourcePage) &&
    /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\//i.test(url) &&
    /por la Escuela Internacional de Árabe\.ogg$/i.test(sourceFile);

  if (!sameSeries || !canonicalVoiceId) {
    throw mediaError("Quelle gehört nicht zur freigegebenen Eiarabe-Alif-Serie", 422);
  }

  [
    "url","sourceType","sourceUsageMode","sourceProvider","sourceSpeaker","sourceLanguage",
    "sourceTranscription","sourcePage","sourceFile","license","licenseUrl","attribution"
  ].forEach((field) => {
    if (candidate[field] !== undefined && candidate[field] !== null && candidate[field] !== "") {
      slot[field] = candidate[field];
    }
  });

  slot.verified = true;
  slot.sha256 = "";
  slot.qaBy = "owner-confirmed-external-canonical-voice";
  slot.qaAt = new Date().toISOString();
  slot.voiceProfileId = canonicalVoiceId;
  slot.canonicalVoice = false;
  slot.sameVoiceConfirmed = true;
  slot.verificationBasis =
    "Owner listened to the complete external candidate and explicitly confirmed that it matches the canonical Eiarabe Alif reference voice. Original Wikimedia provenance and CC BY 4.0 attribution retained.";

  state.manifest.updatedAt = new Date().toISOString().slice(0, 10);
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const saved = await helpers.githubPut(
    env,
    owner,
    repo,
    state.path,
    JSON.stringify(state.manifest, null, 2) + "\n",
    `Verify external Kids alphabet audio ${letterId} ${kind}${key ? ":" + key : ""}`,
    branch,
    state.sha
  );

  return {
    ok: true,
    letterId,
    kind,
    key,
    slot,
    commitSha: saved?.commit?.sha || ""
  };
}


function normalizeExistingStoryAge(value) {
  const raw = clean(value, 20).replace(/[–—]/g, "-");
  return ["4-5","6-8","9-10","all"].includes(raw) ? raw : "";
}

function normalizeExistingStoryText(value) {
  return String(value == null ? "" : value)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

function sanitizeStoryTimings(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const raw of value.slice(0, 500)) {
    const start = Number(raw?.start);
    const end = Number(raw?.end);
    const paragraphIndex = Math.max(0, Math.round(Number(raw?.paragraphIndex ?? out.length)));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start < 0) continue;
    out.push({
      paragraphIndex,
      start: Number(start.toFixed(3)),
      end: Number(end.toFixed(3))
    });
  }
  return out;
}

export async function publishExistingKidsStoryAudio(env, input, helpers) {
  const storyKind = clean(input?.storyKind || input?.kind, 30).toLowerCase();
  if (!["prophet","mubashshirun","sahabiyyat"].includes(storyKind)) {
    throw mediaError("Geschichten-Typ muss prophet, mubashshirun oder sahabiyyat sein", 422);
  }
  const itemId = safeId(input?.itemId || input?.id);
  const age = normalizeExistingStoryAge(input?.age);
  const submittedText = normalizeExistingStoryText(input?.text);
  if (!itemId) throw mediaError("Geschichten-ID fehlt", 400);
  if (!age) throw mediaError("Alter muss 4-5, 6-8, 9-10 oder all sein", 422);
  if (submittedText.length < 40) throw mediaError("Erzähltext ist zu kurz", 422);

  const manifestPath = storyKind === "prophet"
    ? "kids/data/prophet-stories.json"
    : storyKind === "sahabiyyat"
      ? "kids/data/sahabiyyat-stories.json"
      : "kids/data/mubashshirun-stories.json";
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const manifestFile = await helpers.githubGet(env, owner, repo, manifestPath, branch);
  if (!manifestFile?.content) throw mediaError("Kids-Geschichtenmanifest fehlt", 404);

  let manifest;
  try {
    manifest = JSON.parse(helpers.base64ToUtf8(manifestFile.content));
  } catch {
    throw mediaError("Kids-Geschichtenmanifest ist ungültig", 500);
  }
  const items = Array.isArray(manifest?.items) ? manifest.items : [];
  const item = items.find((row) => safeId(row?.id) === itemId);
  if (!item) throw mediaError("Kids-Geschichte wurde nicht gefunden", 404);

  const scripts = item?.scripts && typeof item.scripts === "object" ? { ...item.scripts } : {};
  const targetAges = age === "all" ? ["4-5","6-8","9-10"] : [age];
  const expectedTexts = targetAges.map((key) => normalizeExistingStoryText(scripts[key] || item?.voiceScript || ""));
  if (expectedTexts.some((value) => !value)) {
    throw mediaError("Für mindestens eine Altersstufe ist noch kein freigegebener Mastertext hinterlegt", 422);
  }
  if (age === "all" && new Set(expectedTexts).size !== 1) {
    throw mediaError("Die Altersstufen enthalten unterschiedliche Storytexte. Zuerst auf einen Mastertext vereinheitlichen.", 409);
  }
  const expectedText = expectedTexts[0];
  if (submittedText !== expectedText) {
    throw mediaError("Der hochgeladene Ton gehört nicht exakt zum hinterlegten Mastertext", 409);
  }

  const payload = decodeDataUrl(input?.dataUrl);
  validateMime("audio", payload.mime);
  if (payload.bytes.byteLength > MAX_AUDIO_BYTES) {
    throw mediaError("Audio zu groß (max. " + Math.round(MAX_AUDIO_BYTES / 1024 / 1024) + " MB)", 413);
  }
  if (payload.bytes.byteLength < 1024) throw mediaError("Audiodatei ist leer oder beschädigt", 422);

  const durationSec = Number(input?.durationSec || 0);
  if (!Number.isFinite(durationSec) || durationSec < 3) {
    throw mediaError("Audiodauer fehlt oder ist zu kurz", 422);
  }
  const sha256 = await sha256Hex(payload.bytes);
  const ext = extFor(payload.mime, "audio");
  const short = sha256.slice(0, 14);
  const assetRoot = storyKind === "prophet"
    ? "kids/assets/prophet-story-audio"
    : storyKind === "sahabiyyat"
      ? "kids/assets/sahabiyyat-story-audio"
      : "kids/assets/mubashshirun-story-audio";
  const assetSlot = age === "all" ? "master" : age;
  const assetPath = assetRoot + "/" + itemId + "/" + assetSlot + "-" + short + "." + ext;
  const now = new Date().toISOString();
  const timings = sanitizeStoryTimings(input?.timings);
  const syncMode = clean(input?.syncMode || (timings.length ? "browser-owner-alignment-v1" : ""), 120);

  const audio = item?.audio && typeof item.audio === "object" ? { ...item.audio } : {};
  const baseAudio = {
    status: "ready",
    url: "/" + assetPath,
    durationSec: Number(durationSec.toFixed(3)),
    bytes: payload.bytes.byteLength,
    sha256,
    mime: payload.mime,
    voiceProfile: "kids_story",
    voiceProfileId: "serhat-owner-voice-2026",
    source: "DĀR Voice Studio direct owner-audio upload",
    sourceSpeaker: "Serhat Abu Malik",
    sourceFile: clean(input?.originalName, 180),
    manual: true,
    manualUpload: true,
    ownerApproved: true,
    modes: ["read","listen"],
    technicalQaPassed: true,
    publishedAt: now,
    masterAudio: age === "all",
    masterAgeRange: age === "all" ? "4-10" : "",
    ...(timings.length ? { timings, syncMode } : {})
  };
  for (const targetAge of targetAges) {
    scripts[targetAge] = expectedText;
    audio[targetAge] = { ...baseAudio, age: targetAge };
  }
  item.scripts = scripts;
  item.audio = audio;
  const publishedAges = ["4-5","6-8","9-10"].filter((key) => String(audio?.[key]?.url || "").trim());
  item.voiceProduction = {
    ...(item.voiceProduction && typeof item.voiceProduction === "object" ? item.voiceProduction : {}),
    publishedAges,
    status: publishedAges.length === 3 ? "audio-complete" : "audio-partial",
    lastPublishedAt: now,
    singleMasterAudio: age === "all" || item?.voiceProduction?.singleMasterAudio === true,
    ...(age === "all" ? { masterAudioUrl: "/" + assetPath, masterAgeRange: "4-10" } : {})
  };
  manifest.updatedAt = now;

  const batch = await helpers.githubCommitBatch(
    env,
    owner,
    repo,
    branch,
    [
      { path: assetPath, binary: true, contentBase64: payload.base64 },
      { path: manifestPath, content: JSON.stringify(manifest, null, 2) + "\n" }
    ],
    "Kids: " + (storyKind === "prophet" ? "Prophetengeschichte" : storyKind === "sahabiyyat" ? "Ṣaḥābiyyāt-Geschichte" : "Ṣaḥābah-Geschichte") +
      " " + itemId + " · " + age + " · Owner Audio"
  );

  return {
    ok: true,
    storyKind,
    itemId,
    age,
    title: clean(item?.title || item?.name || itemId, 220),
    asset: {
      url: "/" + assetPath,
      key: assetPath,
      mime: payload.mime,
      bytes: payload.bytes.byteLength,
      sha256,
      source: "manual-owner-upload",
      ownerApproved: true,
      type: "audio",
      originalName: clean(input?.originalName, 180),
      durationSec: Number(durationSec.toFixed(3)),
      timings,
      syncMode
    },
    commitSha: batch?.commitSha || ""
  };
}

export const KIDS_CONTENT_MEDIA_LIMITS = Object.freeze({
  coverBytes: MAX_COVER_BYTES,
  audioBytes: MAX_AUDIO_BYTES
});
