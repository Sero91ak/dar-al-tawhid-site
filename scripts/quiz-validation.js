const META_PATTERNS = [
  /\bBlock\s*\d+\s*[–-]\s*\d+\b/i,
  /\b(dieser|diesem|diesen)\s+Block\b/i,
  /\bLernpunkt\s+(dieses|dieser)\s+Blocks?\b/i,
  /\bZusammenfassung\s+(dieses|dieser)\s+Blocks?\b/i,
  /\bFragen\s+(dieses|dieser)\s+Blocks?\b/i,
  /\bLern-App\b/i,
  /\bislamische\s+Lern-App\b/i,
  /\bQuiz-Bereich(?:s)?\b/i,
  /\bQuiz-?System\b/i,
  /\bdiese\s+App\b/i,
  /\bApp\s+als\s+Lern/i,
  /\bAbgeleitet\s+aus\s+den\s+Quellen\s+des\s+Blocks\b/i
];

const GENERIC_SOURCE_PATTERNS = [
  /grundlagen\s+der\s+gelehrten/i,
  /abgeleitet\s+aus\s+den\s+quellen\s+des\s+blocks/i
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function detectInvalidMetaQuestion(question) {
  const hay = [
    question?.question,
    question?.topic,
    question?.source,
    question?.explanation
  ].join("\n");
  if (META_PATTERNS.some((pattern) => pattern.test(hay))) return true;
  if (String(question?.sourceType || "") === "Zusammenfassung") return true;
  if (/Abgeleitet aus den Quellen des Blocks/i.test(question?.source || "")) return true;
  if (/Lernpunkt dieses Blocks|Lehrreiche Zusammenfassung/i.test(question?.topic || "")) return true;
  return false;
}

function hasDuplicateAnswers(answers) {
  if (!Array.isArray(answers)) return false;
  const seen = new Set();
  for (const raw of answers) {
    const key = normalize(raw).replace(/\s+/g, " ");
    if (!key) continue;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function hasQuestionAnswerTypeMismatch(question) {
  const q = normalize(question?.question);
  const answers = Array.isArray(question?.answers) ? question.answers.map(normalize) : [];
  if (!q || answers.length < 2) return false;
  const binaryAnswers = ["richtig", "falsch", "ja", "nein"];
  const binaryOnly = answers.every((a) => binaryAnswers.includes(a));
  const openQuestion = /^(welche|welcher|welches|was|wer|wann|wo|warum|wodurch|womit|wie)\b/i.test(
    question?.question || ""
  );
  return binaryOnly && openQuestion;
}

function hasConcreteSource(question) {
  const source = String(question?.source || "").trim();
  if (!source) return false;
  if (GENERIC_SOURCE_PATTERNS.some((pattern) => pattern.test(source))) return false;
  if (/^qur.?an\s*\d+:\d+/i.test(source)) return true;
  if (/(bukh[aā]r[iī]|muslim|ab[uū]\s*d[āa]w[uū]d|tirmidh[iī]|nas[aā][’']?[iī]|ibn\s*m[aā]jah)/i.test(source) && /\d/.test(source)) return true;
  if (/(werk|band|seite|nr\.|nummer|hadith|[āa]th[aā]r|tafs[iī]r|zuhd)/i.test(source) && /\d/.test(source)) return true;
  return source.length >= 8;
}

function validateQuestionForPublicQuiz(question) {
  const errors = [];
  if (!question?.id) errors.push("missing_id");
  if (!String(question?.question || "").trim()) errors.push("missing_question");
  if (!Array.isArray(question?.answers)) errors.push("missing_answers");
  if ((question?.answers || []).length < 2) errors.push("too_few_answers");
  if (
    !Number.isInteger(question?.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex >= (question.answers || []).length
  ) {
    errors.push("invalid_correct_index");
  }
  if (detectInvalidMetaQuestion(question)) errors.push("invalid_meta_question");
  if (String(question?.sourceType || "") === "Zusammenfassung") errors.push("invalid_summary_source_type");
  if (/Abgeleitet aus den Quellen des Blocks/i.test(question?.source || "")) errors.push("invalid_block_source");
  if (!String(question?.explanation || "").trim()) errors.push("missing_explanation");
  if (!String(question?.source || "").trim()) errors.push("missing_source");
  if (!hasConcreteSource(question)) errors.push("non_concrete_source");
  if (hasQuestionAnswerTypeMismatch(question)) errors.push("question_answer_mismatch");
  if (hasDuplicateAnswers(question?.answers)) errors.push("duplicate_answers");
  return { valid: errors.length === 0, errors };
}

module.exports = {
  META_PATTERNS,
  detectInvalidMetaQuestion,
  hasDuplicateAnswers,
  hasQuestionAnswerTypeMismatch,
  hasConcreteSource,
  validateQuestionForPublicQuiz
};
