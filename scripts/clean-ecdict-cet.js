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
  return JSON.parse(fs.readFileSync(path.join(root, 'data/grammar_topics.json'), 'utf8'));
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
