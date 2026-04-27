const assert = require('assert');
const { describe, it } = require('node:test');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function exists(p) { return fs.existsSync(path.join(root, p)); }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }

describe('刷词英语 phase-2 delivery', () => {
  it('contains CloudBase collection initialization and import tooling', () => {
    assert.ok(exists('cloudbase/collections.json'));
    assert.ok(exists('scripts/init-cloudbase.js'));
    assert.ok(exists('scripts/import-cloudbase-data.js'));
    const collections = JSON.parse(read('cloudbase/collections.json'));
    for (const name of ['users','word_banks','words','grammar_topics','user_word_records','favorites','mistake_books','learning_sessions','checkins']) {
      assert.ok(collections.collections.some(c => c.name === name), `missing collection ${name}`);
    }
  });

  it('contains ECDICT/CET cleaning pipeline with sample input/output', () => {
    assert.ok(exists('scripts/clean-ecdict-cet.js'));
    assert.ok(exists('data/samples/ecdict_sample.csv'));
    assert.ok(exists('data/processed/cet_words.sample.json'));
    const cleaned = JSON.parse(read('data/processed/cet_words.sample.json'));
    assert.ok(cleaned.words.length >= 4);
    assert.ok(cleaned.words.every(w => w.text && (w.is_in_cet4 || w.is_in_cet6)));
    assert.ok(cleaned.words.every(w => Array.isArray(w.bankIds) && w.bankIds.length >= 1));
    assert.ok(cleaned.grammarTopics.length >= 40);
    assert.ok(cleaned.grammarTopics.every(t => t.examTips && t.examTips.length >= 1 && t.practice && t.practice.length >= 1));
  });

  it('implements real local learning loop helpers for favorites, mistakes and spelling sessions', () => {
    assert.ok(exists('miniprogram/utils/store.js'));
    assert.ok(exists('miniprogram/utils/learningLoop.js'));
    const loop = require('../miniprogram/utils/learningLoop');
    const state = loop.createInitialState('u1');
    const afterFavorite = loop.toggleFavoriteState(state, { id: 'w001', text: 'abandon', meaning_cn: '放弃' }, true);
    assert.strictEqual(afterFavorite.favorites.length, 1);
    const wrong = loop.submitSpellingAnswer(afterFavorite, { id: 'w001', text: 'abandon', meaning_cn: '放弃' }, 'abandn');
    assert.strictEqual(wrong.isCorrect, false);
    assert.strictEqual(wrong.state.mistakes.length, 1);
    const correct = loop.submitSpellingAnswer(wrong.state, { id: 'w001', text: 'abandon', meaning_cn: '放弃' }, 'abandon');
    assert.strictEqual(correct.isCorrect, true);
    assert.ok(correct.state.wordRecords.w001.correctCount >= 1);
  });

  it('contains preview checklist and release configuration docs', () => {
    assert.ok(exists('docs/wechat-preview-checklist.md'));
    assert.ok(exists('docs/release-config.md'));
    assert.match(read('docs/wechat-preview-checklist.md'), /真机预览/);
    assert.match(read('docs/release-config.md'), /上线/);
  });

  it('uses switchTab rather than navigateTo when opening tabBar study page from bank list', () => {
    const banksJs = read('miniprogram/pages/banks/banks.js');
    assert.match(banksJs, /wx\.switchTab\(\{\s*url:\s*['"]\/pages\/study\/study['"]/s);
    assert.doesNotMatch(banksJs, /navigateTo\(\{\s*url:\s*['"]\/pages\/study\/study\?/s);
    assert.match(banksJs, /wx\.setStorageSync\(['"]shuaci_selected_bank['"]/);
    const studyJs = read('miniprogram/pages/study/study.js');
    assert.match(studyJs, /wx\.getStorageSync\(['"]shuaci_selected_bank['"]\)/);
    assert.match(studyJs, /daily/);
    assert.match(studyJs, /limit:\s*50/);
  });

  it('cloud getWordList supports imported ECDICT words by CET flags and avoids unindexed ordering', () => {
    const code = read('cloudfunctions/getWordList/index.js');
    assert.match(code, /bankIdToWhere/);
    assert.match(code, /is_in_cet4/);
    assert.match(code, /is_in_cet6/);
    assert.match(code, /cet6_new/);
    assert.match(code, /dailySkip/);
    assert.doesNotMatch(code, /orderBy\(/);
  });

  it('provides learner-friendly word bank and grammar experiences', () => {
    const banksWxml = read('miniprogram/pages/banks/banks.wxml');
    const banksJs = read('miniprogram/pages/banks/banks.js');
    assert.match(banksWxml, /学习路径/);
    assert.match(banksWxml, /新词模式/);
    assert.match(banksWxml, /复习模式/);
    assert.match(banksJs, /startMode/);
    assert.match(banksJs, /includeOverlap/);

    const grammarWxml = read('miniprogram/pages/grammar/grammar.wxml');
    const grammarJs = read('miniprogram/pages/grammar/grammar.js');
    assert.match(grammarWxml, /考点地图/);
    assert.match(grammarWxml, /考试提醒/);
    assert.match(grammarWxml, /例句/);
    assert.match(grammarWxml, /小练习/);
    assert.match(grammarJs, /selectTopic/);
    assert.match(grammarJs, /masteryLabel/);
  });
});
