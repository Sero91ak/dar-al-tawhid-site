/**
 * Strikte Feed-Hintergrund-Sicherheit — Natur-Fokus, keine Menschen/Tiere.
 * Serverseitig (Worker) + Spiegel in scripts/lib/feed-background-safety.cjs für Bootstrap.
 */

const FORBIDDEN_KEYWORDS = [
  "people", "person", "persons", "human", "humans", "child", "children", "kid", "kids", "baby", "babies",
  "boy", "girl", "man", "woman", "men", "women", "family", "crowd", "group of people", "selfie", "portrait",
  "face", "faces", "headshot", "model", "fashion", "wedding", "couple", "celebrity", "body", "nude", "nudity",
  "silhouette person", "silhouette people", "silhouette man", "silhouette woman",
  "animal", "animals", "wildlife", "bird", "birds", "dog", "cat", "pet", "pets", "horse", "horses", "camel",
  "camels", "lion", "tiger", "elephant", "deer", "fish", "insect", "insects", "butterfly", "bee", "macro insect",
  "zoo", "safari", "herd", "flock", "poultry", "livestock",
  "church", "cross", "crucifix", "christian", "cathedral", "statue", "sculpture", "figure", "anime", "cartoon",
  "comic", "mascot", "logo", "brand", "watermark", "shutterstock", "getty", "istock", "alamy",
  "instagram", "facebook", "pinterest", "tiktok", "snapchat", "concert", "party", "nightlife", "celebration",
  "car", "vehicle", "motorcycle", "sport player", "music festival"
];

const WHITELIST_QUERIES = [
  { query: "mountains landscape no people no animals", category: "nature", tags: ["berge", "himmel", "ruhe", "tawhid"], overlayHint: "dark", natureWeight: 10 },
  { query: "desert landscape no people no animals", category: "nature", tags: ["wüste", "sand", "aqidah"], overlayHint: "warm-dark", natureWeight: 10 },
  { query: "sand dunes no people no animals", category: "nature", tags: ["wüste", "sand", "stark"], overlayHint: "warm-dark", natureWeight: 10 },
  { query: "night sky stars no people no animals", category: "nature", tags: ["himmel", "licht", "quran"], overlayHint: "royal", natureWeight: 10 },
  { query: "clouds sunset no people no animals", category: "nature", tags: ["himmel", "wolken", "dua"], overlayHint: "warm-dark", natureWeight: 10 },
  { query: "sunrise mountains no people no animals", category: "nature", tags: ["berge", "sonnenaufgang", "licht"], overlayHint: "light", natureWeight: 10 },
  { query: "forest mist no people no animals", category: "nature", tags: ["nebel", "wald", "akhirah"], overlayHint: "dark", natureWeight: 10 },
  { query: "calm ocean no people no animals", category: "nature", tags: ["wasser", "ruhe", "dua"], overlayHint: "royal", natureWeight: 10 },
  { query: "water landscape no people no animals", category: "nature", tags: ["wasser", "ruhe", "tazkiyah"], overlayHint: "royal", natureWeight: 10 },
  { query: "river landscape no people no animals", category: "nature", tags: ["fluss", "wasser", "ruhe"], overlayHint: "dark", natureWeight: 10 },
  { query: "empty desert no people no animals", category: "nature", tags: ["wüste", "leer", "tawhid"], overlayHint: "warm-dark", natureWeight: 10 },
  { query: "moon sky no people no animals", category: "nature", tags: ["mond", "himmel", "akhirah"], overlayHint: "royal", natureWeight: 10 },
  { query: "clouds sky no people no animals", category: "nature", tags: ["wolken", "himmel", "dua"], overlayHint: "light", natureWeight: 10 },
  { query: "foggy mountains no people no animals", category: "nature", tags: ["nebel", "berge", "zuhd"], overlayHint: "dark", natureWeight: 10 },
  { query: "rock landscape no people no animals", category: "nature", tags: ["felsen", "berge", "stark"], overlayHint: "dark", natureWeight: 10 },
  { query: "tree leaves no animals no people", category: "nature", tags: ["bäume", "blätter", "ruhe"], overlayHint: "dark", natureWeight: 9 },
  { query: "plants nature no animals no people", category: "nature", tags: ["pflanzen", "ruhe", "dua"], overlayHint: "light", natureWeight: 9 },
  { query: "flowers no insects no people no animals", category: "nature", tags: ["blumen", "ruhe", "dua"], overlayHint: "light", natureWeight: 8 },
  { query: "rain clouds no people no animals", category: "nature", tags: ["regen", "wolken", "dua"], overlayHint: "royal", natureWeight: 9 },
  { query: "waves ocean no people no animals", category: "nature", tags: ["wellen", "meer", "ruhe"], overlayHint: "royal", natureWeight: 9 },
  { query: "empty mosque interior no people", category: "mosque", tags: ["moschee", "muster", "tawhid"], overlayHint: "dark", natureWeight: 3 },
  { query: "mosque architecture no people", category: "mosque", tags: ["moschee", "kuppel", "tawhid"], overlayHint: "royal", natureWeight: 3 },
  { query: "minaret silhouette no people", category: "mosque", tags: ["minarett", "himmel", "tawhid"], overlayHint: "royal", natureWeight: 3 },
  { query: "mihrab architecture no people", category: "mosque", tags: ["moschee", "muster", "quran"], overlayHint: "dark", natureWeight: 3 },
  { query: "islamic geometric pattern", category: "abstract", tags: ["muster", "kalligraphie", "quran"], overlayHint: "dark", natureWeight: 2 },
  { query: "arabesque pattern", category: "abstract", tags: ["muster", "tawhid", "ilm"], overlayHint: "dark", natureWeight: 2 },
  { query: "paper texture", category: "books", tags: ["pergament", "bücher", "ilm"], overlayHint: "light", natureWeight: 2 },
  { query: "parchment texture", category: "books", tags: ["pergament", "ilm", "adab"], overlayHint: "light", natureWeight: 2 },
  { query: "old books", category: "books", tags: ["bücher", "ilm", "hadith"], overlayHint: "warm-dark", natureWeight: 2 },
  { query: "ink pen paper", category: "books", tags: ["tinte", "feder", "ilm"], overlayHint: "warm-dark", natureWeight: 2 },
  { query: "dark abstract background", category: "abstract", tags: ["ruhe", "tawhid", "aqidah"], overlayHint: "dark", natureWeight: 2 },
  { query: "gold texture background", category: "abstract", tags: ["gold", "tawhid", "licht"], overlayHint: "warm-dark", natureWeight: 2 }
];

