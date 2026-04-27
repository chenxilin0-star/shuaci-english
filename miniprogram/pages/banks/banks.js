const { callCloud } = require('../../utils/api');

Page({
  data: { banks: [] },
  onShow() {
    callCloud('getWordBanks').then(r => this.setData({ banks: r.data || [] }));
  },
  openBank(e) {
    const bankId = e.currentTarget.dataset.id;
    wx.setStorageSync('shuaci_selected_bank', bankId);
    wx.switchTab({ url: '/pages/study/study' });
  }
});
