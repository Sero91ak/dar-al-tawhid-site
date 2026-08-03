/* Themenatmosphäre und feste DAR-Video-Template-Bausteine */

export function resolveThemeAtmosphere(topic = "", statementText = "") {
  const hay = `${topic} ${statementText}`.toLowerCase();

  if (/dhikr|gedenken|herz|taqw|ruhe|spiritual/.test(hay)) {
    return {
      id: "dhikr",
      label: "Dhikr / Taqwā",
      opening: "quiet mosque corner at soft dawn, warm shafts of light through lattice, contemplative islamic atmosphere",
      reflection: "still prayer niche with soft lamp glow, wooden mihrab textures, calm dust motes",
      emphasis: "close symbolic detail of prayer beads or open mushaf pages, gentle bokeh, noble restraint",
      closing: "peaceful courtyard arcade at dusk, islamic arches, quiet dignity"
    };
  }

  if (/familie|adab|erzieh|haus|kind/.test(hay)) {
    return {
      id: "adab",
      label: "Adab / Familie",
      opening: "elegant modest home study with warm wood, soft morning light, orderly islamic household atmosphere",
      reflection: "seated anonymous figure facing away near a quiet desk, modest robes, calm domestic nobility",
      emphasis: "hands arranging books or writing carefully, anatomically correct fingers, soft lamp light",
      closing: "corridor of a calm home leading to soft window light, contemplative exit"
    };
  }

  if (/aqidah|ʿaqīdah|aqida|manhaj|glauben|sunnah|tauhid|tawḥīd|tawhid/.test(hay)) {
    return {
      id: "manhaj",
      label: "ʿAqīdah / Manhaǧ",
      opening: "dignified scholarly chamber, clear geometry, warm stone and wood, serious calm islamic mood",
      reflection: "silhouette before tall shelves of classical volumes, back to camera, solemn composure",
      emphasis: "symbolic detail of classical manuscript and ink, precise hands, cinematic depth",
      closing: "quiet mosque corridor with soft dusk light, architectural dignity, measured pull-back"
    };
  }

  return {
    id: "ilm",
    label: "Wissen / Gelehrte",
    opening: "quiet scholarly library study at soft dawn, warm wooden shelves, parchment, calm islamic atmosphere",
    reflection: "bookshelf reading niche with warm lamp light, contemplative scholarly mood",
    emphasis: "hands carefully turning pages of a classical book, anatomically correct fingers, modest sleeves",
    closing: "peaceful scholarly corridor or courtyard at soft dusk, islamic architecture, quiet dignity"
  };
}
