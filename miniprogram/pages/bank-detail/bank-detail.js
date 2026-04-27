const { callCloud } = require('../../utils/api');

const BANK_META = {
  cet4_core: {
    exam: 'CET-4',
    dailyNew: 35,
    sections: [
      { name: '高频核心词', count: 1200, desc: '先解决真题中反复出现的基础词' },
      { name: '阅读常见词', count: 1600, desc: '匹配阅读、翻译和写作高频语境' },
      { name: '听力场景词', count: 900, desc: '校园、生活、工作场景常用表达' }
    ],
    curveLabels: ['第1周 建立节奏', '第2-3周 高频推进', '第4周 首轮复习', '考前 错词冲刺']
  },
  cet6_core: {
    exam: 'CET-6',
    dailyNew: 35,
    sections: [
      { name: '六级新增词', count: 1956, desc: '优先学习四级之外的提分词' },
      { name: '学术阅读词', count: 1800, desc: '论文、社科、科技阅读常见词' },
      { name: '写译高级词', count: 1100, desc: '作文和翻译可替换表达' }
    ],
    curveLabels: ['第1周 新增词突破', '第2-4周 阅读词扩容', '第5周 写译输出', '考前 错词回炉']
  }
};

function normalizeBank(bank, fallbackId) {
  const id = bank.id || fallbackId || 'cet4_core';
  const meta = BANK_META[id] || BANK_META[bank.code === 'cet6' ? 'cet6_core' : 'cet4_core'];
  const totalWords = bank.totalWords || bank.word_count || meta.sections.reduce((s, x) => s + x.count, 0);
  const learnedWords = bank.learnedWords || 0;
  const remaining = Math.max(0, totalWords - learnedWords);
  const estimateDays = Math.max(1, Math.ceil(remaining / meta.dailyNew));
  const curvePoints = meta.curveLabels.map((label, index) => ({
    label,
    percent: Math.min(100, Math.round(((index + 1) / meta.curveLabels.length) * 100)),
    desc: index === 0 ? '先稳定每天 35 新词 + 10 复习 + 5 错词' : index === meta.curveLabels.length - 1 ? '错题本和复习词优先，减少遗忘' : '按学习曲线持续推进'
  }));
  return { ...bank, ...meta, id, totalWords, learnedWords, remaining, estimateDays, curvePoints };
}

Page({
  data: { bankId: 'cet4_core', bank: null },
  onLoad(q) {
    const bankId = q.bankId || wx.getStorageSync('shuaci_selected_bank') || 'cet4_core';
    this.setData({ bankId });
    this.load(bankId);
  },
  load(bankId) {
    callCloud('getWordBanks').then(r => {
      const list = r.data || [];
      const raw = list.find(b => b.id === bankId) || list[0] || { id: bankId, name: bankId === 'cet6_core' ? '六级核心词库' : '四级核心词库' };
      this.setData({ bank: normalizeBank(raw, bankId) });
    });
  },
  startPlan() {
    if (!this.data.bank) return;
    wx.setStorageSync('shuaci_selected_bank', this.data.bank.id);
    wx.setStorageSync('shuaci_study_mode', 'daily-plan');
    wx.setStorageSync('shuaci_include_overlap', this.data.bank.id === 'cet6_core' ? false : true);
    wx.switchTab({ url: '/pages/study/study' });
  }
});
