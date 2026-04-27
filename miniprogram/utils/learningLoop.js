const { checkSpelling, nextReviewDate } = require('./study');

const MODE_PLANS = {
  daily: { newCount: 35, reviewCount: 10, mistakeCount: 5, total: 50 },
  review: { newCount: 0, reviewCount: 40, mistakeCount: 10, total: 50 },
  mistake: { newCount: 0, reviewCount: 0, mistakeCount: 50, total: 50 }
};
const DAILY_PLAN = MODE_PLANS.daily;

function nowIso() { return new Date().toISOString(); }
function todayKey(date = new Date()) { return date.toISOString().slice(0, 10); }
function createInitialState(openid = 'local-user') {
  return { openid, wordRecords: {}, favorites: [], mistakes: [], sessions: [], checkins: [], updatedAt: nowIso() };
}
function clone(state) { return JSON.parse(JSON.stringify(state || createInitialState())); }
function normalizeAnswer(v) { return String(v || '').trim().toLowerCase(); }
function normalizeMode(mode) { return MODE_PLANS[mode] ? mode : 'daily'; }
function ensureRecord(state, word) {
  const id = word.id || word.text;
  const old = state.wordRecords[id] || {};
  return {
    wordId: id,
    wordText: word.text || old.wordText || '',
    bankId: word.bankId || old.bankId || ((word.bankIds || old.bankIds || [])[0]) || '',
    bankIds: word.bankIds || old.bankIds || (word.bankId ? [word.bankId] : []),
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
function getItemId(item, idx, planType) { return item.id || item.wordId || item.itemId || item.text || `${planType}_${idx}`; }
function tagItems(items, planType, limit, used = new Set()) {
  const labels = { new: '新词', review: '复习', mistake: '错题', supplement: '补充' };
  const out = [];
  for (const item of items || []) {
    if (out.length >= limit) break;
    const id = getItemId(item, out.length, planType);
    if (used.has(id)) continue;
    used.add(id);
    out.push({ ...item, id, text: item.text || item.itemText || item.wordText || '', planType, planLabel: labels[planType] });
  }
  return out;
}
function fillShortage(items, pools, used, targetTotal, fallbackType = 'supplement') {
  const fallbackLabels = { new: '补充新词', review: '补充复习', mistake: '补充错题', supplement: '补充' };
  for (const pool of pools) {
    for (const item of pool || []) {
      if (items.length >= targetTotal) return items;
      const id = getItemId(item, items.length, fallbackType);
      if (used.has(id)) continue;
      used.add(id);
      items.push({ ...item, id, text: item.text || item.itemText || item.wordText || '', planType: fallbackType, planLabel: fallbackLabels[fallbackType] || '补充' });
    }
  }
  return items;
}
function buildStudyPlan({ mode = 'daily', newWords = [], reviewWords = [], mistakeWords = [] } = {}) {
  const normalizedMode = normalizeMode(mode);
  const target = MODE_PLANS[normalizedMode];
  const used = new Set();
  let items = [];
  if (normalizedMode === 'mistake') {
    items = items.concat(tagItems(mistakeWords, 'mistake', target.mistakeCount, used));
    fillShortage(items, [reviewWords, newWords], used, target.total, 'supplement');
  } else if (normalizedMode === 'review') {
    items = items.concat(tagItems(reviewWords, 'review', target.reviewCount, used));
    items = items.concat(tagItems(mistakeWords, 'mistake', target.mistakeCount, used));
    fillShortage(items, [reviewWords, mistakeWords, newWords], used, target.total, 'supplement');
  } else {
    items = items.concat(tagItems(newWords, 'new', target.newCount, used));
    items = items.concat(tagItems(reviewWords, 'review', target.reviewCount, used));
    items = items.concat(tagItems(mistakeWords, 'mistake', target.mistakeCount, used));
    fillShortage(items, [newWords, reviewWords, mistakeWords], used, target.total, 'supplement');
  }
  const finalItems = items.slice(0, target.total);
  return {
    mode: normalizedMode,
    items: finalItems,
    total: finalItems.length,
    stats: {
      new: finalItems.filter(i => i.planType === 'new').length,
      review: finalItems.filter(i => i.planType === 'review').length,
      mistake: finalItems.filter(i => i.planType === 'mistake').length,
      supplement: finalItems.filter(i => i.planType === 'supplement').length
    },
    target: { ...target }
  };
}
function buildDailyPlan(args = {}) { return buildStudyPlan({ ...args, mode: 'daily' }); }
function summarizeStudySession(items = [], completedCount = 0) {
  const learned = items.slice(0, completedCount);
  return {
    total: items.length,
    completed: learned.length,
    newCount: learned.filter(i => i.planType === 'new').length,
    reviewCount: learned.filter(i => i.planType === 'review').length,
    mistakeCount: learned.filter(i => i.planType === 'mistake').length,
    supplementCount: learned.filter(i => i.planType === 'supplement').length,
    completionRate: items.length ? Math.round((learned.length / items.length) * 100) : 0,
    finishedAt: nowIso()
  };
}
function getLearningStats(state = createInitialState()) {
  const records = Object.values(state.wordRecords || {});
  const learnedWords = records.length;
  const masteredWords = records.filter(r => r.status === 'mastered' || (r.familiarity || 0) >= 80).length;
  const reviewWords = records.filter(r => r.status === 'review' || r.status === 'mastered').length;
  const mistakeCount = (state.mistakes || []).filter(m => !m.isReviewed).length;
  const favoriteCount = (state.favorites || []).length;
  const today = todayKey();
  const todaySessions = (state.sessions || []).filter(s => String(s.createdAt || '').slice(0, 10) === today);
  const todayLearned = new Set(todaySessions.filter(s => s.itemId).map(s => s.itemId)).size;
  const streakDays = computeStreakDays(state);
  return {
    learnedWords,
    masteredWords,
    reviewWords,
    mistakeCount,
    favoriteCount,
    todayLearned,
    todayGoal: DAILY_PLAN.total,
    streakDays,
    completionPercent: DAILY_PLAN.total ? Math.min(100, Math.round((todayLearned / DAILY_PLAN.total) * 100)) : 0,
    totalSessions: (state.sessions || []).length,
    lastStudyAt: records.map(r => r.lastStudyAt).filter(Boolean).sort().pop() || ''
  };
}
function getBankProgress(state = createInitialState(), bankId) {
  const records = Object.values(state.wordRecords || {});
  const bankRecords = bankId ? records.filter(r => r.bankId === bankId || (r.bankIds || []).includes(bankId)) : records;
  return {
    learnedWords: bankRecords.length,
    masteredWords: bankRecords.filter(r => r.status === 'mastered' || (r.familiarity || 0) >= 80).length,
    reviewWords: bankRecords.filter(r => r.status === 'review' || r.status === 'mastered').length,
    percentOf(recordsTotal) { return recordsTotal ? Math.min(100, Math.round((bankRecords.length / recordsTotal) * 100)) : 0; }
  };
}
function computeStreakDays(state = createInitialState()) {
  const days = new Set([
    ...(state.checkins || []).map(c => String(c.date || c.createdAt || '').slice(0, 10)),
    ...(state.sessions || []).map(s => String(s.createdAt || '').slice(0, 10))
  ].filter(Boolean));
  let streak = 0;
  const date = new Date();
  while (days.has(todayKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
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
function markWordStudied(state, word, planType = 'new') {
  const next = clone(state);
  const id = word.id || word.text;
  const record = ensureRecord(next, word);
  record.correctCount += 1;
  record.lastStudyAt = nowIso();
  record.familiarity = Math.min(100, record.familiarity + (planType === 'review' ? 15 : 20));
  record.status = record.familiarity >= 80 ? 'mastered' : 'review';
  record.nextReviewAt = new Date(nextReviewDate(record.familiarity)).toISOString();
  next.wordRecords[id] = record;
  next.sessions.unshift({ sessionType:'word-card', itemId:id, bankId:record.bankId, planType, isCorrect:true, createdAt:nowIso() });
  next.updatedAt = nowIso();
  return next;
}
function listReviewCandidates(state) {
  const records = Object.values((state || createInitialState()).wordRecords || {});
  return records
    .filter(r => r.status === 'review' || r.status === 'mastered')
    .sort((a, b) => String(a.nextReviewAt || '').localeCompare(String(b.nextReviewAt || '')))
    .map(r => ({ id:r.wordId, text:r.wordText, wordText:r.wordText, bankId:r.bankId, bankIds:r.bankIds, planType:'review', planLabel:'复习' }));
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
  next.sessions.unshift({ sessionType:'spelling', itemId:id, bankId:record.bankId, userAnswer:answer, correctAnswer:word.text, isCorrect, createdAt:nowIso() });
  next.updatedAt = nowIso();
  return { isCorrect, state: next, record };
}
function submitGrammarAnswer(state, topic, practice, answer) {
  const next = clone(state);
  const correctAnswer = practice.answer || practice.correctAnswer;
  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(correctAnswer);
  const itemId = practice.id || `${topic.id}_${practice.question}`;
  if (!isCorrect) upsertMistake(next, { id: itemId, title: topic.title, question: practice.question, summary: practice.explanation }, answer, correctAnswer, 'grammar');
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
function checkinState(state) {
  const next = clone(state);
  const date = todayKey();
  next.checkins = (next.checkins || []).filter(c => c.date !== date);
  next.checkins.unshift({ date, createdAt: nowIso() });
  next.updatedAt = nowIso();
  return next;
}
module.exports = { MODE_PLANS, DAILY_PLAN, createInitialState, buildStudyPlan, buildDailyPlan, summarizeStudySession, getLearningStats, getBankProgress, toggleFavoriteState, markWordStudied, listReviewCandidates, submitSpellingAnswer, submitGrammarAnswer, markMistakeReviewed, checkinState };
