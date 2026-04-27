const share = require('../../utils/share');
Page({
  data: { step: 0 },
  steps: [
    { title: '欢迎使用刷词英语', desc: '按新词、复习、错题三条线推进，每天 50 词量化学习。' },
    { title: '选择词库', desc: 'CET-4 核心 3846 词，CET-6 新增 1956 词，根据考试目标自由切换。' },
    { title: '学习模式', desc: '新词模式推进度，复习模式巩固记忆，错题模式回炉重炼。' },
    { title: '准备好了吗？', desc: '点击开始，进入今日学习。' }
  ],
  onLoad() { this.setData({ step: 0, current: this.steps[0] }); },
  next() {
    const nextStep = this.data.step + 1;
    if (nextStep >= this.steps.length) { this.start(); return; }
    this.setData({ step: nextStep, current: this.steps[nextStep] });
  },
  start() {
    wx.setStorageSync('shuaci_onboarded', true);
    wx.switchTab({ url: '/pages/index/index' });
  },
  skip() { this.start(); },
  back() { wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/index/index' }); } }); },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
