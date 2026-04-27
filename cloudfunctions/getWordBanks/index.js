const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const fallbackWordBanks = [
  { id:'cet4_core', code:'cet4', name:'CET-4 核心词汇', totalWords:3846, tags:['四级核心','高频'] },
  { id:'cet6_core', code:'cet6', name:'CET-6 核心词汇', totalWords:1956, tags:['六级新增','进阶'] }
];
function ok(data){ return { success:true, data }; }
exports.main = async () => {
  try {
    const res = await db.collection('word_banks').where({isActive:true}).limit(20).get();
    const rows = res.data.length ? res.data : fallbackWordBanks;
    return ok(rows.map(({ learnedWords, masteredWords, ...bank }) => bank));
  } catch(e) {
    return ok(fallbackWordBanks);
  }
};
