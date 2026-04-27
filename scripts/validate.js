const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = ['project.config.json','miniprogram/app.json','miniprogram/app.js','miniprogram/app.wxss','miniprogram/data/mockData.js','miniprogram/utils/api.js'];
const pages = ['index','banks','bank-detail','study','study-result','grammar','profile','onboarding','word-detail','spelling','reading','favorites','mistakes'];
const funcs = ['authLogin','getWordBanks','getWordList','getWordDetail','updateWordProgress','getStudyProgress','getGrammarTopics','toggleFavorite','checkin','submitSpellingAnswer','getFavorites','getMistakeBook'];
let errors = [];
for (const f of required) if (!fs.existsSync(path.join(root, f))) errors.push(`missing ${f}`);
for (const p of pages) for (const ext of ['js','wxml','wxss','json']) if (!fs.existsSync(path.join(root, `miniprogram/pages/${p}/${p}.${ext}`))) errors.push(`missing page ${p}.${ext}`);
for (const f of funcs) if (!fs.existsSync(path.join(root, `cloudfunctions/${f}/index.js`))) errors.push(`missing cloudfunction ${f}`);
function walk(dir){ for (const name of fs.readdirSync(dir)) { const p = path.join(dir, name); if (name === '.git' || name === 'node_modules') continue; const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (/\.(js|json|wxml|wxss|md)$/.test(name)) { const s = fs.readFileSync(p,'utf8'); const oldBrand = '语途' + '英语';
      if (s.includes(oldBrand)) errors.push(`forbidden old brand in ${path.relative(root,p)}`); } } }
walk(root);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('✅ 刷词英语项目校验通过：页面、云函数、品牌替换均正常');
