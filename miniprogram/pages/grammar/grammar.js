const share = require('../../utils/share');
const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');

function decorateTopic(topic, index) {
  const mastery = topic.masteryLevel || 0;
  const practice = topic.practice || [];
  return {
    ...topic,
    masteryLabel: mastery >= 80 ? '已掌握' : mastery >= 40 ? '复习中' : '待学习',
    masteryPercent: mastery,
    index: index + 1,
    tipText: (topic.examTips || [])[0] || '先识别考点，再判断结构。',
    example: (topic.examples || [])[0] || {},
    practice,
    practiceCount: practice.length,
    currentPractice: practice[0] || {}
  };
}

Page({
  data: {
    topics: [], filtered: [], categories: ['全部'], active: '全部', selectedTopic: null,
    search: '', masteryLabel: '待学习', practiceIndex: 0, selectedAnswer: '', practiceResult: null
  },
  onShow() {
    callCloud('getGrammarTopics').then(r => {
      const topics = (r.data || []).map(decorateTopic);
      const cats = ['全部', ...new Set(topics.map(t => t.category))];
      this.setData({ topics, categories: cats, filtered: topics }, () => this.setSelected(topics[0] || null));
    });
  },
  setSelected(topic) {
    if (!topic) { this.setData({ selectedTopic: null, masteryLabel: '待学习', practiceIndex: 0, selectedAnswer: '', practiceResult: null }); return; }
    const currentPractice = (topic.practice || [])[0] || {};
    this.setData({ selectedTopic: { ...topic, currentPractice }, masteryLabel: topic.masteryLabel, practiceIndex: 0, selectedAnswer: '', practiceResult: null });
  },
  select(e) { this.applyFilter(e.currentTarget.dataset.cat, this.data.search); },
  onSearch(e) { this.applyFilter(this.data.active, e.detail.value || ''); },
  applyFilter(active, search) {
    const kw = String(search || '').trim().toLowerCase();
    const filtered = this.data.topics.filter(t => {
      const byCat = active === '全部' || t.category === active;
      const byKw = !kw || `${t.title} ${t.summary} ${t.category}`.toLowerCase().includes(kw);
      return byCat && byKw;
    });
    this.setData({ active, search, filtered }, () => this.setSelected(filtered[0] || null));
  },
  selectTopic(e) {
    const id = e.currentTarget.dataset.id;
    this.setSelected(this.data.topics.find(t => t.id === id));
  },
  changePractice(step) {
    if (!this.data.selectedTopic) return;
    const list = this.data.selectedTopic.practice || [];
    if (!list.length) return;
    const nextIndex = Math.max(0, Math.min(list.length - 1, this.data.practiceIndex + step));
    this.setData({
      practiceIndex: nextIndex,
      selectedTopic: { ...this.data.selectedTopic, currentPractice: list[nextIndex] },
      selectedAnswer: '',
      practiceResult: null
    });
  },
  prevPractice() { this.changePractice(-1); },
  nextPractice() { this.changePractice(1); },
  chooseAnswer(e) { this.setData({ selectedAnswer: e.currentTarget.dataset.answer }); },
  answerPractice() { this.submitGrammarAnswer(); },
  submitGrammarAnswer() {
    const topic = this.data.selectedTopic;
    const practice = topic && topic.currentPractice;
    const answer = this.data.selectedAnswer;
    if (!topic || !practice || !answer) { wx.showToast({ title: '先选择一个答案', icon: 'none' }); return; }
    const result = store.submitGrammar(topic, practice, answer);
    this.setData({ practiceResult: result.isCorrect ? '回答正确，继续保持' : '已加入语法错题本，稍后复盘' });
  },
  markLearned() {
    if (!this.data.selectedTopic) return;
    const id = this.data.selectedTopic.id;
    const topics = this.data.topics.map(t => t.id === id ? decorateTopic({ ...t, masteryLevel: Math.min(100, (t.masteryLevel || 0) + 40) }, t.index - 1) : t);
    const selectedTopic = topics.find(t => t.id === id);
    this.setData({ topics }, () => this.setSelected(selectedTopic));
    wx.showToast({ title: '已记录学习', icon: 'none' });
  },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
