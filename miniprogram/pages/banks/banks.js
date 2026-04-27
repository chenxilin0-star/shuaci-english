const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');

const BANK_META = {
  cet4_core: {
    exam: 'CET-4',
    slogan: '先把考试高频词打牢，适合四级备考和基础薄弱同学。',
    dailyGoal: 50,
    newWords: 35,
    reviewWords: 10,
    levelText: '基础 → 高频 → 真题语境',
    accentClass: 'cet4'
  },
  cet6_core: {
    exam: 'CET-6',
    slogan: '默认优先六级新增词，减少与四级重复，适合冲刺提分。',
    dailyGoal: 50,
    newWords: 35,
    reviewWords: 10,
    levelText: '新增词 → 学术词 → 长难句词汇',
    accentClass: 'cet6'
  }
};

function decorateBank(bank) {
  const meta = BANK_META[bank.id] || BANK_META[bank.code === 'cet6' ? 'cet6_core' : 'cet4_core'];
  const totalWords = bank.totalWords || bank.word_count || 0;
  const local = store.getBankProgress(bank.id);
  const learnedWords = local.learnedWords || 0;
  const masteredWords = local.masteredWords || 0;
  const percent = totalWords ? Math.min(100, Math.round((learnedWords / totalWords) * 100)) : 0;
  return {
    ...bank,
    ...meta,
    totalWords,
    learnedWords,
    masteredWords,
    percent,
    remainingWords: Math.max(0, totalWords - learnedWords),
    tags: bank.tags && bank.tags.length ? bank.tags : [meta.exam, meta.dailyGoal + '词/天']
  };
}

Page({
  data: { banks: [], selectedId: 'cet4_core', selectedBank: null, modes: [] },
  onShow() {
    callCloud('getWordBanks').then(r => {
      const banks = (r.data || []).map(decorateBank);
      const selectedId = wx.getStorageSync('shuaci_selected_bank') || banks[0]?.id || 'cet4_core';
      this.setData({ banks, selectedId }, () => this.updateSelected());
    });
  },
  selectBank(e) {
    this.setData({ selectedId: e.currentTarget.dataset.id }, () => this.updateSelected());
  },
  updateSelected() {
    const selectedBank = this.data.banks.find(b => b.id === this.data.selectedId) || this.data.banks[0];
    if (!selectedBank) return;
    const isCet6 = selectedBank.id === 'cet6_core' || selectedBank.code === 'cet6';
    const modes = [
      { key: 'daily', title: '新词模式', desc: isCet6 ? '优先六级新增词，减少四级重复' : '每天推进一批四级核心词', icon: '🌱', includeOverlap: false },
      { key: 'review', title: '复习模式', desc: '复习已学和重叠词，适合考前巩固', icon: '🔁', includeOverlap: true },
      { key: 'mistake', title: '错题模式', desc: '从错词和收藏里回炉练习', icon: '🎯', includeOverlap: true }
    ];
    this.setData({ selectedBank, modes });
  },
  startMode(e) {
    const mode = e.currentTarget.dataset.mode || 'daily';
    const includeOverlap = e.currentTarget.dataset.overlap === true || e.currentTarget.dataset.overlap === 'true';
    wx.setStorageSync('shuaci_selected_bank', this.data.selectedBank.id);
    wx.setStorageSync('shuaci_study_mode', mode);
    wx.setStorageSync('shuaci_include_overlap', includeOverlap);
    wx.switchTab({ url: '/pages/study/study' });
  },
  viewDetail() {
    if (!this.data.selectedBank) return;
    wx.navigateTo({ url: '/pages/bank-detail/bank-detail?bankId=' + this.data.selectedBank.id });
  },
  openBank(e) {
    this.selectBank(e);
  }
});
