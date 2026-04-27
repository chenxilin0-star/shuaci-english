const { callCloud } = require('../../utils/api');
const store = require('../../utils/store');
Page({
  data:{bankId:'cet4_core',words:[],index:0,word:null,flipped:false},
  onLoad(q){ if(q.bankId) this.setData({bankId:q.bankId}); this.load(); },
  load(){ callCloud('getWordList',{bankId:this.data.bankId}).then(r=>this.setData({words:r.data||[], word:(r.data||[])[0]})); },
  flip(){ this.setData({flipped:!this.data.flipped}); },
  next(){ const i=(this.data.index+1)%this.data.words.length; const word=this.data.words[i]; this.setData({index:i, word, flipped:false}); callCloud('updateWordProgress',{currentIndex:i, learnedWords:i+1, todayGoal:20, streakDays:12}); },
  toggleFavorite(){ const word={...this.data.word,isFavorite:!this.data.word.isFavorite}; this.setData({word}); store.toggleFavorite(word, word.isFavorite); callCloud('toggleFavorite',{itemId:word.id,itemType:'word',itemText:word.text,isFavorite:word.isFavorite}); },
  goSpell(){ wx.navigateTo({url:'/pages/spelling/spelling?bankId='+this.data.bankId}); },
  goDetail(){ wx.navigateTo({url:'/pages/word-detail/word-detail?wordId='+this.data.word.id}); }
});