const DEFAULT_SETTINGS = {
  autoDownloadEnabled: true,
  strictIslamicMode: true,
  strictSafetyMode: true,
  natureFocus: true,
  blockHumans: true,
  blockFaces: true,
  blockBodyParts: true,
  blockNudity: true,
  blockAnimals: true,
  blockBirds: true,
  blockWildlife: true,
  blockPets: true,
  blockInsects: true,
  blockFish: true,
  blockWatermarks: true,
  blockLogos: true,
  blockTextOverlays: true,
  blockCrosses: true,
  blockChurches: true,
  fallbackToGradient: true,
  minPoolSize: 80,
  refillBelow: 40,
  dailyDownloadLimit: 20,
  allowedSources: ["pexels", "unsplash", "pixabay"]
};

/** Felder die im Feed explizit false sein müssen (Unsicherheit = blockieren). */
const STRICT_BOOL_FIELDS = [
  "containsHumans",
  "containsFaces",
  "containsBodyParts",
  "containsNudity",
  "containsAnimals",
  "containsBirds",
  "containsWildlife",
  "containsPets",
  "containsInsects",
  "containsFish",
  "containsWatermark",
  "containsLogo",
  "containsTextOverlay",
  "containsCross",
  "containsChurch",
  "isLowQuality",
  "isBlurred",
  "isTooBusy"
];

