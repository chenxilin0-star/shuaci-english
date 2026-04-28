const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
function todayKey(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const emptyProgress = { learnedWords:0, masteredWords:0, todayGoal:50, todayLearned:0, streakDays:0, currentIndex:0, favoriteCount:0, mistakeCount:0 };
function streakFromRows(rows){
  const days = new Set((rows || []).map(r => todayKey(r.date || r.createdAt)).filter(Boolean));
  let streak = 0;
  const d = new Date();
  while (days.has(todayKey(d))) { streak += 1; d.setDate(d.getDate() - 1); }
  return streak;
}
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'local-user';
  try {
    const [progress, records, mistakes, favorites, checkins] = await Promise.all([
      db.collection('user_progress').where({ openid }).orderBy('updatedAt','desc').limit(1).get(),
      db.collection('user_word_records').where({ openid }).limit(1000).get(),
      db.collection('mistake_books').where({ openid, isReviewed:false }).limit(1000).get(),
      db.collection('favorites').where({ openid, isFavorite:true }).limit(1000).get(),
      db.collection('checkins').where({ openid }).limit(366).get()
    ]);
    const latest = progress.data[0] || {};
    const today = todayKey();
    const learnedWords = records.data.length;
    const masteredWords = records.data.filter(r => r.status === 'mastered' || Number(r.familiarity || 0) >= 80).length;
    const todayLearned = records.data.filter(r => String(r.lastStudyAt || r.updatedAt || '').slice(0,10) === today).length;
    return ok({
      ...emptyProgress,
      currentIndex: latest.currentIndex || 0,
      todayGoal: latest.todayGoal || emptyProgress.todayGoal,
      learnedWords,
      masteredWords,
      todayLearned,
      favoriteCount:favorites.data.length,
      mistakeCount:mistakes.data.length,
      streakDays: Math.max(streakFromRows(checkins.data), latest.streakDays || 0),
      updatedAt: latest.updatedAt || null
    });
  } catch(e) { return ok(emptyProgress); }
};
