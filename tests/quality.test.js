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
    assert.match(banksJs, /wx\.setStorageSync\(['"]shuaci_study_mode['"],\s*mode\)/);
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

  it('adds bank detail page with structure, completion estimate and learning curve', () => {
    const app = JSON.parse(read('miniprogram/app.json'));
    assert.ok(app.pages.includes('pages/bank-detail/bank-detail'));
    assert.ok(exists('miniprogram/pages/bank-detail/bank-detail.js'));
    const wxml = read('miniprogram/pages/bank-detail/bank-detail.wxml');
    const js = read('miniprogram/pages/bank-detail/bank-detail.js');
    assert.match(wxml, /词库结构/);
    assert.match(wxml, /预计完成/);
    assert.match(wxml, /学习曲线/);
    assert.match(js, /estimateDays/);
    assert.match(js, /curvePoints/);
    assert.match(read('miniprogram/pages/banks/banks.wxml'), /查看词库详情/);
    assert.doesNotMatch(read('miniprogram/pages/banks/banks.wxml'), /查看详情：词库结构 \/ 预计完成 \/ 学习曲线/);
    assert.match(read('miniprogram/pages/banks/banks.wxss'), /bank-switch\{display:grid/);
    assert.doesNotMatch(read('miniprogram/pages/banks/banks.wxss'), /overflow-x:auto/);
  });

  it('implements mode-specific study plans matching bank page promises', () => {
    const loop = require('../miniprogram/utils/learningLoop');
    assert.strictEqual(loop.MODE_PLANS.daily.newCount, 35);
    assert.strictEqual(loop.MODE_PLANS.daily.reviewCount, 10);
    assert.strictEqual(loop.MODE_PLANS.daily.mistakeCount, 5);
    assert.deepStrictEqual(loop.MODE_PLANS.review, { newCount: 0, reviewCount: 40, mistakeCount: 10, total: 50 });
    assert.deepStrictEqual(loop.MODE_PLANS.mistake, { newCount: 0, reviewCount: 0, mistakeCount: 50, total: 50 });
    const pools = {
      newWords: Array.from({ length: 80 }, (_, i) => ({ id: 'n' + i, text: 'new' + i })),
      reviewWords: Array.from({ length: 80 }, (_, i) => ({ id: 'r' + i, text: 'review' + i })),
      mistakeWords: Array.from({ length: 80 }, (_, i) => ({ id: 'm' + i, text: 'mistake' + i }))
    };
    const daily = loop.buildStudyPlan({ ...pools, mode: 'daily' });
    const review = loop.buildStudyPlan({ ...pools, mode: 'review' });
    const mistake = loop.buildStudyPlan({ ...pools, mode: 'mistake' });
    assert.strictEqual(daily.items.filter(i => i.planType === 'new').length, 35);
    assert.strictEqual(daily.items.filter(i => i.planType === 'review').length, 10);
    assert.strictEqual(daily.items.filter(i => i.planType === 'mistake').length, 5);
    const dailyShort = loop.buildStudyPlan({ ...pools, mistakeWords: pools.mistakeWords.slice(0, 1), mode: 'daily' });
    assert.strictEqual(dailyShort.items.filter(i => i.planType === 'new').length, 35);
    assert.strictEqual(dailyShort.items.filter(i => i.planType === 'mistake').length, 1);
    assert.strictEqual(dailyShort.stats.supplement, 4);
    assert.strictEqual(review.items.filter(i => i.planType === 'new').length, 0);
    assert.strictEqual(review.items.filter(i => i.planType === 'review').length, 40);
    assert.strictEqual(review.items.filter(i => i.planType === 'mistake').length, 10);
    assert.strictEqual(mistake.items.filter(i => i.planType === 'mistake').length, 50);
    assert.notDeepStrictEqual(daily.stats, review.stats);
    assert.notDeepStrictEqual(review.stats, mistake.stats);
    assert.ok(JSON.parse(read('miniprogram/app.json')).pages.includes('pages/study-result/study-result'));
    assert.match(read('miniprogram/pages/study/study.js'), /finishToday/);
    assert.match(read('miniprogram/pages/study-result/study-result.wxml'), /今日学习成果/);
  });

  it('uses polished study page layout classes for release UI', () => {
    const wxml = read('miniprogram/pages/study/study.wxml');
    const wxss = read('miniprogram/pages/study/study.wxss');
    assert.match(wxml, /study-header/);
    assert.match(wxml, /word-stage/);
    assert.match(wxml, /phonetic-label/);
    assert.match(wxml, /plan-stat/);
    assert.match(wxml, /action-bar/);
    assert.match(wxml, /补充词/);
    assert.match(wxml, /playAudio/);
    assert.match(wxml, /audio-btn/);
    assert.match(wxss, /has-supplement/);
    assert.match(wxss, /word-text/);
    assert.match(wxss, /phonetic-row/);
    assert.match(wxss, /action-btn\{height:92rpx;width:100%;min-width:0;margin:0;padding:0;box-sizing:border-box/);
    assert.match(read('miniprogram/utils/pronunciation.js'), /dictvoice/);
    assert.match(read('miniprogram/pages/spelling/spelling.wxml'), /playAudio/);
    assert.match(read('miniprogram/pages/word-detail/word-detail.wxml'), /playAudio/);
    assert.match(wxss, /safe-area-inset-bottom/);
    assert.match(wxss, /word-card/);
    assert.match(wxss, /action-bar/);
  });

  it('uses real local learning stats for home/profile/banks instead of hardcoded fake counters', () => {
    const loop = require('../miniprogram/utils/learningLoop');
    const state = loop.createInitialState('u1');
    const s1 = loop.markWordStudied(state, { id: 'w1', text: 'abandon' }, 'new');
    const s2 = loop.toggleFavoriteState(s1, { id: 'w1', text: 'abandon', meaning_cn: '放弃' }, true);
    const s3 = loop.submitSpellingAnswer(s2, { id: 'w2', text: 'benefit', meaning_cn: '益处' }, 'benfit').state;
    const stats = loop.getLearningStats(s3);
    assert.strictEqual(stats.learnedWords, 2);
    assert.strictEqual(stats.favoriteCount, 1);
    assert.strictEqual(stats.mistakeCount, 1);
    assert.ok('masteredWords' in stats);

    for (const file of [
      'miniprogram/pages/index/index.js',
      'miniprogram/pages/index/index.wxml',
      'miniprogram/pages/profile/profile.js',
      'miniprogram/pages/profile/profile.wxml',
      'cloudfunctions/getStudyProgress/index.js',
      'cloudfunctions/getWordBanks/index.js'
    ]) {
      assert.doesNotMatch(read(file), /\b(326|188|128|12)\b/, `${file} still contains fake launch stats`);
    }
    assert.match(read('miniprogram/pages/index/index.js'), /getLearningStats/);
    assert.match(read('miniprogram/pages/profile/profile.js'), /getLearningStats/);
    assert.match(read('miniprogram/pages/banks/banks.js'), /getBankProgress/);
  });

  it('expands grammar practice to 3-5 questions per topic and archives grammar mistakes', () => {
    const topics = JSON.parse(read('data/grammar_topics.json'));
    assert.ok(topics.length >= 50);
    assert.ok(topics.every(t => Array.isArray(t.practice) && t.practice.length >= 3 && t.practice.length <= 5));
    const cloudbaseLines = read('data/import/grammar_topics.cloudbase.json').trim().split('\n');
    assert.ok(cloudbaseLines.length >= 50);
    assert.doesNotMatch(cloudbaseLines[0], /^\s*\[/, 'CloudBase console import requires JSON Lines, not a JSON array');
    assert.ok(cloudbaseLines.every(line => JSON.parse(line).id));
    const grammarWxml = read('miniprogram/pages/grammar/grammar.wxml');
    const grammarJs = read('miniprogram/pages/grammar/grammar.js');
    assert.match(grammarWxml, /专项练习/);
    assert.match(grammarWxml, /上一题/);
    assert.match(grammarWxml, /下一题/);
    assert.match(grammarJs, /answerPractice/);
    assert.match(grammarJs, /submitGrammarAnswer/);
    const loop = require('../miniprogram/utils/learningLoop');
    const result = loop.submitGrammarAnswer(loop.createInitialState('u1'), { id: 'g1', title: '测试语法' }, { id: 'q1', answer: 'A', question: 'Q?' }, 'B');
    assert.strictEqual(result.isCorrect, false);
    assert.ok(result.state.mistakes.some(m => m.itemType === 'grammar'));
  });
});
