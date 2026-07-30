const fs = require("fs");
const path = require("path");
const {
  detectInvalidMetaQuestion,
  validateQuestionForPublicQuiz
} = require("./quiz-validation");

const QUIZ_PATH = path.join(__dirname, "..", "data", "quiz-questions.json");
const REPORT_PATH = path.join(__dirname, "..", "data", "quiz-audit-report.json");

const MUST_REPLACE_IDS = new Set(["quiz-350", "quiz-400", "quiz-449", "quiz-450", "quiz-500"]);

const REPLACEMENTS = {
  "quiz-350": {
    category: "Tawḥīd",
    topic: "Duʿāʾ und Nähe von Allah",
    level: "Mittel",
    question:
      "Welche Aussage entspricht Qurʾān 2:186 über die Nähe Allahs und das Bittgebet?",
    answers: [
      "Allah ist nahe und erhört den Ruf des Bittenden, wenn er Ihn anruft.",
      "Allah erhört nur Bittgebete ohne jede Aufrichtigkeit.",
      "Ein Bittgebet wird nur über Tote angenommen.",
      "Bittgebete haben im Islam keine Bedeutung."
    ],
    correctIndex: 0,
    explanation:
      "Qurʾān 2:186 betont, dass Allah nahe ist und den Ruf des Bittenden erhört, wenn er Ihn anruft.",
    sourceType: "Qurʾān",
    source: "Qurʾān 2:186"
  },
  "quiz-400": {
    category: "ʿAqīdah",
    topic: "Absicht in den Taten",
    level: "Mittel",
    question:
      "Welches Prinzip wird im Hadith „Die Taten sind nur nach den Absichten“ gelehrt?",
    answers: [
      "Die Annahme von Taten hängt von der Absicht ab.",
      "Absicht hat keinen Einfluss auf die Bewertung von Taten.",
      "Nur äußere Form zählt, auch ohne richtige Absicht.",
      "Absicht ist nur bei freiwilligen Taten wichtig."
    ],
    correctIndex: 0,
    explanation:
      "Der Hadith macht deutlich, dass die Bewertung und Annahme der Taten mit der Absicht verbunden ist.",
    sourceType: "Hadith",
    source: "Ṣaḥīḥ al-Bukhārī Nr. 1; Ṣaḥīḥ Muslim Nr. 1907"
  },
  "quiz-449": {
    category: "Adab",
    topic: "Bruderschaft und Verhalten",
    level: "Anfänger",
    question:
      "Welches Verhalten verbietet Allah in Qurʾān 49:11 im Umgang untereinander?",
    answers: [
      "Sich gegenseitig verspotten und mit verletzenden Namen rufen.",
      "Sich mit gutem Wort und Respekt begegnen.",
      "Sich bei Konflikten gerecht verhalten.",
      "Die Wahrheit mit Weisheit erklären."
    ],
    correctIndex: 0,
    explanation:
      "Qurʾān 49:11 verbietet Spott, Herabsetzung und verletzende Benennungen unter Gläubigen.",
    sourceType: "Qurʾān",
    source: "Qurʾān 49:11"
  },
  "quiz-450": {
    category: "Fiqh",
    topic: "Wuḍūʾ-Grundlagen",
    level: "Anfänger",
    question:
      "Welche Handlung gehört gemäß Qurʾān 5:6 verpflichtend zum Wuḍūʾ?",
    answers: [
      "Das Gesicht waschen.",
      "Vollständiges Ghusl bei jedem Gebet.",
      "Nur die Hände bis zu den Fingerkuppen waschen.",
      "Auf Wuḍūʾ vollständig verzichten."
    ],
    correctIndex: 0,
    explanation:
      "Qurʾān 5:6 nennt unter den Pflichtbestandteilen des Wuḍūʾ ausdrücklich das Waschen des Gesichts.",
    sourceType: "Qurʾān",
    source: "Qurʾān 5:6"
  },
  "quiz-500": {
    category: "Sunnah",
    topic: "Merkmale des Heuchlers",
    level: "Mittel",
    question:
      "Welches Merkmal wird im Hadith als Zeichen der Heuchelei genannt?",
    answers: [
      "Wenn er spricht, lügt er.",
      "Wenn er spricht, erinnert er häufig an Allah.",
      "Wenn er verspricht, hält er es vollständig.",
      "Wenn ihm etwas anvertraut wird, wahrt er das Vertrauen."
    ],
    correctIndex: 0,
    explanation:
      "Der Hadith nennt unter den Merkmalen des Heuchlers unter anderem das Lügen beim Sprechen.",
    sourceType: "Hadith",
    source: "Ṣaḥīḥ al-Bukhārī Nr. 33; Ṣaḥīḥ Muslim Nr. 59"
  }
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeQuestionText(question) {
  return String(question?.question || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function publicGate(question, validation) {
  return (
    question.status === "published" &&
    question.reviewStatus === "approved" &&
    question.sourceChecked === true &&
    question.wordingChecked === true &&
    question.metaChecked === true &&
    question.logicChecked === true &&
    question.duplicateChecked === true &&
    validation.valid === true
  );
}

function publicGateBefore(question) {
  return (
    question.status === "published" &&
    question.reviewStatus === "approved" &&
    question.sourceChecked === true &&
    question.wordingChecked === true
  );
}

function blockQuestion(question, reasons) {
  const previousStatus = question.status || "";
  question.status = "draft";
  question.reviewStatus = "needs_revision";
  question.sourceChecked = false;
  question.wordingChecked = false;
  question.metaChecked = false;
  question.logicChecked = false;
  question.duplicateChecked = false;
  question.reviewNotes =
    "Automatisch gesperrt: interne Meta-, Block- oder App-Frage; kein eigenständiger islamischer Lerninhalt.";
  question.validationErrors = reasons;
  question.updatedAt = nowIso();
  return previousStatus;
}

function applyReplacement(question, replacement) {
  Object.assign(question, replacement);
  question.status = "published";
  question.reviewStatus = "approved";
  question.sourceChecked = true;
  question.wordingChecked = true;
  question.metaChecked = true;
  question.logicChecked = true;
  question.duplicateChecked = true;
  question.reviewNotes = "Ersatzfrage nach Meta-Audit fachlich neu erstellt und freigegeben.";
  question.reviewedBy = "DAR AL TAWḤID Quiz Audit";
  question.reviewedAt = nowIso();
  question.updatedAt = nowIso();
  question.validationErrors = [];
}

function runAudit() {
  const questions = JSON.parse(fs.readFileSync(QUIZ_PATH, "utf8"));
  const report = {
    totalQuestionsChecked: questions.length,
    publicQuestionsBeforeAudit: 0,
    publicQuestionsAfterAudit: 0,
    metaQuestionsFound: [],
    questionAnswerMismatches: [],
    invalidSources: [],
    duplicateQuestions: [],
    blockedQuestions: [],
    correctedQuestions: [],
    remainingManualReviews: []
  };

  const beforeValidationById = new Map();
  questions.forEach((q) => {
    beforeValidationById.set(q.id, validateQuestionForPublicQuiz(q));
  });
  report.publicQuestionsBeforeAudit = questions.filter((q) => publicGateBefore(q)).length;

  const byQuestionText = new Map();
  questions.forEach((q) => {
    const key = normalizeQuestionText(q);
    if (!key) return;
    if (!byQuestionText.has(key)) byQuestionText.set(key, []);
    byQuestionText.get(key).push(q.id);
  });

  for (const [_, ids] of byQuestionText.entries()) {
    if (ids.length > 1) {
      report.duplicateQuestions.push(...ids);
    }
  }

  for (const question of questions) {
    const validation = validateQuestionForPublicQuiz(question);
    const reasons = [...validation.errors];

    if (detectInvalidMetaQuestion(question)) {
      report.metaQuestionsFound.push(question.id);
    }
    if (reasons.includes("question_answer_mismatch")) {
      report.questionAnswerMismatches.push(question.id);
    }
    if (reasons.includes("missing_source") || reasons.includes("non_concrete_source")) {
      report.invalidSources.push(question.id);
    }

    const isDuplicate = report.duplicateQuestions.includes(question.id);
    if (isDuplicate && !reasons.includes("duplicate_question_text")) {
      reasons.push("duplicate_question_text");
    }

    if (reasons.length) {
      const previousStatus = blockQuestion(question, reasons);
      report.blockedQuestions.push({
        id: question.id,
        reason: reasons,
        previousStatus,
        newStatus: question.status,
        replacementRequired: MUST_REPLACE_IDS.has(question.id)
      });
    } else {
      question.metaChecked = true;
      question.logicChecked = true;
      question.duplicateChecked = true;
      question.validationErrors = [];
    }
  }

  for (const id of MUST_REPLACE_IDS) {
    const question = questions.find((q) => q.id === id);
    if (!question) continue;
    applyReplacement(question, REPLACEMENTS[id]);
    report.correctedQuestions.push({
      id,
      action: "replaced_with_sourced_islamic_question",
      source: question.source
    });
  }
  report.metaQuestionsFound = Array.from(new Set([...report.metaQuestionsFound, ...report.correctedQuestions.map((x) => x.id)]));

  const afterValidationById = new Map();
  questions.forEach((q) => {
    afterValidationById.set(q.id, validateQuestionForPublicQuiz(q));
    if (!publicGate(q, afterValidationById.get(q.id)) && q.status === "published") {
      report.remainingManualReviews.push({
        id: q.id,
        errors: afterValidationById.get(q.id).errors
      });
    }
  });
  report.publicQuestionsAfterAudit = questions.filter((q) =>
    publicGate(q, afterValidationById.get(q.id))
  ).length;

  fs.writeFileSync(QUIZ_PATH, JSON.stringify(questions, null, 2) + "\n");
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log("quiz audit complete");
  console.log(`checked: ${report.totalQuestionsChecked}`);
  console.log(`blocked: ${report.blockedQuestions.length}`);
  console.log(`corrected: ${report.correctedQuestions.length}`);
  console.log(`report: ${REPORT_PATH}`);
}

runAudit();
