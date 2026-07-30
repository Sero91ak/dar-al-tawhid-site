/**
 * DAR AL TAWḤĪD — Quiz-Statistik Backend
 * Ingest (Besucher) + geschützte Admin-Auswertungen
 */

const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

const PROD_FILTER = "environment=eq.production&app_variant=eq.visitor";

function supabaseKey(env) {
  return String(env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY).trim();
}

async function sb(env, path, { method = "GET", body = null, prefer = "" } = {}) {
  const headers = {
    apikey: supabaseKey(env),
    Authorization: `Bearer ${supabaseKey(env)}`
  };
  if (body != null) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers, body: body == null ? null : JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function levelWeight(level) {
  const l = String(level || "").toLowerCase();
  if (l.includes("fortgeschritten") || l.includes("experte")) return 1.5;
  if (l.includes("mittel")) return 1.25;
  return 1.0;
}

function knowledgeLevelLabel(score, count, minCount) {
  if (count < minCount) return "Noch nicht genügend Antworten für eine zuverlässige Bewertung.";
  const s = Number(score || 0);
  if (s < 0.35) return "Im Aufbau";
  if (s < 0.55) return "Grundlagen vorhanden";
  if (s < 0.72) return "Solider Wissensstand";
  if (s < 0.88) return "Fortgeschritten";
  return "Sehr sicher";
}

function parseRole(request) {
  const role = String(request.headers.get("X-Admin-Role") || "admin").trim().toLowerCase();
  if (["content_reviewer", "admin", "super_admin"].includes(role)) return role;
  return "admin";
}

function assertRole(role, allowed) {
  if (!allowed.includes(role)) {
    const err = new Error("Keine Berechtigung für diese Aktion");
    err.status = 403;
    throw err;
  }
}

function parseFilters(url) {
  const p = url.searchParams;
  const days = Number(p.get("days") || 30);
  const from = p.get("from");
  const to = p.get("to");
  let since;
  let until = new Date().toISOString();
  if (from) since = new Date(from).toISOString();
  else since = new Date(Date.now() - days * 86400000).toISOString();
  if (to) until = new Date(to).toISOString();
  return {
    since,
    until,
    category: p.get("category") || "",
    topic: p.get("topic") || "",
    level: p.get("level") || "",
    mode: p.get("mode") || "",
    userType: p.get("userType") || "all",
    appVersion: p.get("appVersion") || "",
    questionId: p.get("questionId") || "",
    userId: p.get("userId") || "",
    q: p.get("q") || "",
    limit: Math.min(200, Math.max(1, Number(p.get("limit") || 50))),
    offset: Math.max(0, Number(p.get("offset") || 0))
  };
}

function timeFilter(col, f) {
  return `${col}=gte.${encodeURIComponent(f.since)}&${col}=lte.${encodeURIComponent(f.until)}`;
}

function isValidEnvVariant(environment, appVariant) {
  return ["production", "staging", "test"].includes(environment) && ["visitor", "admin", "test"].includes(appVariant);
}

async function ingestQuizStats(env, payload) {
  const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
  const attempts = Array.isArray(payload?.attempts) ? payload.attempts : [];
  const sessionIdMap = new Map();
  let insertedSessions = 0;
  let insertedAttempts = 0;
  let skippedAttempts = 0;

  for (const s of sessions) {
    const environment = String(s.environment || "production");
    const appVariant = String(s.app_variant || s.appVariant || "visitor");
    if (!isValidEnvVariant(environment, appVariant)) continue;
    const row = {
      user_id: s.user_id || null,
      anonymous_session_id: s.anonymous_session_id || s.anonymousSessionId || null,
      mode: String(s.mode || "standard"),
      environment,
      app_variant: appVariant,
      app_version: String(s.app_version || s.appVersion || ""),
      started_at: s.started_at || s.startedAt || new Date().toISOString(),
      completed_at: s.completed_at || s.completedAt || null,
      abandoned_at: s.abandoned_at || s.abandonedAt || null,
      total_questions: Number(s.total_questions || s.totalQuestions || 0),
      answered_questions: Number(s.answered_questions || s.answeredQuestions || 0),
      correct_answers: Number(s.correct_answers || s.correctAnswers || 0),
      wrong_answers: Number(s.wrong_answers || s.wrongAnswers || 0),
      skipped_answers: Number(s.skipped_answers || s.skippedAnswers || 0),
      duration_ms: Number(s.duration_ms || s.durationMs || 0),
      updated_at: new Date().toISOString()
    };
    const clientSessionId = String(s.client_session_id || s.clientSessionId || s.id || "");
    try {
      const created = await sb(env, "quiz_sessions?select=id", {
        method: "POST",
        prefer: "return=representation",
        body: row
      });
      const rec = Array.isArray(created) ? created[0] : created;
      if (rec?.id && clientSessionId) sessionIdMap.set(clientSessionId, rec.id);
      insertedSessions += 1;
    } catch (e) {
      if (e.status !== 409) console.warn("quiz session insert:", e.message);
    }
  }

  for (const a of attempts) {
    const clientAttemptId = String(a.client_attempt_id || a.clientAttemptId || "");
    if (!clientAttemptId) continue;
    const environment = String(a.environment || "production");
    const appVariant = String(a.app_variant || a.appVariant || "visitor");
    if (!isValidEnvVariant(environment, appVariant)) continue;

    let sessionId = a.session_id || null;
    const clientSessionId = String(a.client_session_id || a.clientSessionId || "");
    if (!sessionId && clientSessionId && sessionIdMap.has(clientSessionId)) {
      sessionId = sessionIdMap.get(clientSessionId);
    }

    const row = {
      client_attempt_id: clientAttemptId,
      session_id: sessionId,
      user_id: a.user_id || null,
      anonymous_session_id: a.anonymous_session_id || a.anonymousSessionId || null,
      question_id: String(a.question_id || a.questionId || ""),
      question_number: a.question_number != null ? Number(a.question_number) : null,
      question_version: String(a.question_version || a.questionVersion || "1"),
      question_content_hash: String(a.question_content_hash || a.questionContentHash || ""),
      category: String(a.category || ""),
      topic: String(a.topic || ""),
      level: String(a.level || ""),
      selected_answer_index: a.selected_answer_index != null ? Number(a.selected_answer_index) : a.selectedAnswerIndex != null ? Number(a.selectedAnswerIndex) : null,
      correct_answer_index: Number(a.correct_answer_index ?? a.correctAnswerIndex ?? 0),
      is_correct: !!(a.is_correct ?? a.isCorrect),
      is_skipped: !!(a.is_skipped ?? a.isSkipped),
      attempt_number: Number(a.attempt_number || a.attemptNumber || 1),
      is_first_attempt: !!(a.is_first_attempt ?? a.isFirstAttempt ?? true),
      response_time_ms: Number(a.response_time_ms || a.responseTimeMs || 0),
      answered_at: a.answered_at || a.answeredAt || new Date().toISOString(),
      created_offline: !!(a.created_offline ?? a.createdOffline),
      environment,
      app_variant: appVariant,
      app_version: String(a.app_version || a.appVersion || ""),
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await sb(env, "quiz_attempts", { method: "POST", prefer: "return=minimal", body: row });
      insertedAttempts += 1;
      if (row.user_id && environment === "production" && appVariant === "visitor") {
        await updateUserAggregates(env, row);
      }
    } catch (e) {
      if (e.status === 409) skippedAttempts += 1;
      else console.warn("quiz attempt insert:", e.message);
    }
  }

  return { ok: true, insertedSessions, insertedAttempts, skippedAttempts };
}

async function updateUserAggregates(env, attempt) {
  const userId = attempt.user_id;
  const questionId = attempt.question_id;
  if (!userId || !questionId) return;

  const existing = await sb(
    env,
    `user_question_progress?user_id=eq.${encodeURIComponent(userId)}&question_id=eq.${encodeURIComponent(questionId)}&select=*&limit=1`
  );
  const prev = Array.isArray(existing) && existing.length ? existing[0] : null;
  const now = new Date().toISOString();
  const isFirst = !prev;
  const firstCorrect = isFirst ? attempt.is_correct : prev.first_attempt_correct;
  const totalAttempts = (prev?.total_attempts || 0) + 1;
  const correctAttempts = (prev?.correct_attempts || 0) + (attempt.is_correct ? 1 : 0);
  const wrongAttempts = (prev?.wrong_attempts || 0) + (attempt.is_correct ? 0 : 1);
  let consecutive = attempt.is_correct ? (prev?.consecutive_correct || 0) + 1 : 0;
  const mastered = attempt.is_correct && (prev?.mastered_at || (isFirst && attempt.is_correct));
  const progressRow = {
    user_id: userId,
    question_id: questionId,
    first_attempt_correct: firstCorrect,
    total_attempts: totalAttempts,
    correct_attempts: correctAttempts,
    wrong_attempts: wrongAttempts,
    consecutive_correct: consecutive,
    last_answer_correct: attempt.is_correct,
    learning_status: mastered ? "mastered" : "learning",
    first_answered_at: prev?.first_answered_at || attempt.answered_at,
    last_answered_at: attempt.answered_at,
    mastered_at: mastered ? prev?.mastered_at || attempt.answered_at : prev?.mastered_at || null,
    updated_at: now
  };
  await sb(env, "user_question_progress?on_conflict=user_id,question_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: progressRow
  });

  const allProgress = await sb(
    env,
    `user_question_progress?user_id=eq.${encodeURIComponent(userId)}&select=first_attempt_correct,learning_status,total_attempts`
  );
  const rows = Array.isArray(allProgress) ? allProgress : [];
  const uniqueQ = rows.length;
  const firstAnswered = rows.filter((r) => r.first_attempt_correct != null);
  const correctFirst = firstAnswered.filter((r) => r.first_attempt_correct).length;
  const wrongFirst = firstAnswered.length - correctFirst;
  const masteredCount = rows.filter((r) => r.learning_status === "mastered").length;
  const firstAcc = firstAnswered.length ? correctFirst / firstAnswered.length : 0;
  const currentAcc = uniqueQ ? masteredCount / uniqueQ : 0;
  const learningGain = currentAcc - firstAcc;
  const totalAtt = rows.reduce((s, r) => s + Number(r.total_attempts || 0), 0);

  const catRows = await sb(
    env,
    `quiz_attempts?user_id=eq.${encodeURIComponent(userId)}&${PROD_FILTER}&is_first_attempt=eq.true&select=category,is_correct,level&limit=5000`
  );
  const catMap = new Map();
  for (const r of Array.isArray(catRows) ? catRows : []) {
    const cat = String(r.category || "Allgemein");
    if (!catMap.has(cat)) catMap.set(cat, { first: 0, correctFirst: 0, mastered: 0, weight: 0 });
    const c = catMap.get(cat);
    c.first += 1;
    if (r.is_correct) c.correctFirst += 1;
    c.weight += levelWeight(r.level);
  }
  const masteredByCat = await sb(
    env,
    `user_question_progress?user_id=eq.${encodeURIComponent(userId)}&learning_status=eq.mastered&select=question_id`
  );
  const masteredIds = new Set((Array.isArray(masteredByCat) ? masteredByCat : []).map((r) => r.question_id));
  const qCats = await sb(
    env,
    `quiz_attempts?user_id=eq.${encodeURIComponent(userId)}&${PROD_FILTER}&select=question_id,category&limit=5000`
  );
  const qCatMap = new Map();
  for (const r of Array.isArray(qCats) ? qCats : []) qCatMap.set(r.question_id, r.category);
  for (const qid of masteredIds) {
    const cat = String(qCatMap.get(qid) || "Allgemein");
    if (!catMap.has(cat)) catMap.set(cat, { first: 0, correctFirst: 0, mastered: 0, weight: 0 });
    catMap.get(cat).mastered += 1;
  }

  let weighted = 0;
  let weightSum = 0;
  for (const [, c] of catMap) {
    const acc = c.first ? c.correctFirst / c.first : 0;
    weighted += acc * c.weight;
    weightSum += c.weight;
  }
  const weightedScore = weightSum ? weighted / weightSum : 0;

  const statsRow = {
    user_id: userId,
    unique_questions_answered: uniqueQ,
    total_attempts: totalAtt,
    correct_first_attempts: correctFirst,
    wrong_first_attempts: wrongFirst,
    first_attempt_accuracy: firstAcc,
    current_accuracy: currentAcc,
    weighted_knowledge_score: weightedScore,
    learning_gain: learningGain,
    last_activity_at: attempt.answered_at,
    updated_at: now
  };
  await sb(env, "user_quiz_statistics?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: statsRow
  });

  for (const [category, c] of catMap) {
    const firstAccCat = c.first ? c.correctFirst / c.first : 0;
    const currentAccCat = c.first ? c.mastered / c.first : 0;
    const catRow = {
      user_id: userId,
      category,
      unique_questions_answered: c.first,
      correct_first_attempts: c.correctFirst,
      wrong_first_attempts: c.first - c.correctFirst,
      first_attempt_accuracy: firstAccCat,
      current_accuracy: currentAccCat,
      weighted_score: firstAccCat * levelWeight(""),
      knowledge_level: knowledgeLevelLabel(currentAccCat, c.first, 10),
      last_activity_at: attempt.answered_at,
      updated_at: now
    };
    await sb(env, "user_category_statistics?on_conflict=user_id,category", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: catRow
    });
  }
}

