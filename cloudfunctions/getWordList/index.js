const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const mock = {
  words: [
    { id:'w001', bankId:'cet4_core', bankIds:['cet4_core'], is_in_cet4:true, text:'abandon', phonetic_us:'/əˈbændən/', pos:'v.', meaning_cn:'放弃；抛弃', example_sentence:'He abandoned his car and ran for help.' },
    { id:'w002', bankId:'cet4_core', bankIds:['cet4_core'], is_in_cet4:true, text:'benefit', phonetic_us:'/ˈbenɪfɪt/', pos:'n./v.', meaning_cn:'益处；使受益', example_sentence:'Regular review will benefit your memory.' },
    { id:'w101', bankId:'cet6_core', bankIds:['cet6_core'], is_in_cet6:true, cet6_new:true, text:'ambiguous', phonetic_us:'/æmˈbɪɡjuəs/', pos:'adj.', meaning_cn:'模棱两可的', example_sentence:'The instructions were ambiguous.' },
    { id:'w102', bankId:'cet6_core', bankIds:['cet6_core'], is_in_cet6:true, cet6_new:true, text:'sustainable', phonetic_us:'/səˈsteɪnəbl/', pos:'adj.', meaning_cn:'可持续的', example_sentence:'We need sustainable growth.' }
  ]
};
const BANK_TOTALS = {
  cet4_core: 3846,
  cet6_core: 1956
};
function ok(data, meta = {}){ return { success:true, data, meta }; }
function dayIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}
function dailySkip(bankId, limit, event = {}) {
  if (Number.isFinite(Number(event.skip))) return Math.max(0, Number(event.skip));
  if (event.mode !== 'daily') return 0;
  const total = BANK_TOTALS[bankId] || 1000;
  const seed = Number(event.dayIndex || dayIndex());
  return (seed * limit) % Math.max(limit, total - limit);
}
function bankIdToWhere(bankId, event = {}) {
  if (bankId === 'cet4_core' || bankId === 'cet4') return { is_in_cet4: true };
  // 六级优先学习 CET-6 新增词，避免一进来全是四级/六级重叠词。
  if (bankId === 'cet6_core' || bankId === 'cet6') return event.includeOverlap ? { is_in_cet6: true } : { is_in_cet6: true, cet6_new: true };
  return bankId ? { bankId } : {};
}
function inMockBank(word, bankId, includeOverlap) {
  if (!bankId) return true;
  if (bankId === 'cet4_core' || bankId === 'cet4') return word.is_in_cet4 || word.bankId === 'cet4_core';
  if (bankId === 'cet6_core' || bankId === 'cet6') return includeOverlap ? (word.is_in_cet6 || word.bankId === 'cet6_core') : !!word.cet6_new;
  return word.bankId === bankId || (word.bankIds || []).includes(bankId);
}
exports.main = async (event = {}) => {
  const bankId = event.bankId || 'cet4_core';
  const limit = Math.min(Number(event.limit || 50), 100);
  const skip = dailySkip(bankId, limit, event);
  const where = bankIdToWhere(bankId, event);
  try {
    let res = await db.collection('words').where(where).skip(skip).limit(limit).get();
    // 如果今日 skip 接近末尾导致不足，则从开头补齐；如果六级新增词为空，则回退到全部六级词。
    if (res.data.length < limit && skip > 0) {
      const head = await db.collection('words').where(where).limit(limit - res.data.length).get();
      res.data = res.data.concat(head.data);
    }
    if (!res.data.length && (bankId === 'cet6_core' || bankId === 'cet6') && !event.includeOverlap) {
      const fallback = await db.collection('words').where({ is_in_cet6: true }).skip(skip).limit(limit).get();
      res = fallback;
    }
    return ok(res.data.length ? res.data : mock.words.filter(w => inMockBank(w, bankId, event.includeOverlap)), { bankId, limit, skip, mode:event.mode || 'default', includeOverlap:!!event.includeOverlap });
  } catch(e) {
    return ok(mock.words.filter(w => inMockBank(w, bankId, event.includeOverlap)), { bankId, fallback:true, error:e.message });
  }
};
