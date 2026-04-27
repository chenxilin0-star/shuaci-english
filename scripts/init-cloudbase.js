#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'cloudbase/collections.json'), 'utf8'));
const envId = process.env.CLOUDBASE_ENV || process.env.TCB_ENV || process.argv.find(a => a.startsWith('--env='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run') || !envId;
function run(cmd, args) {
  const shown = `${cmd} ${args.join(' ')}`;
  if (dryRun) { console.log('[dry-run]', shown); return; }
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) throw new Error(`command failed: ${shown}`);
}
console.log(`CloudBase env: ${envId || '(not set, dry-run)'}`);
for (const c of config.collections) {
  // tcb CLI: npm i -g @cloudbase/cli, then tcb database:create <collection> -e <env>
  run('tcb', ['database:create', c.name, '-e', envId || 'ENV_ID']);
  for (const idx of c.indexes || []) {
    console.log(`index ${c.name}.${idx.name}: ${JSON.stringify(idx.keys)}${idx.unique ? ' unique' : ''}`);
  }
}
console.log('集合创建命令已生成。索引请在云开发控制台「数据库-索引」按上方配置创建，或使用后续 CloudBase API 自动化。');
