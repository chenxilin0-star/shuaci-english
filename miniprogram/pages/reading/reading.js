const share = require('../../utils/share');
const { callCloud } = require('../../utils/api');
Page({
  data: { passages: [], index: 0, passage: null, answers: {}, result: null },
  onShow() {
    callCloud('getWordList', { bankId: 'reading', limit: 5 }).then(() => {
      // 本地模拟阅读材料
      const passages = [
        { id:'r001', title:'The Habit of Review', category:'cet4', difficulty:2, passageText:'Vocabulary learning is not about memorizing a long list once. Effective learners review words repeatedly and use them in context. Short daily sessions often work better than a single long session before an exam.', questions:[{ id:'q1', questionText:'What is the main idea of the passage?', options:{A:'Long lists are enough', B:'Review and context improve vocabulary learning', C:'Exams are easy', D:'Daily learning is useless'}, correctAnswer:'B', explanation:'文章强调重复复习和语境使用。' }] }
      ];
      this.setData({ passages, passage: passages[0] || null });
    }).catch(() => {
      this.setData({ passages: [], passage: null });
    });
  },
  chooseAnswer(e) {
    const { qid, ans } = e.currentTarget.dataset;
    this.setData({ answers: { ...this.data.answers, [qid]: ans } });
  },
  submit() {
    const passage = this.data.passage;
    if (!passage || !passage.questions) return;
    let correct = 0;
    passage.questions.forEach(q => {
      if (this.data.answers[q.id] === q.correctAnswer) correct += 1;
    });
    this.setData({ result: { correct, total: passage.questions.length } });
  },
  back() { wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/index/index' }); } }); },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
