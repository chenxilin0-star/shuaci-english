const share = require('../../utils/share');
const store = require('../../utils/store');
const { callCloud } = require('../../utils/api');

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
    // 同步云端进度，防止本地数据丢失导致 streak 等显示为 0
    callCloud('getStudyProgress').then(r => {
      if (r.data) {
        const cloud = r.data;
        this.setData({
          stats: { ...stats, ...cloud, streakDays: Math.max(stats.streakDays || 0, cloud.streakDays || 0) },
          percent: (cloud.completionPercent !== undefined ? cloud.completionPercent : stats.completionPercent) || 0
        });
      }
    }).catch(() => {});
  },
  goBanks() { wx.switchTab({ url: '/pages/banks/banks' }); },
  goStudy() { wx.switchTab({ url: '/pages/study/study' }); },
  goGrammar() { wx.switchTab({ url: '/pages/grammar/grammar' }); },
  goMistakes() { wx.navigateTo({ url: '/pages/mistakes/mistakes' }); },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
