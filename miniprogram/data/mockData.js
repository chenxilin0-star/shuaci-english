const wordBanks = [
  { id:'cet4_core', code:'cet4', name:'CET-4 核心词汇', totalWords:4500, learnedWords:326, color:'#4A90E2', tags:['四级必过','高频'], description:'覆盖四级核心高频词，适合考前系统刷词。' },
  { id:'cet6_core', code:'cet6', name:'CET-6 核心词汇', totalWords:5500, learnedWords:128, color:'#7B6AD7', tags:['六级拔高','进阶'], description:'六级新增词与高频词，默认跳过四级重叠词。' }
];
const words = [
  { id:'w001', bankId:'cet4_core', text:'abandon', phonetic_us:'/əˈbændən/', pos:'v.', meaning_cn:'放弃；抛弃', example_sentence:'He abandoned his car and ran for help.', example_cn:'他弃车跑去求助。', difficulty_level:2, frequency_tag:'high', isFavorite:false },
  { id:'w002', bankId:'cet4_core', text:'benefit', phonetic_us:'/ˈbenɪfɪt/', pos:'n./v.', meaning_cn:'益处；使受益', example_sentence:'Regular review will benefit your vocabulary memory.', example_cn:'定期复习有利于词汇记忆。', difficulty_level:1, frequency_tag:'high', isFavorite:true },
  { id:'w003', bankId:'cet4_core', text:'consequence', phonetic_us:'/ˈkɑːnsəkwens/', pos:'n.', meaning_cn:'结果；后果', example_sentence:'Every choice has a consequence.', example_cn:'每个选择都有后果。', difficulty_level:3, frequency_tag:'medium', isFavorite:false },
  { id:'w101', bankId:'cet6_core', text:'ambiguous', phonetic_us:'/æmˈbɪɡjuəs/', pos:'adj.', meaning_cn:'模棱两可的；含糊的', example_sentence:'The instructions were ambiguous and confusing.', example_cn:'说明含糊不清，令人困惑。', difficulty_level:3, frequency_tag:'medium', cet6_new:true },
  { id:'w102', bankId:'cet6_core', text:'sustainable', phonetic_us:'/səˈsteɪnəbl/', pos:'adj.', meaning_cn:'可持续的', example_sentence:'We need sustainable economic growth.', example_cn:'我们需要可持续的经济增长。', difficulty_level:3, frequency_tag:'high', cet6_new:true }
];
const grammarTopics = [
  { id:'g001', title:'现在完成时', category:'时态语态', frequency:'高频', summary:'强调过去动作对现在的影响。', content:'结构：have/has + done。常与 already, yet, since, for 连用。', examples:[{en:'I have finished my homework.', cn:'我已经完成作业了。'}] },
  { id:'g002', title:'定语从句', category:'从句', frequency:'高频', summary:'用来修饰名词或代词。', content:'关系词 who/which/that/where/when 引导从句。', examples:[{en:'This is the book that I bought yesterday.', cn:'这是我昨天买的书。'}] },
  { id:'g003', title:'虚拟语气', category:'特殊句式', frequency:'中频', summary:'表达与事实相反或主观愿望。', content:'If I were you, I would review words every day.', examples:[{en:'If I were you, I would start now.', cn:'如果我是你，我会现在开始。'}] }
];
const readingPassages = [{ id:'r001', title:'The Habit of Review', category:'cet4', difficulty:2, passageText:'Vocabulary learning is not about memorizing a long list once. Effective learners review words repeatedly and use them in context. Short daily sessions often work better than a single long session before an exam.', questions:[{ id:'q1', questionText:'What is the main idea of the passage?', options:{A:'Long lists are enough', B:'Review and context improve vocabulary learning', C:'Exams are easy', D:'Daily learning is useless'}, correctAnswer:'B', explanation:'文章强调重复复习和语境使用。'}] }];
module.exports = { wordBanks, words, grammarTopics, readingPassages };