async function getOverview(env, f) {
  const tf = timeFilter("started_at", f);
  const sessions = await sb(
    env,
    `quiz_sessions?${PROD_FILTER}&${tf}&select=id,user_id,anonymous_session_id,started_at,completed_at,abandoned_at,total_questions,answered_questions,correct_answers,wrong_answers,skipped_answers,duration_ms,mode`
  );
  const sess = Array.isArray(sessions) ? sessions : [];
  const attempts = await sb(
    env,
    `quiz_attempts?${PROD_FILTER}&${timeFilter("answered_at", f)}&select=is_correct,is_first_attempt,response_time_ms,category,question_id,selected_answer_index`
  );
  const att = Array.isArray(attempts) ? attempts : [];

  const registeredUsers = await sb(env, `user_quiz_statistics?select=user_id&limit=10000`);
  const userIds = new Set((Array.isArray(registeredUsers) ? registeredUsers : []).map((r) => r.user_id));
  const now = Date.now();
  const day = 86400000;
  const activeToday = new Set();
  const active7 = new Set();
  const active30 = new Set();
  const anonSessions = new Set();

  for (const s of sess) {
    const t = Date.parse(s.started_at || 0);
    if (s.user_id) {
      if (now - t < day) activeToday.add(s.user_id);
      if (now - t < 7 * day) active7.add(s.user_id);
      if (now - t < 30 * day) active30.add(s.user_id);
    } else if (s.anonymous_session_id) {
      anonSessions.add(s.anonymous_session_id);
      if (now - t < 30 * day) active30.add(`anon:${s.anonymous_session_id}`);
    }
  }

  const completed = sess.filter((s) => s.completed_at).length;
  const abandoned = sess.filter((s) => s.abandoned_at && !s.completed_at).length;
  const started = sess.length;
  const firstAttempts = att.filter((a) => a.is_first_attempt);
  const correctFirst = firstAttempts.filter((a) => a.is_correct).length;
  const correct = att.filter((a) => a.is_correct).length;
  const wrong = att.filter((a) => !a.is_correct && !a.is_skipped).length;
  const skipped = att.filter((a) => a.is_skipped).length;

  const catStats = new Map();
  for (const a of firstAttempts) {
    const cat = String(a.category || "Allgemein");
    if (!catStats.has(cat)) catStats.set(cat, { first: 0, correct: 0 });
    const c = catStats.get(cat);
    c.first += 1;
    if (a.is_correct) c.correct += 1;
  }
  let topCat = "";
  let worstCat = "";
  let topCount = 0;
  let worstRate = 2;
  for (const [cat, c] of catStats) {
    if (c.first > topCount) {
      topCount = c.first;
      topCat = cat;
    }
    const rate = c.first ? c.correct / c.first : 0;
    if (c.first >= 5 && rate < worstRate) {
      worstRate = rate;
      worstCat = cat;
    }
  }

  const qStats = new Map();
  for (const a of firstAttempts) {
    const qid = a.question_id;
    if (!qStats.has(qid)) qStats.set(qid, { first: 0, correct: 0 });
    const q = qStats.get(qid);
    q.first += 1;
    if (a.is_correct) q.correct += 1;
  }
  let hardest = "";
  let easiest = "";
  let hardestRate = 2;
  let easiestRate = -1;
  for (const [qid, q] of qStats) {
    if (q.first < 10) continue;
    const rate = q.correct / q.first;
    if (rate < hardestRate) {
      hardestRate = rate;
      hardest = qid;
    }
    if (rate > easiestRate) {
      easiestRate = rate;
      easiest = qid;
    }
  }

  const avgResponse = att.length ? Math.round(att.reduce((s, a) => s + Number(a.response_time_ms || 0), 0) / att.length) : 0;
  const avgDuration = sess.length ? Math.round(sess.reduce((s, x) => s + Number(x.duration_ms || 0), 0) / sess.length) : 0;
  const avgQuestions = sess.length ? Math.round(sess.reduce((s, x) => s + Number(x.answered_questions || 0), 0) / sess.length) : 0;

  return {
    registeredQuizUsers: userIds.size,
    activeQuizUsersToday: activeToday.size,
    activeQuizUsers7d: active7.size,
    activeQuizUsers30d: active30.size,
    anonymousQuizUsers30d: [...anonSessions].length,
    startedSessions: started,
    completedSessions: completed,
    abandonedSessions: abandoned,
    completionRate: started ? Math.round((completed / started) * 100) : 0,
    totalAnswers: att.length,
    correctAnswers: correct,
    wrongAnswers: wrong,
    skippedAnswers: skipped,
    avgFirstAttemptRate: firstAttempts.length ? Math.round((correctFirst / firstAttempts.length) * 100) : 0,
    avgResponseTimeMs: avgResponse,
    avgSessionDurationMs: avgDuration,
    avgQuestionsPerSession: avgQuestions,
    topCategory: topCat,
    weakestCategory: worstCat,
    hardestQuestion: hardest,
    easiestQuestion: easiest,
    filters: f
  };
}

