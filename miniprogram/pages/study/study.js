const share = require('../../utils/share');
const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');
const loop = require('../../utils/learningLoop');
const pronunciation = require('../../utils/pronunciation');

const MODE_META = {
  daily: { title: '新词模式', apiMode: 'daily', desc: '35 新词 + 10 复习 + 5 错词' },
  review: { title: '复习模式', apiMode: 'review', desc: '40 复习 + 10 错词，不塞新词' },
  mistake: { title: '错题模式', apiMode: 'mistake', desc: '优先错词回炉，不够再用复习词补位' }
};

function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}
function normalizeMode(mode) { return MODE_META[mode] ? mode : 'daily'; }
function mistakeToWord(item) {
  return { id: item.itemId, text: item.itemText, meaning_cn: item.meaning_cn || '错词回炉', planType: 'mistake', planLabel: '错题' };
}
function favoriteToWord(item) {
  return { id: item.itemId, text: item.itemText, meaning_cn: item.meaning_cn || '收藏复习', planType: 'review', planLabel: '复习' };
}

Page({
  data: {
    bankId: 'cet4_core', mode: 'daily', modeTitle: '新词模式',
    words: [], index: 0, word: null, flipped: false,
    batchLabel: '今日计划', planStats: { new: 0, review: 0, mistake: 0 },
    target: loop.MODE_PLANS.daily,
    _locking: false
  },
  onLoad(q) {
    if (q.bankId) wx.setStorageSync('shuaci_selected_bank', q.bankId);
    if (q.mode) wx.setStorageSync('shuaci_study_mode', q.mode);
    this.syncSelectionAndLoad(true);
  },
  onShow() { this.syncSelectionAndLoad(false); },
  syncSelectionAndLoad(force) {
    const selectedBank = wx.getStorageSync('shuaci_selected_bank') || this.data.bankId;
    const selectedMode = normalizeMode(wx.getStorageSync('shuaci_study_mode') || this.data.mode || 'daily');
    if (force || selectedBank !== this.data.bankId || selectedMode !== this.data.mode) {
      this.setData({ bankId: selectedBank, mode: selectedMode, modeTitle: MODE_META[selectedMode].title, index: 0, flipped: false }, () => this.load());
    }
  },
  load() {
    // 最终学习计划仍是 limit: 50；这里多取候选词，用于拆出不同模式下的学习任务。
    const dayIndex = getDayIndex();
    const mode = normalizeMode(this.data.mode);
    const meta = MODE_META[mode];
    const includeOverlap = mode === 'review' || mode === 'mistake' || !!wx.getStorageSync('shuaci_include_overlap');
    callCloud('getWordList', { bankId: this.data.bankId, mode: meta.apiMode, dayIndex, limit: 70, includeOverlap }).then(r => {
      const rawWords = r.data || [];
      const wordMistakes = store.listMistakes('word').filter(m => !m.isReviewed).map(mistakeToWord);
      const favorites = store.listFavorites().map(favoriteToWord);
      const localReviews = store.listReviewCandidates();
      const reviewPool = mode === 'review'
        ? [...localReviews, ...favorites, ...rawWords]
        : [...localReviews, ...favorites, ...rawWords.slice(45, 65)];
      const newPool = mode === 'daily' ? rawWords.slice(0, 45) : [];
      const mistakePool = mode === 'mistake' ? [...wordMistakes, ...rawWords] : wordMistakes;
      const plan = loop.buildStudyPlan({ mode, newWords: newPool, reviewWords: reviewPool, mistakeWords: mistakePool });
      const words = plan.items;
      const bankLabel = this.data.bankId === 'cet6_core' ? '六级' : '四级';
      const baseLabel = `${meta.title} · ${meta.desc} · ${bankLabel}${this.data.bankId === 'cet6_core' && mode === 'daily' ? '新增优先' : '核心'}`;
      this.setData({
        words, word: words[0] || null, index: 0, flipped: false,
        planStats: plan.stats, target: plan.target,
        batchLabel: r.meta && r.meta.fallback ? baseLabel + '（本地缓存）' : baseLabel
      });
    });
  },
  flip() { this.setData({ flipped: !this.data.flipped }); },
  playAudio() {
    if (!this.data.word) return;
    pronunciation.playWord(this.data.word.text);
  },
  next() {
    if (this.data._locking || !this.data.words.length) return;
    if (this.data.index >= this.data.words.length - 1) { this.finishToday(); return; }
    this.setData({ _locking: true });
    const i = this.data.index + 1;
    store.markWordStudied(this.data.word, this.data.word.planType);
    const word = this.data.words[i];
    const stats = store.getLearningStats();
    callCloud('updateWordProgress', { bankId: this.data.bankId, currentIndex: i, learnedWords: i + 1, todayGoal: this.data.words.length, streakDays: stats.streakDays, mode: this.data.mode });
    this.setData({ index: i, word, flipped: false, _locking: false });
  },
  finishToday() {
    if (this.data._locking) return;
    this.setData({ _locking: true });
    if (this.data.word) store.markWordStudied(this.data.word, this.data.word.planType);
    const result = { ...loop.summarizeStudySession(this.data.words, this.data.index + 1), mode: this.data.mode, modeTitle: this.data.modeTitle };
    wx.setStorageSync('shuaci_last_study_result', result);
    const stats = store.getLearningStats();
    callCloud('updateWordProgress', { bankId: this.data.bankId, currentIndex: this.data.index, learnedWords: result.completed, todayGoal: result.total, streakDays: stats.streakDays, mode: this.data.mode });
    wx.navigateTo({ url: '/pages/study-result/study-result' });
    this.setData({ _locking: false });
  },
  toggleFavorite() {
    if (this.data._locking || !this.data.word) return;
    this.setData({ _locking: true });
    const word = { ...this.data.word, isFavorite: !this.data.word.isFavorite };
    this.setData({ word, _locking: false });
    store.toggleFavorite(word, word.isFavorite);
    callCloud('toggleFavorite', { itemId: word.id, itemType: 'word', itemText: word.text, isFavorite: word.isFavorite });
  },
  goSpell() { wx.navigateTo({ url: '/pages/spelling/spelling?bankId=' + this.data.bankId }); },
  goDetail() {
    if (!this.data.word) return;
    wx.navigateTo({ url: '/pages/word-detail/word-detail?wordId=' + this.data.word.id });
  },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
