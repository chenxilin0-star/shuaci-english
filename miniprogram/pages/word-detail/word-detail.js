const share = require('../../utils/share');
const { callCloud } = require('../../utils/api');
const pronunciation = require('../../utils/pronunciation');

Page({
  data: { wordId: '', word: null },
  onLoad(q = {}) {
    const wordId = q.wordId || q.id || '';
    this.setData({ wordId });
    if (!wordId) {
      wx.showToast({ title: '缺少单词参数', icon: 'none' });
      return;
    }
    this.load(wordId);
  },
  load(wordId) {
    callCloud('getWordDetail', { wordId }).then(r => {
      const word = r.data || null;
      this.setData({ word });
      if (word && word.text) {
        wx.setNavigationBarTitle({ title: `${word.text}｜四六级单词详解` });
      }
    });
  },
  playAudio() {
    if (this.data.word) pronunciation.playWord(this.data.word.text);
  },
  back() { wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/index/index' }); } }); },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