async function getUsers(env, f, role) {
  assertRole(role, ["admin", "super_admin"]);
  let path = `user_quiz_statistics?select=*,user_profiles(username)&order=last_activity_at.desc&limit=${f.limit}&offset=${f.offset}`;
  const rows = await sb(env, path);
  const list = (Array.isArray(rows) ? rows : []).map((r) => ({
    userId: r.user_id,
    displayName: r.user_profiles?.username || r.user_id?.slice(0, 8) || "Nutzer",
    lastActivity: r.last_activity_at,
    uniqueQuestions: r.unique_questions_answered,
    totalAttempts: r.total_attempts,
    firstAttemptRate: Math.round(Number(r.first_attempt_accuracy || 0) * 100),
    currentAccuracy: Math.round(Number(r.current_accuracy || 0) * 100),
    completedSessions: r.completed_sessions,
    knowledgeLevel: knowledgeLevelLabel(r.current_accuracy, r.unique_questions_answered, 30),
    learningGain: Math.round(Number(r.learning_gain || 0) * 100)
  }));
  if (f.q) {
    const q = f.q.toLowerCase();
    return list.filter((u) => u.displayName.toLowerCase().includes(q) || String(u.userId).includes(q));
  }
  return list;
}

async function getUserDetail(env, userId, role) {
  assertRole(role, ["admin", "super_admin"]);
  const stats = await sb(env, `user_quiz_statistics?user_id=eq.${encodeURIComponent(userId)}&select=*,user_profiles(username)&limit=1`);
  const s = Array.isArray(stats) && stats.length ? stats[0] : null;
  if (!s) return { error: "Nutzer nicht gefunden" };
  const categories = await sb(
    env,
    `user_category_statistics?user_id=eq.${encodeURIComponent(userId)}&select=*&order=weighted_score.desc`
  );
  const progress = await sb(
    env,
    `user_question_progress?user_id=eq.${encodeURIComponent(userId)}&select=*&order=last_answered_at.desc&limit=30`
  );
  return {
    userId,
    displayName: s.user_profiles?.username || userId,
    uniqueQuestions: s.unique_questions_answered,
    totalAttempts: s.total_attempts,
    correctFirstAttempts: s.correct_first_attempts,
    wrongFirstAttempts: s.wrong_first_attempts,
    firstAttemptRate: Math.round(Number(s.first_attempt_accuracy || 0) * 100),
    currentAccuracy: Math.round(Number(s.current_accuracy || 0) * 100),
    learningGain: Math.round(Number(s.learning_gain || 0) * 100),
    knowledgeLevel: knowledgeLevelLabel(s.current_accuracy, s.unique_questions_answered, 30),
    currentStreak: s.current_streak,
    bestStreak: s.best_streak,
    avgResponseTimeMs: s.average_response_time_ms,
    lastActivity: s.last_activity_at,
    strongestCategories: (Array.isArray(categories) ? categories : []).slice(0, 5).map((c) => ({
      category: c.category,
      level: c.knowledge_level || knowledgeLevelLabel(c.current_accuracy, c.unique_questions_answered, 10),
      firstAttemptRate: Math.round(Number(c.first_attempt_accuracy || 0) * 100)
    })),
    weakestCategories: (Array.isArray(categories) ? categories : [])
      .sort((a, b) => Number(a.current_accuracy) - Number(b.current_accuracy))
      .slice(0, 5)
      .map((c) => ({
        category: c.category,
        level: c.knowledge_level,
        firstAttemptRate: Math.round(Number(c.first_attempt_accuracy || 0) * 100)
      })),
    recentQuestions: (Array.isArray(progress) ? progress : []).slice(0, 15)
  };
}

