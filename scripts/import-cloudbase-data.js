#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const envId = process.env.CLOUDBASE_ENV || process.env.TCB_ENV || process.argv.find(a => a.startsWith('--env='))?.split('=')[1] || 'cloud1-6gy3kt0i80a1304f';
const input = process.argv.find(a => a.startsWith('--input='))?.split('=')[1] || 'data/processed/cet_words.full.json';
const dryRun = process.argv.includes('--dry-run');
const clean = process.argv.includes('--clean');
const batchSize = Number(process.argv.find(a => a.startsWith('--batch-size='))?.split('=')[1] || 100);
const payload = JSON.parse(fs.readFileSync(path.join(root, input), 'utf8'));

function mgo(tableName, commandType, commandObj) {
  return [{ TableName: tableName, CommandType: commandType, Command: JSON.stringify(commandObj) }];
}
function runMgo(tableName, commandType, commandObj) {
  const payload = JSON.stringify(mgo(tableName, commandType, commandObj));
  const args = ['db', 'nosql', 'execute', '-e', envId, '--command', payload];
  const shown = `tcb ${args.map(a => a.includes(' ') ? JSON.stringify(a) : a).join(' ')}`;
  if (dryRun) { console.log('[dry-run]', shown.slice(0, 500) + (shown.length > 500 ? ' ...' : '')); return; }
  const res = spawnSync('tcb', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) throw new Error(`command failed: ${shown}`);
}
function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
function normalizeDocs(rows, collection) {
  return rows.map((row, index) => ({ ...row, _id: row._id || row.id || `${collection}_${index}` }));
}
const collections = {
  word_banks: normalizeDocs(payload.wordBanks || [], 'word_banks'),
  words: normalizeDocs(payload.words || [], 'words'),
  grammar_topics: normalizeDocs(payload.grammarTopics || [], 'grammar_topics'),
  reading_passages: normalizeDocs(payload.readingPassages || [], 'reading_passages')
};
console.log(`CloudBase env: ${envId}${dryRun ? ' (dry-run)' : ''}; input=${input}`);
for (const [collection, rows] of Object.entries(collections)) {
  if (!rows.length) continue;
  if (clean) runMgo(collection, 'DELETE', { delete: collection, deletes: [{ q: {}, limit: 0 }] });
  let inserted = 0;
  for (const batch of chunks(rows, batchSize)) {
    runMgo(collection, 'INSERT', { insert: collection, documents: batch });
    inserted += batch.length;
    console.log(`${collection}: prepared/imported ${inserted}/${rows.length}`);
  }
}
console.log(`导入完成/准备完成：${Object.entries(collections).map(([k,v]) => `${k}:${v.length}`).join(', ')}`);
