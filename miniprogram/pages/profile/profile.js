const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');
const share = require('../../utils/share');

const DEFAULT_USER = {
  nickName: '',
  avatarUrl: ''
};

function normalizeUser(user = {}) {
  return {
    ...DEFAULT_USER,
    ...user,
    nickName: user.nickName || '',
    avatarUrl: user.avatarUrl || ''
  };
}

Page({
  data: {
    user: DEFAULT_USER,
    stats: {},
    hasLogin: false,
    pendingNickName: '',
    pendingAvatarUrl: '',
    feedbackWechat: 'xym7563'
  },
  onShow() {
    const user = normalizeUser(wx.getStorageSync('shuaci_user') || {});
    this.setData({
      user,
      hasLogin: !!(user.openid || user.nickName || user.avatarUrl),
      pendingNickName: user.nickName || '',
      pendingAvatarUrl: user.avatarUrl || '',
      stats: store.getLearningStats()
    });
  },
  onChooseAvatar(e) {
    const avatarUrl = e && e.detail ? e.detail.avatarUrl : '';
    if (!avatarUrl) return;
    this.setData({ pendingAvatarUrl: avatarUrl, user: normalizeUser({ ...this.data.user, avatarUrl }) });
    // 自动登录：如果已有昵称，选择头像后立即同步
    if ((this.data.pendingNickName || '').trim()) {
      this.login();
    }
  },
  onNicknameInput(e) {
    const nickName = e && e.detail ? e.detail.value : '';
    this.setData({ pendingNickName: nickName, user: normalizeUser({ ...this.data.user, nickName }) });
  },
  onNicknameBlur(e) {
    const nickName = (e && e.detail ? e.detail.value : '').trim();
    if (!nickName) return;
    this.setData({ pendingNickName: nickName });
    // 自动登录：如果已有头像，填写昵称后立即同步
    if (this.data.pendingAvatarUrl || this.data.user.avatarUrl) {
      this.login();
    }
  },
  login() {
    const nickName = (this.data.pendingNickName || '').trim();
    const avatarUrl = this.data.pendingAvatarUrl || '';
    if (!nickName) {
      wx.showToast({ title: '请先填写微信昵称', icon: 'none' });
      return;
    }
    callCloud('authLogin', { nickName, avatarUrl }).then(r => {
      const user = normalizeUser({ ...(r.data || {}), nickName, avatarUrl });
      wx.setStorageSync('shuaci_user', user);
      const app = typeof getApp === 'function' ? getApp() : null;
      if (app && app.globalData) app.globalData.user = user;
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
  copyFeedbackWechat() {
    wx.setClipboardData({
      data: this.data.feedbackWechat,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'none' })
    });
  },
  goFav() { wx.navigateTo({ url: '/pages/favorites/favorites' }); },
  goMistakes() { wx.navigateTo({ url: '/pages/mistakes/mistakes' }); },
  goBanks() { wx.switchTab({ url: '/pages/banks/banks' }); },
  goGrammar() { wx.switchTab({ url: '/pages/grammar/grammar' }); },
  onShareAppMessage() { return share.onShareAppMessage({ title: '刷词英语｜一起刷四六级核心词' }); },
  onShareTimeline() { return share.onShareTimeline({ title: '刷词英语｜四六级刷词、语法和错题复盘' }); }
});