async function getQuestions(env, f) {
  const tf = timeFilter("answered_at", f);
  let filter = `${PROD_FILTER}&${tf}&is_first_attempt=eq.true`;
  if (f.category) filter += `&category=eq.${encodeURIComponent(f.category)}`;
  const rows = await sb(env, `quiz_attempts?${filter}&select=question_id,category,topic,level,is_correct,response_time_ms,selected_answer_index,correct_answer_index&limit=5000`);
  const map = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const id = r.question_id;
    if (!map.has(id)) {
      map.set(id, {
        questionId: id,
        category: r.category,
        topic: r.topic,
        level: r.level,
        views: 0,
        answers: 0,
        firstAttempts: 0,
        correctFirst: 0,
        wrongFirst: 0,
        responseSum: 0,
        optionCounts: [0, 0, 0, 0]
      });
    }
    const q = map.get(id);
    q.answers += 1;
    q.firstAttempts += 1;
    q.responseSum += Number(r.response_time_ms || 0);
    if (r.is_correct) q.correctFirst += 1;
    else q.wrongFirst += 1;
    const idx = Number(r.selected_answer_index);
    if (idx >= 0 && idx < 4) q.optionCounts[idx] += 1;
  }
  return [...map.values()]
    .map((q) => ({
      ...q,
      firstAttemptRate: q.firstAttempts ? Math.round((q.correctFirst / q.firstAttempts) * 100) : 0,
      avgResponseTimeMs: q.answers ? Math.round(q.responseSum / q.answers) : 0,
      optionDistribution: q.optionCounts.map((c) => (q.answers ? Math.round((c / q.answers) * 100) : 0))
    }))
    .sort((a, b) => b.firstAttempts - a.firstAttempts)
    .slice(f.offset, f.offset + f.limit);
}

