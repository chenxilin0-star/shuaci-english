#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const input = process.argv.find(a => a.startsWith('--input='))?.split('=')[1] || 'data/samples/ecdict_sample.csv';
const output = process.argv.find(a => a.startsWith('--output='))?.split('=')[1] || 'data/processed/cet_words.sample.json';

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quote && next === '"') { cell += '"'; i++; continue; }
    if (ch === '"') { quote = !quote; continue; }
    if (ch === ',' && !quote) { row.push(cell); cell = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !quote) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell || row.length) { row.push(cell); if (row.some(v => v.trim())) rows.push(row); }
  const header = rows.shift().map(h => h.trim());
  return rows.map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])));
}
function difficulty(row) {
  const rank = Number(row.frq || row.bnc || 99999);
  const lengthScore = Math.min(1, (row.word || '').length / 14);
  const posScore = Math.min(1, String(row.pos || '').split(/[\/;]/).filter(Boolean).length / 4);
  const collins = Number(row.collins || 0);
  const rankScore = rank <= 2000 ? 0.1 : rank <= 6000 ? 0.35 : rank <= 12000 ? 0.65 : 0.9;
  const collinsScore = collins ? (5 - collins) / 5 : 0.7;
  const score = 0.4 * rankScore + 0.15 * lengthScore + 0.2 * posScore + 0.25 * collinsScore;
  return score < 0.25 ? 1 : score < 0.5 ? 2 : score < 0.75 ? 3 : 4;
}
function frequencyTag(row) {
  const rank = Number(row.frq || row.bnc || 99999);
  return rank <= 3000 ? 'high' : rank <= 10000 ? 'medium' : 'low';
}
function defaultGrammarTopics() {
  const rows = [
    ['g_present_perfect','现在完成时','时态语态','高频','have/has + done，强调过去动作对现在的影响。','I have finished my homework.','我已经完成作业了。'],
    ['g_passive_voice','被动语态','时态语态','高频','be + done，强调动作承受者。','The book was written by a famous scholar.','这本书由一位著名学者撰写。'],
    ['g_attributive_clause','定语从句','从句','高频','用 who/which/that/where 等关系词修饰名词。','This is the book that I bought yesterday.','这是我昨天买的书。'],
    ['g_adverbial_clause','状语从句','从句','高频','表示时间、条件、原因、让步等逻辑关系。','Although it was raining, they kept studying.','尽管下雨，他们仍继续学习。'],
    ['g_nonfinite_to_do','不定式','非谓语动词','高频','to do 可作主语、宾语、定语、状语。','To improve vocabulary, you need daily review.','为了提高词汇量，你需要每日复习。'],
    ['g_gerund','动名词','非谓语动词','中频','doing 可作名词性成分。','Reading English every day is helpful.','每天阅读英语很有帮助。'],
    ['g_subjunctive','虚拟语气','特殊句式','中频','表达非真实条件、愿望或建议。','If I were you, I would start now.','如果我是你，我会现在开始。'],
    ['g_inversion','倒装句','特殊句式','中频','否定词或 only 位于句首时常用部分倒装。','Never have I seen such progress.','我从未见过这样的进步。'],
    ['g_emphasis','强调句','特殊句式','中频','It is/was ... that/who ... 强调句子成分。','It was practice that made the difference.','正是练习带来了不同。'],
    ['g_modal_verbs','情态动词','词法','高频','must/may/might/could 表推测、能力或许可。','You must review the words before the test.','考试前你必须复习单词。'],
    ['g_preposition_collocation','介词搭配','词汇搭配','高频','常见动词/形容词与介词固定搭配。','She is good at memorizing new words.','她擅长记新单词。'],
    ['g_comparative','比较级与最高级','词法','中频','用于比较两者或三者以上。','This method is more effective than rote learning.','这种方法比死记硬背更有效。']
  ];
  return rows.map((r, i) => ({ id:r[0], title:r[1], category:r[2], frequency:r[3], summary:r[4], content:r[4], examples:[{ en:r[5], cn:r[6] }], order:i + 1, isActive:true, createdAt:new Date().toISOString() }));
}
function clean() {
  const csvPath = path.join(root, input);
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const map = new Map();
  for (const row of rows) {
    const text = String(row.word || '').trim().toLowerCase();
    if (!text || /[^a-z\- ]/.test(text)) continue;
    const tag = String(row.tag || '').toLowerCase();
    const is4 = /\bcet4\b/.test(tag);
    const is6 = /\bcet6\b/.test(tag);
    if (!is4 && !is6) continue;
    const old = map.get(text);
    const item = old || {
      id: `w_${text.replace(/[^a-z0-9]+/g, '_')}`,
      text,
      phonetic_us: row.phonetic ? `/${row.phonetic.replace(/^\/+|\/+$/g, '')}/` : '',
      phonetic_uk: row.phonetic ? `/${row.phonetic.replace(/^\/+|\/+$/g, '')}/` : '',
      pos: row.pos || '',
      meaning_cn: row.translation || row.definition || '',
      meanings: [],
      example_sentence: '',
      difficulty_level: difficulty(row),
      frequency_tag: frequencyTag(row),
      bnc_rank: Number(row.bnc || 0),
      coca_rank: Number(row.frq || 0),
      collins_stars: Number(row.collins || 0),
      is_in_cet4: false,
      is_in_cet6: false,
      cet6_new: false,
      bankIds: [],
      tags: []
    };
    item.is_in_cet4 = item.is_in_cet4 || is4;
    item.is_in_cet6 = item.is_in_cet6 || is6;
    item.cet6_new = item.is_in_cet6 && !item.is_in_cet4;
    item.bankIds = [...new Set([...(item.bankIds || []), ...(is4 ? ['cet4_core'] : []), ...(is6 ? ['cet6_core'] : [])])];
    item.tags = [...new Set([...item.tags, ...(is4 ? ['cet4'] : []), ...(is6 ? ['cet6'] : [])])];
    if (row.pos || row.translation) item.meanings.push({ pos: row.pos || '', definition: row.translation || row.definition || '' });
    map.set(text, item);
  }
  const words = [...map.values()].sort((a,b) => a.text.localeCompare(b.text));
  const wordBanks = [
    { id:'cet4_core', code:'cet4', name:'CET-4 核心词汇', category:'cet4', totalWords:words.filter(w=>w.is_in_cet4).length, isActive:true, sortOrder:1, description:'大学英语四级核心高频词汇' },
    { id:'cet6_core', code:'cet6', name:'CET-6 核心词汇', category:'cet6', totalWords:words.filter(w=>w.is_in_cet6).length, isActive:true, sortOrder:2, description:'大学英语六级核心与新增词汇' }
  ];
  const payload = { generatedAt: new Date().toISOString(), source: input, wordBanks, words, grammarTopics: defaultGrammarTopics(), readingPassages: [] };
  const outPath = path.join(root, output);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`cleaned ${words.length} CET words, ${payload.grammarTopics.length} grammar topics -> ${output}`);
}
if (require.main === module) clean();
module.exports = { parseCsv, difficulty, frequencyTag, defaultGrammarTopics };
