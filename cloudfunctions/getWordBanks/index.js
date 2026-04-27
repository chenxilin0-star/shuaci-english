const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const mock = {
  wordBanks: [
    { id:'cet4_core', code:'cet4', name:'CET-4 核心词汇', totalWords:4500, learnedWords:326, tags:['四级必过','高频'] },
    { id:'cet6_core', code:'cet6', name:'CET-6 核心词汇', totalWords:5500, learnedWords:128, tags:['六级拔高','进阶'] }
  ],
  words: [
    { id:'w001', bankId:'cet4_core', text:'abandon', phonetic_us:'/əˈbændən/', pos:'v.', meaning_cn:'放弃；抛弃', example_sentence:'He abandoned his car and ran for help.' },
    { id:'w002', bankId:'cet4_core', text:'benefit', phonetic_us:'/ˈbenɪfɪt/', pos:'n./v.', meaning_cn:'益处；使受益', example_sentence:'Regular review will benefit your memory.' },
    { id:'w101', bankId:'cet6_core', text:'ambiguous', phonetic_us:'/æmˈbɪɡjuəs/', pos:'adj.', meaning_cn:'模棱两可的', example_sentence:'The instructions were ambiguous.' }
  ],
  grammarTopics: [{ id:'g001', title:'现在完成时', category:'时态语态', frequency:'高频', summary:'强调过去动作对现在的影响。' }]
};
function ok(data){ return { success:true, data }; }
function fail(err, data){ return { success:false, error: err && err.message ? err.message : String(err), data }; }

exports.main = async () => { try { const res = await db.collection('word_banks').where({isActive:true}).limit(20).get(); return ok(res.data.length ? res.data : mock.wordBanks); } catch(e) { return ok(mock.wordBanks); } };
