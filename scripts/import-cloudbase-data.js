#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const envId = process.env.CLOUDBASE_ENV || process.env.TCB_ENV || process.argv.find(a => a.startsWith('--env='))?.split('=')[1];
const input = process.argv.find(a => a.startsWith('--input='))?.split('=')[1] || 'data/processed/cet_words.sample.json';
const dryRun = process.argv.includes('--dry-run') || !envId;
const payload = JSON.parse(fs.readFileSync(path.join(root, input), 'utf8'));
const tmpDir = path.join(root, '.tmp-cloudbase-import');
fs.mkdirSync(tmpDir, { recursive: true });
const collections = {
  word_banks: payload.wordBanks || [],
  words: payload.words || [],
  grammar_topics: payload.grammarTopics || [],
  reading_passages: payload.readingPassages || []
};
function run(cmd, args) {
  const shown = `${cmd} ${args.join(' ')}`;
  if (dryRun) { console.log('[dry-run]', shown); return; }
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) throw new Error(`command failed: ${shown}`);
}
for (const [collection, rows] of Object.entries(collections)) {
  if (!rows.length) continue;
  const file = path.join(tmpDir, `${collection}.json`);
  fs.writeFileSync(file, rows.map(row => JSON.stringify(row)).join('\n'), 'utf8');
  run('tcb', ['database:import', collection, file, '--fileType', 'json', '-e', envId || 'ENV_ID']);
}
console.log(`导入准备完成：${Object.entries(collections).map(([k,v]) => `${k}:${v.length}`).join(', ')}`);