async function getCategories(env, f) {
  const tf = timeFilter("answered_at", f);
  const rows = await sb(
    env,
    `quiz_attempts?${PROD_FILTER}&${tf}&is_first_attempt=eq.true&select=category,is_correct,response_time_ms,level,question_id&limit=10000`
  );
  const map = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const cat = String(r.category || "Allgemein");
    if (!map.has(cat)) map.set(cat, { category: cat, questions: new Set(), first: 0, correct: 0, responseSum: 0, levels: [] });
    const c = map.get(cat);
    c.questions.add(r.question_id);
    c.first += 1;
    if (r.is_correct) c.correct += 1;
    c.responseSum += Number(r.response_time_ms || 0);
    c.levels.push(r.level);
  }
  return [...map.values()]
    .map((c) => ({
      category: c.category,
      uniqueQuestions: c.questions.size,
      answeredQuestions: c.first,
      firstAttemptRate: c.first ? Math.round((c.correct / c.first) * 100) : 0,
      avgResponseTimeMs: c.first ? Math.round(c.responseSum / c.first) : 0,
      avgLevel: c.levels[0] || ""
    }))
    .sort((a, b) => a.category.localeCompare(b.category, "de"));
}

async function getSessions(env, f) {
  const tf = timeFilter("started_at", f);
  const rows = await sb(
    env,
    `quiz_sessions?${PROD_FILTER}&${tf}&select=id,mode,started_at,completed_at,abandoned_at,total_questions,answered_questions,correct_answers,wrong_answers,duration_ms,user_id,anonymous_session_id&order=started_at.desc&limit=${f.limit}&offset=${f.offset}`
  );
  return (Array.isArray(rows) ? rows : []).map((s) => ({
    id: s.id,
    mode: s.mode,
    startedAt: s.started_at,
    completedAt: s.completed_at,
    abandonedAt: s.abandoned_at,
    totalQuestions: s.total_questions,
    answeredQuestions: s.answered_questions,
    correctAnswers: s.correct_answers,
    wrongAnswers: s.wrong_answers,
    durationMs: s.duration_ms,
    userType: s.user_id ? "registered" : "anonymous"
  }));
}

