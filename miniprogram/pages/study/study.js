const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');

Page({
  data: { bankId: 'cet4_core', words: [], index: 0, word: null, flipped: false },
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
    callCloud('getWordList', { bankId: this.data.bankId }).then(r => {
      const words = r.data || [];
      this.setData({ words, word: words[0] || null });
    });
  },
  flip() { this.setData({ flipped: !this.data.flipped }); },
  next() {
    if (!this.data.words.length) return;
    const i = (this.data.index + 1) % this.data.words.length;
    const word = this.data.words[i];
    this.setData({ index: i, word, flipped: false });
    callCloud('updateWordProgress', { bankId: this.data.bankId, currentIndex: i, learnedWords: i + 1, todayGoal: 20, streakDays: 12 });
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
