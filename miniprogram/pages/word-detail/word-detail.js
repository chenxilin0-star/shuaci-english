const { callCloud } = require('../../utils/api');
const pronunciation = require('../../utils/pronunciation');

Page({
  data: { wordId: '', word: null },
  onLoad(q = {}) {
    const wordId = q.wordId || q.id || '';
    this.setData({ wordId });
    if (wordId) this.load(wordId);
  },
  load(wordId) {
    callCloud('getWordDetail', { wordId }).then(r => {
      this.setData({ word: r.data || null });
    });
  },
  playAudio() {
    if (this.data.word) pronunciation.playWord(this.data.word.text);
  },
  back() { wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/index/index' }); } }); }
});