async function getAlerts(env, f) {
  const questions = await getQuestions(env, { ...f, limit: 500, offset: 0 });
  const alerts = [];
  for (const q of questions) {
    if (q.firstAttempts >= 50 && q.firstAttemptRate > 95) {
      alerts.push({ questionId: q.questionId, type: "too_easy", message: "Möglicherweise zu leicht", rate: q.firstAttemptRate, attempts: q.firstAttempts });
    }
    if (q.firstAttempts >= 50 && q.firstAttemptRate < 20) {
      alerts.push({ questionId: q.questionId, type: "too_hard", message: "Möglicherweise zu schwierig", rate: q.firstAttemptRate, attempts: q.firstAttempts });
    }
    if (q.answers >= 100) {
      q.optionDistribution.forEach((pct, idx) => {
        if (pct > 0 && pct < 2 && idx !== q.correctAnswerIndex) {
          alerts.push({
            questionId: q.questionId,
            type: "obvious_distractor",
            message: "Distraktor möglicherweise zu offensichtlich",
            option: "ABCD"[idx],
            rate: pct
          });
        }
      });
    }
    const maxWrong = Math.max(...q.optionDistribution.filter((_, i) => i !== q.correctAnswerIndex));
    if (q.firstAttempts >= 30 && maxWrong > 70) {
      alerts.push({ questionId: q.questionId, type: "review_formulation", message: "Formulierung oder Lösung prüfen", dominantWrongPct: maxWrong });
    }
  }
  return alerts.slice(0, 100);
}

