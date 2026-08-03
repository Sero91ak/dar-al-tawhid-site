/**
 * Verbindliche DAR-Darstellungsregeln für Video-Ausgangsbilder und Bewegungsclips.
 */

const PROPHET_MARKERS = [
  "prophet", "nabī", "nabi", "rasūl", "rasul", "rasool", "ﷺ",
  "gesandter", "bote allāh", "bote allah"
];

const PROPHET_NAMES = [
  "muḥammad", "muhammad", "mohammed",
  "ibrāhīm", "ibrahim", "abraham",
  "nūḥ", "nuh", "noah",
  "mūsā", "musa", "moses",
  "ʿīsā", "isa ibn", "jesus",
  "ādam", "adam",
  "yūnus", "yunus", "jonas",
  "sulaymān", "sulayman", "salomon",
  "dāwūd", "dawud", "david",
  "yaʿqūb", "yaqub", "jacob",
  "yūsuf", "yusuf", "joseph",
  "ayyūb", "ayyub",
  "zakariyyā", "zakariyya",
  "yaḥyā", "yahya",
  "idrīs", "idris",
  "hūd", "hud",
  "ṣāliḥ", "salih",
  "shuʿayb", "shuayb",
  "lūṭ", "lut",
  "ilyās", "ilyas",
  "al-yasa", "dhul-kifl", "dhū l-kifl"
];

export function statementHaystack(statement = {}) {
  return `${statement.speaker || ""} ${statement.de || ""} ${statement.topic || ""} ${statement.source || ""}`
    .toLowerCase()
    .normalize("NFKD");
}

/** Beitrag betrifft einen Propheten – dann keinerlei körperliche Prophetendarstellung. */
export function isProphetRelatedStatement(statement) {
  const hay = statementHaystack(statement);
  if (PROPHET_MARKERS.some((m) => hay.includes(m))) return true;
  // Name allein reicht, wenn Sprecher/Thema klar prophetisch benannt ist
  if (PROPHET_NAMES.some((n) => hay.includes(n)) && /(prophet|nab|rasūl|rasul|ﷺ|gesandt)/i.test(hay)) {
    return true;
  }
  // Sprecherzeile „Der Prophet …“ / „Prophet Nūḥ“
  if (/^\s*(der\s+)?prophet\b/i.test(String(statement.speaker || ""))) return true;
  return false;
}

export function depictionPromptBlock(statement) {
  const prophet = isProphetRelatedStatement(statement);
  if (prophet) {
    return [
      "PROPHET SAFETY (absolute): Do not depict any prophet as a person in any form.",
      "Forbidden: face, back view, side view, silhouette, shadow-person, veiled body, hands, body crop, or any figure meant to be the prophet.",
      "Allowed only: historically fitting landscapes, architecture, roads, houses, mosques, objects, manuscripts, empty rooms,",
      "and optional distant anonymous people who are clearly NOT the prophet and never the narrative focus as the prophet.",
      "Historically and temporally plausible setting for the period of the topic; no modern lamps, furniture, electronics, cars, plastic, or fantasy architecture.",
      "Photorealistic cinematic still/motion, calm, noble, no text, no logos, no watermarks, no readable invented writing on props."
    ].join(" ");
  }

  return [
    "PERSON RULES: Only anonymous symbolic figures — back view, covered side view, face cropped out, or fully shadowed.",
    "No frontal faces, no visible eyes/nose/lips, no portrait likeness, no claim the figure is the named companion/scholar.",
    "For Sahabah, Tabiin, Salaf, or named early scholars: anonymous symbolic figure only, never an identifiable portrait.",
    "Modest historically fitting clothing, anatomically correct hands, no extra fingers, no deformed bodies.",
    "Historically and temporally plausible architecture, tools, books, light sources, and environment for the topic era.",
    "No modern lamps, modern furniture, modern clothing, electronics, cars, plastic, neon, cartoon, fantasy, collage.",
    "Photorealistic cinematic look; no text, logos, watermarks, icons, or readable invented writing in the scene."
  ].join(" ");
}

export function motionNegativePrompt(statement) {
  const base = [
    "face visible", "front portrait", "recognizable face", "eyes visible", "celebrity",
    "deformed hands", "extra fingers", "horror", "mask", "music waveform",
    "text", "watermark", "logo", "social icons", "collage", "cartoon", "fantasy creature",
    "modern laptop", "smartphone", "car", "neon lights", "plastic bottle",
    "wardrobe change", "architecture change", "new person appearing", "morphing"
  ];
  if (isProphetRelatedStatement(statement)) {
    base.push(
      "prophet figure", "prophet silhouette", "prophet shadow", "veiled prophetic figure",
      "central holy person", "named prophet depiction"
    );
  }
  return base.join(", ");
}
