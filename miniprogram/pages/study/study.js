const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');

function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

Page({
  data: { bankId: 'cet4_core', words: [], index: 0, word: null, flipped: false, batchLabel: '今日 50 词' },
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
    const dayIndex = getDayIndex();
    callCloud('getWordList', { bankId: this.data.bankId, mode: 'daily', dayIndex, limit: 50 }).then(r => {
      const words = r.data || [];
      const meta = r.meta || {};
      const batchLabel = this.data.bankId === 'cet6_core'
        ? '今日 50 词 · 优先六级新增词'
        : '今日 50 词 · 四级核心';
      this.setData({ words, word: words[0] || null, index: 0, flipped: false, batchLabel: meta.fallback ? batchLabel + '（本地缓存）' : batchLabel });
    });
  },
  flip() { this.setData({ flipped: !this.data.flipped }); },
  next() {
    if (!this.data.words.length) return;
    const i = (this.data.index + 1) % this.data.words.length;
    const word = this.data.words[i];
    this.setData({ index: i, word, flipped: false });
    callCloud('updateWordProgress', { bankId: this.data.bankId, currentIndex: i, learnedWords: i + 1, todayGoal: 50, streakDays: 12 });
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
