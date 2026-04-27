const { checkSpelling, nextReviewDate } = require('./study');
function nowIso() { return new Date().toISOString(); }
function createInitialState(openid = 'local-user') {
  return { openid, wordRecords: {}, favorites: [], mistakes: [], sessions: [], updatedAt: nowIso() };
}
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
function toggleFavoriteState(state, word, isFavorite) {
  const id = word.id || word.text;
  const next = JSON.parse(JSON.stringify(state || createInitialState()));
  const record = ensureRecord(next, word);
  record.isFavorite = isFavorite;
  next.wordRecords[id] = record;
  next.favorites = next.favorites.filter(f => f.itemId !== id);
  if (isFavorite) next.favorites.unshift({ itemId:id, itemType:'word', itemText:word.text, meaning_cn:word.meaning_cn || '', createdAt:nowIso() });
  next.updatedAt = nowIso();
  return next;
}
function upsertMistake(next, word, wrongAnswer, correctAnswer) {
  const id = word.id || word.text;
  const old = next.mistakes.find(m => m.itemId === id);
  if (old) {
    old.wrongAnswer = wrongAnswer;
    old.correctAnswer = correctAnswer;
    old.wrongCount += 1;
    old.lastWrongAt = nowIso();
    old.isReviewed = false;
  } else {
    next.mistakes.unshift({ itemId:id, itemType:'word', itemText:word.text, meaning_cn:word.meaning_cn || '', wrongAnswer, correctAnswer, wrongCount:1, lastWrongAt:nowIso(), isReviewed:false, reviewCount:0, createdAt:nowIso() });
  }
}
function submitSpellingAnswer(state, word, answer) {
  const next = JSON.parse(JSON.stringify(state || createInitialState()));
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
    upsertMistake(next, word, answer, word.text);
  }
  next.wordRecords[id] = record;
  next.sessions.unshift({ sessionType:'spelling', itemId:id, userAnswer:answer, correctAnswer:word.text, isCorrect, createdAt:nowIso() });
  next.updatedAt = nowIso();
  return { isCorrect, state: next, record };
}
function markMistakeReviewed(state, itemId) {
  const next = JSON.parse(JSON.stringify(state || createInitialState()));
  const item = next.mistakes.find(m => m.itemId === itemId);
  if (item) { item.isReviewed = true; item.reviewCount += 1; item.reviewedAt = nowIso(); }
  next.updatedAt = nowIso();
  return next;
}
module.exports = { createInitialState, toggleFavoriteState, submitSpellingAnswer, markMistakeReviewed };
