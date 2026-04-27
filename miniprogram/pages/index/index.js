const share = require('../../utils/share');
const store = require('../../utils/store');

Page({
  data: {
    stats: {},
    percent: 0,
    selectedBank: wx.getStorageSync('shuaci_selected_bank') || 'cet4_core'
  },
  onShow() {
    const stats = store.getLearningStats();
    const selectedBank = wx.getStorageSync('shuaci_selected_bank') || 'cet4_core';
    this.setData({ stats, percent: stats.completionPercent || 0, selectedBank });
  },
  goBanks() { wx.switchTab({ url: '/pages/banks/banks' }); },
  goStudy() { wx.switchTab({ url: '/pages/study/study' }); },
  goGrammar() { wx.switchTab({ url: '/pages/grammar/grammar' }); },
  goMistakes() { wx.navigateTo({ url: '/pages/mistakes/mistakes' }); },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
