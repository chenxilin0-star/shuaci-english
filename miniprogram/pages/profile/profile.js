const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');

Page({
  data: { user: null, stats: {}, hasLogin: false },
  onShow() {
    const user = wx.getStorageSync('shuaci_user') || null;
    this.setData({ user, hasLogin: !!user, stats: store.getLearningStats() });
  },
  login() {
    callCloud('authLogin').then(r => {
      const user = r.data || { nickName: '刷词同学' };
      wx.setStorageSync('shuaci_user', user);
      this.setData({ user, hasLogin: true });
      wx.showToast({ title: '登录成功' });
    });
  },
  checkin() {
    store.checkin();
    callCloud('checkin').then(() => {
      const stats = store.getLearningStats();
      this.setData({ stats });
      wx.showToast({ title: '已记录打卡', icon: 'none' });
    });
  },
  goFav() { wx.navigateTo({ url: '/pages/favorites/favorites' }); },
  goMistakes() { wx.navigateTo({ url: '/pages/mistakes/mistakes' }); },
  goBanks() { wx.switchTab({ url: '/pages/banks/banks' }); },
  goGrammar() { wx.switchTab({ url: '/pages/grammar/grammar' }); }
});
