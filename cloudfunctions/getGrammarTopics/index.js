const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const mockGrammarTopics = require('./grammar_topics.json');
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  const limit = Math.min(Number(event.limit || 100), 200);
  const where = event.category && event.category !== '全部' ? { category:event.category } : {};
  try {
    const res = await db.collection('grammar_topics').where(where).limit(limit).get();
    const data = res.data.length ? res.data : mockGrammarTopics.filter(t => !where.category || t.category === where.category).slice(0, limit);
    return ok(data);
  } catch(e) {
    return ok(mockGrammarTopics.filter(t => !where.category || t.category === where.category).slice(0, limit));
  }
};
