const share = require('../../utils/share');
Page({
  data: { result: { completed: 0, total: 0, newCount: 0, reviewCount: 0, mistakeCount: 0, completionRate: 0 } },
  onLoad() {
    const result = wx.getStorageSync('shuaci_last_study_result') || this.data.result;
    this.setData({ result });
  },
  backHome() { wx.switchTab({ url: '/pages/index/index' }); },
  reviewMistakes() { wx.navigateTo({ url: '/pages/mistakes/mistakes' }); },
  continueStudy() { wx.switchTab({ url: '/pages/study/study' }); },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
