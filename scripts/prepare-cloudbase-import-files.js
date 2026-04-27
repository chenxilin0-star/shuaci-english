#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const input = process.argv.find(a => a.startsWith('--input='))?.split('=')[1] || 'data/processed/cet_words.full.json';
const outDir = process.argv.find(a => a.startsWith('--out='))?.split('=')[1] || 'data/import';
const payload = JSON.parse(fs.readFileSync(path.join(root, input), 'utf8'));
const collections = {
  word_banks: payload.wordBanks || [],
  words: payload.words || [],
  grammar_topics: payload.grammarTopics || [],
  reading_passages: payload.readingPassages || []
};
fs.mkdirSync(path.join(root, outDir), { recursive: true });
for (const [name, rows] of Object.entries(collections)) {
  if (!rows.length) continue;
  const docs = rows.map((row, index) => ({ ...row, _id: row._id || row.id || `${name}_${index}` }));
  const jsonLines = docs.map(d => JSON.stringify(d)).join('\n') + '\n';
  // CloudBase console import expects JSON Lines, but its file picker often only accepts .json.
  // Therefore *.cloudbase.json is JSON Lines content with a selectable .json suffix.
  fs.writeFileSync(path.join(root, outDir, `${name}.cloudbase.json`), jsonLines, 'utf8');
  fs.writeFileSync(path.join(root, outDir, `${name}.jsonl`), jsonLines, 'utf8');
  // Keep array JSON only for inspection/debugging; do NOT use it in CloudBase console import.
  fs.writeFileSync(path.join(root, outDir, `${name}.array.debug.json`), JSON.stringify(docs, null, 2), 'utf8');
  console.log(`${name}: ${docs.length} -> ${outDir}/${name}.cloudbase.json (JSON Lines)`);
}
