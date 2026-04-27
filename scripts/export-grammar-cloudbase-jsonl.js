#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const topics = JSON.parse(fs.readFileSync(path.join(root, 'data/grammar_topics.json'), 'utf8'));
const jsonl = topics.map(t => JSON.stringify(t)).join('\n') + '\n';
fs.writeFileSync(path.join(root, 'data/import/grammar_topics.cloudbase.json'), jsonl, 'utf8');
fs.writeFileSync(path.join(root, 'data/import/grammar_topics.jsonl'), jsonl, 'utf8');
fs.writeFileSync(path.join(root, 'data/import/grammar_topics.array.debug.json'), JSON.stringify(topics, null, 2), 'utf8');
console.log(`wrote ${topics.length} grammar topics as JSON Lines for CloudBase console import`);
