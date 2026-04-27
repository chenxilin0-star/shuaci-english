#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'cloudbase/collections.json'), 'utf8'));
const envId = process.env.CLOUDBASE_ENV || process.env.TCB_ENV || process.argv.find(a => a.startsWith('--env='))?.split('=')[1] || 'cloud1-6gy3kt0i80a1304f';
const dryRun = process.argv.includes('--dry-run');

function mgo(tableName, commandType, commandObj) {
  return [{ TableName: tableName, CommandType: commandType, Command: JSON.stringify(commandObj) }];
}
function runMgo(tableName, commandType, commandObj) {
  const payload = JSON.stringify(mgo(tableName, commandType, commandObj));
  const args = ['db', 'nosql', 'execute', '-e', envId, '--command', payload];
  const shown = `tcb ${args.map(a => a.includes(' ') ? JSON.stringify(a) : a).join(' ')}`;
  if (dryRun) { console.log('[dry-run]', shown); return; }
  const res = spawnSync('tcb', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  // create returns error if collection already exists; keep going for idempotency
  if (res.status !== 0) console.warn(`[warn] command failed, may already exist: ${tableName}`);
}

console.log(`CloudBase env: ${envId}${dryRun ? ' (dry-run)' : ''}`);
for (const c of config.collections) {
  runMgo(c.name, 'COMMAND', { create: c.name });
  // Ensure the collection exists even if create is unsupported by inserting/deleting a marker.
  const markerId = `__init_${c.name}`;
  runMgo(c.name, 'INSERT', { insert: c.name, documents: [{ _id: markerId, __init: true, createdAt: new Date().toISOString() }] });
  runMgo(c.name, 'DELETE', { delete: c.name, deletes: [{ q: { _id: markerId }, limit: 1 }] });
  for (const idx of c.indexes || []) {
    console.log(`index ${c.name}.${idx.name}: ${JSON.stringify(idx.keys)}${idx.unique ? ' unique' : ''}`);
  }
}
console.log('集合初始化命令已执行/生成。索引请在云开发控制台「数据库-索引」按上方配置创建。');
