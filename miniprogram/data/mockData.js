const wordBanks = [
  { id:'cet4_core', code:'cet4', name:'CET-4 核心词汇', totalWords:3846, color:'#4A90E2', tags:['四级核心','高频'], description:'覆盖四级核心高频词，适合考前系统刷词。' },
  { id:'cet6_core', code:'cet6', name:'CET-6 核心词汇', totalWords:1956, color:'#7B6AD7', tags:['六级新增','进阶'], description:'六级新增词与高频词，默认跳过四级重叠词。' }
];
const words = [
  { id:'w001', bankId:'cet4_core', bankIds:['cet4_core'], is_in_cet4:true, text:'abandon', phonetic_us:'/əˈbændən/', pos:'v.', meaning_cn:'放弃；抛弃', example_sentence:'He abandoned his car and ran for help.', example_cn:'他弃车跑去求助。', difficulty_level:2, frequency_tag:'high', isFavorite:false },
  { id:'w002', bankId:'cet4_core', bankIds:['cet4_core'], is_in_cet4:true, text:'benefit', phonetic_us:'/ˈbenɪfɪt/', pos:'n./v.', meaning_cn:'益处；使受益', example_sentence:'Regular review will benefit your vocabulary memory.', example_cn:'定期复习有利于词汇记忆。', difficulty_level:1, frequency_tag:'high', isFavorite:false },
  { id:'w003', bankId:'cet4_core', bankIds:['cet4_core'], is_in_cet4:true, text:'consequence', phonetic_us:'/ˈkɑːnsəkwens/', pos:'n.', meaning_cn:'结果；后果', example_sentence:'Every choice has a consequence.', example_cn:'每个选择都有后果。', difficulty_level:3, frequency_tag:'medium', isFavorite:false },
  { id:'w101', bankId:'cet6_core', bankIds:['cet6_core'], is_in_cet6:true, cet6_new:true, text:'ambiguous', phonetic_us:'/æmˈbɪɡjuəs/', pos:'adj.', meaning_cn:'模棱两可的；含糊的', example_sentence:'The instructions were ambiguous and confusing.', example_cn:'说明含糊不清，令人困惑。', difficulty_level:3, frequency_tag:'medium' },
  { id:'w102', bankId:'cet6_core', bankIds:['cet6_core'], is_in_cet6:true, cet6_new:true, text:'sustainable', phonetic_us:'/səˈsteɪnəbl/', pos:'adj.', meaning_cn:'可持续的', example_sentence:'We need sustainable economic growth.', example_cn:'我们需要可持续的经济增长。', difficulty_level:3, frequency_tag:'high' }
];
const grammarTopics = require('./grammarTopics');
const readingPassages = [{ id:'r001', title:'The Habit of Review', category:'cet4', difficulty:2, passageText:'Vocabulary learning is not about memorizing a long list once. Effective learners review words repeatedly and use them in context. Short daily sessions often work better than a single long session before an exam.', questions:[{ id:'q1', questionText:'What is the main idea of the passage?', options:{A:'Long lists are enough', B:'Review and context improve vocabulary learning', C:'Exams are easy', D:'Daily learning is useless'}, correctAnswer:'B', explanation:'文章强调重复复习和语境使用。'}] }];
module.exports = { wordBanks, words, grammarTopics, readingPassages };
