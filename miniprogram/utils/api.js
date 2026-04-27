const mock = require('../data/mockData');
function callCloud(name, data = {}) {
  if (!wx.cloud) return Promise.resolve(localFallback(name, data));
  return wx.cloud.callFunction({ name, data }).then(res => res.result).catch(() => localFallback(name, data));
}
function localFallback(name, data) {
  const get = key => wx.getStorageSync(key) || [];
  const set = (key, value) => wx.setStorageSync(key, value);
  switch (name) {
    case 'authLogin': return { success:true, data:{ openid:'mock-openid', nickName:'刷词同学', avatarUrl:'' } };
    case 'getWordBanks': return { success:true, data: mock.wordBanks };
    case 'getWordList': return { success:true, data: mock.words.filter(w => !data.bankId || w.bankId === data.bankId) };
    case 'getWordDetail': return { success:true, data: mock.words.find(w => w.id === data.wordId || w.text === data.wordId) || mock.words[0] };
    case 'getStudyProgress': return { success:true, data: wx.getStorageSync('shuaci_progress') || { learnedWords:326, masteredWords:188, todayGoal:20, streakDays:12, currentIndex:0 } };
    case 'updateWordProgress': wx.setStorageSync('shuaci_progress', data); return { success:true, data };
    case 'getGrammarTopics': return { success:true, data: mock.grammarTopics };
    case 'toggleFavorite': {
      const favorites = get('shuaci_favorites').filter(x => x.itemId !== data.itemId);
      if (data.isFavorite) favorites.unshift({ itemId:data.itemId, itemType:data.itemType || 'word', itemText:data.itemText || data.itemId, createdAt:new Date().toISOString() });
      set('shuaci_favorites', favorites);
      return { success:true, data:{ itemId:data.itemId, isFavorite: !!data.isFavorite } };
    }
    case 'getFavorites': return { success:true, data: get('shuaci_favorites') };
    case 'getMistakeBook': return { success:true, data: get('shuaci_mistakes') };
    case 'checkin': return { success:true, data:{ checked:true, streakDays:13, date:new Date().toISOString().slice(0,10) } };
    default: return { success:false, error:'unknown function ' + name };
  }
}
module.exports = { callCloud, mock };
