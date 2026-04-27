const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const mock = {
  words: [
    { id:'w001', bankId:'cet4_core', bankIds:['cet4_core'], is_in_cet4:true, text:'abandon', phonetic_us:'/əˈbændən/', pos:'v.', meaning_cn:'放弃；抛弃', example_sentence:'He abandoned his car and ran for help.' },
    { id:'w002', bankId:'cet4_core', bankIds:['cet4_core'], is_in_cet4:true, text:'benefit', phonetic_us:'/ˈbenɪfɪt/', pos:'n./v.', meaning_cn:'益处；使受益', example_sentence:'Regular review will benefit your memory.' },
    { id:'w101', bankId:'cet6_core', bankIds:['cet6_core'], is_in_cet6:true, text:'ambiguous', phonetic_us:'/æmˈbɪɡjuəs/', pos:'adj.', meaning_cn:'模棱两可的', example_sentence:'The instructions were ambiguous.' }
  ]
};
function ok(data){ return { success:true, data }; }
function bankIdToWhere(bankId) {
  if (bankId === 'cet4_core' || bankId === 'cet4') return { is_in_cet4: true };
  if (bankId === 'cet6_core' || bankId === 'cet6') return { is_in_cet6: true };
  return bankId ? { bankId } : {};
}
function inMockBank(word, bankId) {
  if (!bankId) return true;
  if (bankId === 'cet4_core' || bankId === 'cet4') return word.is_in_cet4 || word.bankId === 'cet4_core';
  if (bankId === 'cet6_core' || bankId === 'cet6') return word.is_in_cet6 || word.bankId === 'cet6_core';
  return word.bankId === bankId || (word.bankIds || []).includes(bankId);
}
exports.main = async (event = {}) => {
  const where = bankIdToWhere(event.bankId);
  const limit = Math.min(Number(event.limit || 50), 100);
  const skip = Number(event.skip || 0);
  try {
    const query = db.collection('words').where(where).skip(skip).limit(limit);
    const res = await query.get();
    return ok(res.data.length ? res.data : mock.words.filter(w => inMockBank(w, event.bankId)));
  } catch(e) {
    return ok(mock.words.filter(w => inMockBank(w, event.bankId)));
  }
};
