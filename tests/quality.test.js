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
  });
});
