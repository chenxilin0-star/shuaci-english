const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');
const loop = require('../../utils/learningLoop');

function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}
function mistakeToWord(item) {
  return { id: item.itemId, text: item.itemText, meaning_cn: item.meaning_cn || '错词回炉', planType: 'mistake', planLabel: '错题' };
}

Page({
  data: {
    bankId: 'cet4_core',
    words: [],
    index: 0,
    word: null,
    flipped: false,
    batchLabel: '今日计划',
    planStats: { new: 0, review: 0, mistake: 0 },
    target: loop.DAILY_PLAN
  },
  onLoad(q) {
    if (q.bankId) {
      wx.setStorageSync('shuaci_selected_bank', q.bankId);
      this.setData({ bankId: q.bankId });
    }
    this.load();
  },
  onShow() {
    const selectedBank = wx.getStorageSync('shuaci_selected_bank');
    if (selectedBank && selectedBank !== this.data.bankId) {
      this.setData({ bankId: selectedBank, index: 0, flipped: false });
      this.load();
    }
  },
  load() {
    // 最终学习计划仍是 limit: 50；这里多取候选词，用于拆出 35 新词 + 10 复习 + 5 错词。
    const dayIndex = getDayIndex();
    const mode = wx.getStorageSync('shuaci_study_mode') || 'daily-plan';
    const includeOverlap = !!wx.getStorageSync('shuaci_include_overlap');
    callCloud('getWordList', { bankId: this.data.bankId, mode: mode === 'daily-plan' ? 'daily' : mode, dayIndex, limit: 70, includeOverlap }).then(r => {
      const rawWords = r.data || [];
      const wordMistakes = store.listMistakes('word').filter(m => !m.isReviewed).map(mistakeToWord);
      const plan = loop.buildDailyPlan({
        newWords: rawWords.slice(0, 45),
        reviewWords: rawWords.slice(45, 65),
        mistakeWords: wordMistakes
      });
      const words = plan.items;
      const baseLabel = this.data.bankId === 'cet6_core' ? '35 新词 + 10 复习 + 5 错词 · 六级新增优先' : '35 新词 + 10 复习 + 5 错词 · 四级核心';
      this.setData({
        words,
        word: words[0] || null,
        index: 0,
        flipped: false,
        planStats: plan.stats,
        target: plan.target,
        batchLabel: r.meta && r.meta.fallback ? baseLabel + '（本地缓存）' : baseLabel
      });
    });
  },
  flip() { this.setData({ flipped: !this.data.flipped }); },
  next() {
    if (!this.data.words.length) return;
    if (this.data.index >= this.data.words.length - 1) {
      this.finishToday();
      return;
    }
    const i = this.data.index + 1;
    const word = this.data.words[i];
    this.setData({ index: i, word, flipped: false });
    callCloud('updateWordProgress', { bankId: this.data.bankId, currentIndex: i, learnedWords: i + 1, todayGoal: 50, streakDays: 12 });
  },
  finishToday() {
    const result = loop.summarizeStudySession(this.data.words, this.data.index + 1);
    wx.setStorageSync('shuaci_last_study_result', result);
    callCloud('updateWordProgress', { bankId: this.data.bankId, currentIndex: this.data.index, learnedWords: result.completed, todayGoal: result.total, streakDays: 12 });
    wx.navigateTo({ url: '/pages/study-result/study-result' });
  },
  toggleFavorite() {
    if (!this.data.word) return;
    const word = { ...this.data.word, isFavorite: !this.data.word.isFavorite };
    this.setData({ word });
    store.toggleFavorite(word, word.isFavorite);
    callCloud('toggleFavorite', { itemId: word.id, itemType: 'word', itemText: word.text, isFavorite: word.isFavorite });
  },
  goSpell() { wx.navigateTo({ url: '/pages/spelling/spelling?bankId=' + this.data.bankId }); },
  goDetail() {
    if (!this.data.word) return;
    wx.navigateTo({ url: '/pages/word-detail/word-detail?wordId=' + this.data.word.id });
  }
});