const HUMAN_RE = /\b(people|person|persons|human|humans|child|children|kid|kids|baby|boy|girl|man\b|woman\b|men\b|women\b|family|crowd|selfie|portrait|face|faces|headshot|model|wedding|couple|celebrity)\b/i;
const SILHOUETTE_HUMAN_RE = /\b(silhouette person|silhouette people|silhouette man|silhouette woman|people silhouette|person silhouette)\b/i;
const FACE_RE = /\b(face|faces|portrait|headshot|selfie)\b/i;
const BODY_RE = /\b(body|nude|nudity|torso|bikini|underwear)\b/i;
const NUDITY_RE = /\b(nude|nudity|naked|topless|bikini|underwear)\b/i;
const ANIMAL_RE = /\b(animal|animals|wildlife|zoo|safari|herd|livestock|mammal|pet\b|pets\b)\b/i;
const BIRD_RE = /\b(bird|birds|flock|eagle|owl|pigeon|seagull|parrot)\b/i;
const WILDLIFE_RE = /\b(wildlife|safari|zoo|lion|tiger|elephant|deer|bear|wolf|fox)\b/i;
const PET_RE = /\b(dog|cat|puppy|kitten|pet\b|pets\b|horse|horses|camel|camels)\b/i;
const INSECT_RE = /\b(insect|insects|butterfly|bee|wasp|dragonfly|macro insect|spider)\b/i;
const FISH_RE = /\b(fish|fishes|aquarium|underwater fish|koi|coral fish)\b/i;
const WATERMARK_RE = /\b(watermark|shutterstock|getty|istock|alamy|stock photo watermark)\b/i;
const LOGO_RE = /\b(logo|brand mark|trademark|company logo)\b/i;
const TEXT_RE = /\b(text overlay|typography|quote poster|signage|banner text|headline|lettering)\b/i;
const CROSS_RE = /\b(cross|crucifix)\b/i;
const CHURCH_RE = /\b(church|cathedral|chapel|christian)\b/i;

function mergeSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    strictIslamicMode: s.strictIslamicMode !== false,
    strictSafetyMode: s.strictSafetyMode !== false,
    natureFocus: s.natureFocus !== false,
    allowedSources: Array.isArray(s.allowedSources) && s.allowedSources.length
      ? s.allowedSources.map((x) => String(x).toLowerCase()).filter((x) => x !== "wikimedia")
      : DEFAULT_SETTINGS.allowedSources
  };
}

function buildHaystack(candidate, opts) {
  const includeQuery = opts && opts.includeQuery;
  const parts = [
    candidate?.alt,
    candidate?.description,
    ...(includeQuery ? [candidate?.query] : []),
    ...(candidate?.tags || []),
    ...(candidate?.categories || [])
  ];
  return parts
    .flat()
    .filter(Boolean)
    .map((x) => String(x).toLowerCase())
    .join(" ");
}

function containsForbiddenKeyword(text) {
  const hay = String(text || "").toLowerCase();
  for (let i = 0; i < FORBIDDEN_KEYWORDS.length; i++) {
    const kw = FORBIDDEN_KEYWORDS[i];
    if (hay.includes(kw)) return kw;
  }
  return "";
}

function deriveSafetyFlags(hay) {
  return {
    containsHumans: HUMAN_RE.test(hay) || SILHOUETTE_HUMAN_RE.test(hay),
    containsFaces: FACE_RE.test(hay),
    containsBodyParts: BODY_RE.test(hay),
    containsNudity: NUDITY_RE.test(hay),
    containsAnimals: ANIMAL_RE.test(hay),
    containsBirds: BIRD_RE.test(hay),
    containsWildlife: WILDLIFE_RE.test(hay),
    containsPets: PET_RE.test(hay),
    containsInsects: INSECT_RE.test(hay),
    containsFish: FISH_RE.test(hay),
    containsWatermark: WATERMARK_RE.test(hay),
    containsLogo: LOGO_RE.test(hay),
    containsTextOverlay: TEXT_RE.test(hay),
    containsCross: CROSS_RE.test(hay),
    containsChurch: CHURCH_RE.test(hay),
    isLowQuality: false,
    isBlurred: /\b(blur|blurry|out of focus|soft focus)\b/i.test(hay),
    isTooBusy: /\b(crowded|busy street|market|festival|nightlife)\b/i.test(hay)
  };
}

