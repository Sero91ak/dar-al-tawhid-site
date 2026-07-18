const assert = require("assert");
const {
  validateQuestionForPublicQuiz
} = require("./quiz-validation");

function baseQuestion(overrides = {}) {
  return {
    id: "quiz-test-1",
    question: "Welche Aussage entspricht Qurʾān 112:1?",
    answers: ["Allah ist Einer.", "Allah hat Kinder.", "Es gibt viele Götter.", "Shirk ist erlaubt."],
    correctIndex: 0,
    explanation: "Qurʾān 112:1 betont die Einheit Allahs.",
    sourceType: "Qurʾān",
    source: "Qurʾān 112:1",
    ...overrides
  };
}

function run(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

run("rejects questions mentioning an internal block number", () => {
  const q = baseQuestion({ question: "Welche Zusammenfassung passt zu Block 451-500?" });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("invalid_meta_question"));
});

run("rejects sourceType Zusammenfassung", () => {
  const q = baseQuestion({ sourceType: "Zusammenfassung" });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("invalid_summary_source_type"));
});

run("rejects sources derived from a question block", () => {
  const q = baseQuestion({ source: "Abgeleitet aus den Quellen des Blocks 451-500" });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("invalid_block_source"));
});

run("rejects questions referring to the learning app", () => {
  const q = baseQuestion({ question: "Wie sollte diese App als Lern-App aufgebaut sein?" });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("invalid_meta_question"));
});

run("rejects questions referring to the quiz system", () => {
  const q = baseQuestion({ question: "Was ist der wichtigste Lernpunkt dieses Quiz-Bereichs?" });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("invalid_meta_question"));
});

run("rejects open questions with true-false answers", () => {
  const q = baseQuestion({
    question: "Welche Aussage ist korrekt?",
    answers: ["Richtig", "Falsch"],
    correctIndex: 0
  });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("question_answer_mismatch"));
});

run("rejects invalid correctIndex", () => {
  const q = baseQuestion({ correctIndex: 12 });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("invalid_correct_index"));
});

run("rejects duplicate answers", () => {
  const q = baseQuestion({
    answers: ["Allah ist Einer.", "Allah ist Einer.", "Shirk ist verboten.", "Tawḥīd ist Pflicht."]
  });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("duplicate_answers"));
});

run("rejects questions without concrete source", () => {
  const q = baseQuestion({ source: "Grundlagen der Gelehrten" });
  const result = validateQuestionForPublicQuiz(q);
  assert(result.errors.includes("non_concrete_source"));
});

run("allows genuine sourced Islamic knowledge questions", () => {
  const q = baseQuestion();
  const result = validateQuestionForPublicQuiz(q);
  assert.strictEqual(result.valid, true);
});
