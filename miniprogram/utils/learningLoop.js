const { checkSpelling, nextReviewDate } = require('./study');
const DAILY_PLAN = { newCount: 35, reviewCount: 10, mistakeCount: 5, total: 50 };
function nowIso() { return new Date().toISOString(); }
function createInitialState(openid = 'local-user') {
  return { openid, wordRecords: {}, favorites: [], mistakes: [], sessions: [], updatedAt: nowIso() };
}
function clone(state) { return JSON.parse(JSON.stringify(state || createInitialState())); }
function normalizeAnswer(v) { return String(v || '').trim().toLowerCase(); }
function ensureRecord(state, word) {
  const id = word.id || word.text;
  const old = state.wordRecords[id] || {};
  return {
    wordId: id,
    wordText: word.text,
    status: old.status || 'learning',
    familiarity: old.familiarity || 0,
    wrongCount: old.wrongCount || 0,
    correctCount: old.correctCount || 0,
    isFavorite: !!old.isFavorite,
    isInMistakeBook: !!old.isInMistakeBook,
    firstStudyAt: old.firstStudyAt || nowIso(),
    lastStudyAt: nowIso(),
    nextReviewAt: old.nextReviewAt || new Date(nextReviewDate(0)).toISOString()
  };
}
function tagItems(items, planType, limit) {
  const labels = { new: '新词', review: '复习', mistake: '错题' };
  return (items || []).slice(0, limit).map((item, idx) => ({ ...item, id: item.id || item.wordId || item.itemId || `${planType}_${idx}`, text: item.text || item.itemText || item.wordText || '', planType, planLabel: labels[planType] }));
}
function buildDailyPlan({ newWords = [], reviewWords = [], mistakeWords = [] } = {}) {
  const pickedMistakes = tagItems(mistakeWords, 'mistake', DAILY_PLAN.mistakeCount);
  const pickedReviews = tagItems(reviewWords, 'review', DAILY_PLAN.reviewCount);
  const pickedNew = tagItems(newWords, 'new', DAILY_PLAN.newCount);
  const used = new Set([...pickedMistakes, ...pickedReviews, ...pickedNew].map(w => w.id));
  const items = [...pickedNew, ...pickedReviews, ...pickedMistakes];
  const pool = [...newWords, ...reviewWords, ...mistakeWords];
  for (const w of pool) {
    if (items.length >= DAILY_PLAN.total) break;
    const id = w.id || w.wordId || w.itemId || w.text;
    if (!used.has(id)) { used.add(id); items.push({ ...w, id, text: w.text || w.itemText || w.wordText || '', planType: 'new', planLabel: '补充' }); }
  }
  return {
    items,
    total: items.length,
    stats: {
      new: items.filter(i => i.planType === 'new').length,
      review: items.filter(i => i.planType === 'review').length,
      mistake: items.filter(i => i.planType === 'mistake').length
    },
    target: { ...DAILY_PLAN }
  };
}
function summarizeStudySession(items = [], completedCount = 0) {
  const learned = items.slice(0, completedCount);
  return {
    total: items.length,
    completed: learned.length,
    newCount: learned.filter(i => i.planType === 'new').length,
    reviewCount: learned.filter(i => i.planType === 'review').length,
    mistakeCount: learned.filter(i => i.planType === 'mistake').length,
    completionRate: items.length ? Math.round((learned.length / items.length) * 100) : 0,
    finishedAt: nowIso()
  };
}
function toggleFavoriteState(state, word, isFavorite) {
  const id = word.id || word.text;
  const next = clone(state);
  const record = ensureRecord(next, word);
  record.isFavorite = isFavorite;
  next.wordRecords[id] = record;
  next.favorites = next.favorites.filter(f => f.itemId !== id);
  if (isFavorite) next.favorites.unshift({ itemId:id, itemType:'word', itemText:word.text, meaning_cn:word.meaning_cn || '', createdAt:nowIso() });
  next.updatedAt = nowIso();
  return next;
}
function upsertMistake(next, item, wrongAnswer, correctAnswer, itemType = 'word') {
  const id = item.id || item.text;
  const old = next.mistakes.find(m => m.itemId === id && m.itemType === itemType);
  if (old) {
    old.wrongAnswer = wrongAnswer;
    old.correctAnswer = correctAnswer;
    old.wrongCount += 1;
    old.lastWrongAt = nowIso();
    old.isReviewed = false;
  } else {
    next.mistakes.unshift({ itemId:id, itemType, itemText:item.text || item.title || item.question || '', meaning_cn:item.meaning_cn || item.summary || '', wrongAnswer, correctAnswer, wrongCount:1, lastWrongAt:nowIso(), isReviewed:false, reviewCount:0, createdAt:nowIso() });
  }
}
function submitSpellingAnswer(state, word, answer) {
  const next = clone(state);
  const id = word.id || word.text;
  const record = ensureRecord(next, word);
  const isCorrect = checkSpelling(answer, word.text);
  if (isCorrect) {
    record.correctCount += 1;
    record.familiarity = Math.min(100, record.familiarity + 25);
    record.status = record.familiarity >= 80 ? 'mastered' : 'review';
    record.nextReviewAt = new Date(nextReviewDate(record.familiarity)).toISOString();
  } else {
    record.wrongCount += 1;
    record.familiarity = Math.max(0, record.familiarity - 15);
    record.status = 'learning';
    record.isInMistakeBook = true;
    record.nextReviewAt = new Date(nextReviewDate(record.familiarity)).toISOString();
    upsertMistake(next, word, answer, word.text, 'word');
  }
  next.wordRecords[id] = record;
  next.sessions.unshift({ sessionType:'spelling', itemId:id, userAnswer:answer, correctAnswer:word.text, isCorrect, createdAt:nowIso() });
  next.updatedAt = nowIso();
  return { isCorrect, state: next, record };
}
function submitGrammarAnswer(state, topic, practice, answer) {
  const next = clone(state);
  const correctAnswer = practice.answer || practice.correctAnswer;
  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(correctAnswer);
  const itemId = practice.id || `${topic.id}_${practice.question}`;
  if (!isCorrect) {
    upsertMistake(next, { id: itemId, title: topic.title, question: practice.question, summary: practice.explanation }, answer, correctAnswer, 'grammar');
  }
  next.sessions.unshift({ sessionType:'grammar', topicId:topic.id, itemId, userAnswer:answer, correctAnswer, isCorrect, createdAt:nowIso() });
  next.updatedAt = nowIso();
  return { isCorrect, state: next };
}
function markMistakeReviewed(state, itemId) {
  const next = clone(state);
  const item = next.mistakes.find(m => m.itemId === itemId);
  if (item) { item.isReviewed = true; item.reviewCount += 1; item.reviewedAt = nowIso(); }
  next.updatedAt = nowIso();
  return next;
}
module.exports = { DAILY_PLAN, createInitialState, buildDailyPlan, summarizeStudySession, toggleFavoriteState, submitSpellingAnswer, submitGrammarAnswer, markMistakeReviewed };