function toCsv(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => esc(typeof c.get === "function" ? c.get(row) : row[c.key])).join(",")).join("\n");
  return `${head}\n${body}`;
}

async function exportQuizStats(env, type, f, role) {
  assertRole(role, ["admin", "super_admin"]);
  const allowPersonal = role === "super_admin";
  if (type === "users" && !allowPersonal) {
    const err = new Error("Personenbezogener Export nur für super_admin");
    err.status = 403;
    throw err;
  }
  if (type === "overview") {
    const o = await getOverview(env, f);
    return toCsv([o], [
      { label: "Registrierte Quiznutzer", get: (r) => r.registeredQuizUsers },
      { label: "Aktive heute", get: (r) => r.activeQuizUsersToday },
      { label: "Aktive 7 Tage", get: (r) => r.activeQuizUsers7d },
      { label: "Aktive 30 Tage", get: (r) => r.activeQuizUsers30d },
      { label: "Gestartete Runden", get: (r) => r.startedSessions },
      { label: "Abgeschlossene Runden", get: (r) => r.completedSessions },
      { label: "Erstversuchsquote %", get: (r) => r.avgFirstAttemptRate }
    ]);
  }
  if (type === "questions") {
    const rows = await getQuestions(env, { ...f, limit: 1000, offset: 0 });
    return toCsv(rows, [
      { key: "questionId", label: "Frage-ID" },
      { key: "category", label: "Kategorie" },
      { key: "firstAttempts", label: "Erstversuche" },
      { key: "firstAttemptRate", label: "Erstversuchsquote %" },
      { key: "avgResponseTimeMs", label: "Ø Antwortzeit ms" }
    ]);
  }
  if (type === "categories") {
    const rows = await getCategories(env, f);
    return toCsv(rows, [
      { key: "category", label: "Kategorie" },
      { key: "answeredQuestions", label: "Beantwortet" },
      { key: "firstAttemptRate", label: "Erstversuchsquote %" }
    ]);
  }
  if (type === "users") {
    const rows = await getUsers(env, { ...f, limit: 5000, offset: 0 }, role);
    return toCsv(rows, [
      { key: "userId", label: "Account-ID" },
      { key: "displayName", label: "Anzeigename" },
      { key: "uniqueQuestions", label: "Fragen" },
      { key: "firstAttemptRate", label: "Erstversuchsquote %" },
      { key: "knowledgeLevel", label: "Wissensstand" }
    ]);
  }
  return "Typ unbekannt";
}

