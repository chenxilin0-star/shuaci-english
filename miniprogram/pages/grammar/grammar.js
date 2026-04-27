const { callCloud } = require('../../utils/api');

function decorateTopic(topic, index) {
  const mastery = topic.masteryLevel || 0;
  return {
    ...topic,
    masteryLabel: mastery >= 80 ? '已掌握' : mastery >= 40 ? '复习中' : '待学习',
    masteryPercent: mastery,
    index: index + 1,
    tipText: (topic.examTips || [])[0] || '先识别考点，再判断结构。',
    example: (topic.examples || [])[0] || {},
    firstPractice: (topic.practice || [])[0] || {}
  };
}

Page({
  data: {
    topics: [],
    filtered: [],
    categories: ['全部'],
    active: '全部',
    selectedTopic: null,
    search: '',
    masteryLabel: '待学习'
  },
  onShow() {
    callCloud('getGrammarTopics').then(r => {
      const topics = (r.data || []).map(decorateTopic);
      const cats = ['全部', ...new Set(topics.map(t => t.category))];
      this.setData({ topics, categories: cats, filtered: topics, selectedTopic: topics[0] || null, masteryLabel: topics[0]?.masteryLabel || '待学习' });
    });
  },
  select(e) {
    const active = e.currentTarget.dataset.cat;
    this.applyFilter(active, this.data.search);
  },
  onSearch(e) {
    this.applyFilter(this.data.active, e.detail.value || '');
  },
  applyFilter(active, search) {
    const kw = String(search || '').trim().toLowerCase();
    const filtered = this.data.topics.filter(t => {
      const byCat = active === '全部' || t.category === active;
      const byKw = !kw || `${t.title} ${t.summary} ${t.category}`.toLowerCase().includes(kw);
      return byCat && byKw;
    });
    this.setData({ active, search, filtered, selectedTopic: filtered[0] || null, masteryLabel: filtered[0]?.masteryLabel || '待学习' });
  },
  selectTopic(e) {
    const id = e.currentTarget.dataset.id;
    const selectedTopic = this.data.topics.find(t => t.id === id);
    if (selectedTopic) this.setData({ selectedTopic, masteryLabel: selectedTopic.masteryLabel });
  },
  markLearned() {
    if (!this.data.selectedTopic) return;
    const id = this.data.selectedTopic.id;
    const topics = this.data.topics.map(t => t.id === id ? decorateTopic({ ...t, masteryLevel: Math.min(100, (t.masteryLevel || 0) + 40) }, t.index - 1) : t);
    const selectedTopic = topics.find(t => t.id === id);
    this.setData({ topics, selectedTopic, masteryLabel: selectedTopic.masteryLabel });
    wx.showToast({ title: '已记录学习', icon: 'none' });
  }
});