function validateCandidate(candidate, settings) {
  const merged = mergeSettings(settings);
  const reasons = [];
  const hay = buildHaystack(candidate);
  const flags = deriveSafetyFlags(hay);

  const forbidden = containsForbiddenKeyword(hay);
  if (forbidden) reasons.push(`forbidden-keyword:${forbidden}`);

  if (merged.blockHumans !== false && flags.containsHumans) reasons.push("possible-humans");
  if (merged.blockFaces !== false && flags.containsFaces) reasons.push("possible-faces");
  if (merged.blockBodyParts !== false && flags.containsBodyParts) reasons.push("possible-body-parts");
  if (merged.blockNudity !== false && flags.containsNudity) reasons.push("possible-nudity");
  if (merged.blockAnimals !== false && flags.containsAnimals) reasons.push("possible-animals");
  if (merged.blockBirds !== false && flags.containsBirds) reasons.push("possible-birds");
  if (merged.blockWildlife !== false && flags.containsWildlife) reasons.push("possible-wildlife");
  if (merged.blockPets !== false && flags.containsPets) reasons.push("possible-pets");
  if (merged.blockInsects !== false && flags.containsInsects) reasons.push("possible-insects");
  if (merged.blockFish !== false && flags.containsFish) reasons.push("possible-fish");
  if (merged.blockWatermarks !== false && flags.containsWatermark) reasons.push("possible-watermark");
  if (merged.blockLogos !== false && flags.containsLogo) reasons.push("possible-logo");
  if (merged.blockTextOverlays !== false && flags.containsTextOverlay) reasons.push("possible-text-overlay");
  if (merged.blockCrosses !== false && flags.containsCross) reasons.push("possible-cross");
  if (merged.blockChurches !== false && flags.containsChurch) reasons.push("possible-church");
  if (flags.isBlurred) reasons.push("possible-blur");
  if (flags.isTooBusy) reasons.push("possible-too-busy");

  const w = Number(candidate?.width) || 0;
  const h = Number(candidate?.height) || 0;
  if (w > 0 && h > 0) {
    if (w < 1200 || h < 1500) {
      reasons.push("resolution-too-low");
      flags.isLowQuality = true;
    }
    const ratio = w / h;
    if (ratio < 0.45 || ratio > 2.4) reasons.push("aspect-unusual");
  } else if (merged.strictSafetyMode !== false) {
    reasons.push("dimensions-unknown");
    flags.isLowQuality = true;
  }

  const strict = merged.strictIslamicMode !== false || merged.strictSafetyMode !== false;
  const hasRisk = STRICT_BOOL_FIELDS.some((f) => flags[f] === true);
  const uncertain = reasons.some((r) => r.startsWith("possible-") || r === "dimensions-unknown");

  if (strict && (hasRisk || forbidden || uncertain)) {
    return { ok: false, reasons, uncertain: true, flags };
  }
  if (forbidden || hasRisk) {
    return { ok: false, reasons, uncertain: false, flags };
  }
  return { ok: true, reasons: [], uncertain: false, flags };
}

function isStrictFeedBgSafe(item, settings) {
  if (!item || !item.src) return false;
  if (item.status !== "active" || item.active === false) return false;
  if (!item.approved || item.securityStatus !== "approved") return false;
  if (item.isIslamicallySafe === false) return false;

  const merged = mergeSettings(settings);
  const allowed = Array.isArray(item.allowedFor)
    ? item.allowedFor
    : String(item.allowedFor || "feed").split(/[,;|]+/);
  if (!allowed.map((x) => String(x).toLowerCase()).includes("feed")) return false;

  const src = String(item.source || "").toLowerCase();
  if (src === "wikimedia") return false;

  for (let i = 0; i < STRICT_BOOL_FIELDS.length; i++) {
    const field = STRICT_BOOL_FIELDS[i];
    if (item[field] !== false) return false;
  }

  if (merged.natureFocus && item.category === "nature") return true;
  if (item.studioGenerated || item.source === "studio") return true;
  if (["mosque", "books", "abstract"].includes(item.category)) return true;
  return item.category === "nature";
}

function sortQueriesNatureFirst(queries) {
  return [...queries].sort((a, b) => (Number(b.natureWeight) || 0) - (Number(a.natureWeight) || 0));
}

module.exports={FORBIDDEN_KEYWORDS,WHITELIST_QUERIES,DEFAULT_SETTINGS,STRICT_BOOL_FIELDS,mergeSettings,buildHaystack,containsForbiddenKeyword,deriveSafetyFlags,validateCandidate,isStrictFeedBgSafe,sortQueriesNatureFirst};