export async function handleQuizStatsRequest(request, env, url, { assertAuthorized }) {
  const pathname = url.pathname;

  if (pathname === "/api/quiz/stats/ingest" && request.method === "POST") {
    const payload = await request.json().catch(() => ({}));
    const result = await ingestQuizStats(env, payload);
    return result;
  }

  if (pathname === "/api/quiz/stats/ingest-test" && request.method === "POST") {
    const payload = await request.json().catch(() => ({}));
    if (Array.isArray(payload.attempts)) {
      payload.attempts = payload.attempts.map((a) => ({ ...a, environment: "test", app_variant: "test" }));
    }
    if (Array.isArray(payload.sessions)) {
      payload.sessions = payload.sessions.map((s) => ({ ...s, environment: "test", app_variant: "test" }));
    }
    return ingestQuizStats(env, payload);
  }

  if (!pathname.startsWith("/api/admin/quiz-stats")) return null;
  assertAuthorized(request, env);
  const role = parseRole(request);
  const f = parseFilters(url);
  const sub = pathname.replace("/api/admin/quiz-stats", "") || "/overview";

  if (sub === "/overview" && request.method === "GET") {
    assertRole(role, ["content_reviewer", "admin", "super_admin"]);
    return getOverview(env, f);
  }
  if (sub === "/users" && request.method === "GET") {
    return getUsers(env, f, role);
  }
  if (sub.startsWith("/users/") && request.method === "GET") {
    const userId = decodeURIComponent(sub.slice(7));
    return getUserDetail(env, userId, role);
  }
  if (sub === "/questions" && request.method === "GET") {
    assertRole(role, ["content_reviewer", "admin", "super_admin"]);
    return getQuestions(env, f);
  }
  if (sub === "/categories" && request.method === "GET") {
    assertRole(role, ["content_reviewer", "admin", "super_admin"]);
    return getCategories(env, f);
  }
  if (sub === "/sessions" && request.method === "GET") {
    assertRole(role, ["admin", "super_admin"]);
    return getSessions(env, f);
  }
  if (sub === "/alerts" && request.method === "GET") {
    assertRole(role, ["content_reviewer", "admin", "super_admin"]);
    return getAlerts(env, f);
  }
  if (sub === "/export" && request.method === "GET") {
    const type = url.searchParams.get("type") || "overview";
    const csv = await exportQuizStats(env, type, f, role);
    return { csv, contentType: "text/csv;charset=utf-8" };
  }

  const err = new Error("Quiz-Statistik-Endpunkt nicht gefunden");
  err.status = 404;
  throw err;
}
