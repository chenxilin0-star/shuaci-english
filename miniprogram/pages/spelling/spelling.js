const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');
const pronunciation = require('../../utils/pronunciation');
Page({
  data:{ bankId:'cet4_core', words:[], index:0, word:null, answer:'', feedback:'', feedbackClass:'' },
  onLoad(q){ if(q.bankId) this.setData({bankId:q.bankId}); this.load(); },
  load(){ callCloud('getWordList',{bankId:this.data.bankId}).then(r=>{ const words=r.data||[]; this.setData({words, word:words[0]||null}); }); },
  onInput(e){ this.setData({answer:e.detail.value}); },
  submit(){ if(!this.data.word) return; const result = store.submitSpelling(this.data.word, this.data.answer); this.setData({ feedback: result.isCorrect ? '回答正确，熟练度提升' : `回答错误，正确答案：${this.data.word.text}，已加入错题本`, feedbackClass: result.isCorrect ? 'ok' : 'bad' }); callCloud('updateWordProgress',{ wordId:this.data.word.id, record:result.record }); },
  playAudio(){ if(this.data.word) pronunciation.playWord(this.data.word.text); },
  next(){ const words=this.data.words; if(!words.length) return; const index=(this.data.index+1)%words.length; this.setData({index, word:words[index], answer:'', feedback:'', feedbackClass:''}); }
});
