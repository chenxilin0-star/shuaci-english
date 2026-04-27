const mock = require('../data/mockData');
const CLOUD_TIMEOUT_MS = 6000;

function timeoutFallback(name, data) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.warn(`[刷词英语] cloud function ${name} timeout, fallback to local data`);
      resolve(localFallback(name, data));
    }, CLOUD_TIMEOUT_MS);
  });
}

function callCloud(name, data = {}) {
  if (!wx.cloud) return Promise.resolve(localFallback(name, data));
  const cloudPromise = wx.cloud
    .callFunction({ name, data })
    .then(res => res.result)
    .catch(err => {
      console.warn(`[刷词英语] cloud function ${name} failed`, err);
      return localFallback(name, data);
    });
  return Promise.race([cloudPromise, timeoutFallback(name, data)]);
}

function inBank(word, bankId) {
  if (!bankId) return true;
  if (bankId === 'cet4_core' || bankId === 'cet4') return word.is_in_cet4 || word.bankId === 'cet4_core' || (word.bankIds || []).includes('cet4_core');
  if (bankId === 'cet6_core' || bankId === 'cet6') return word.is_in_cet6 || word.bankId === 'cet6_core' || (word.bankIds || []).includes('cet6_core');
  return word.bankId === bankId || (word.bankIds || []).includes(bankId);
}

function localFallback(name, data) {
  const get = key => wx.getStorageSync(key) || [];
  const set = (key, value) => wx.setStorageSync(key, value);
  switch (name) {
    case 'authLogin': return { success:true, data:{ openid:'mock-openid', nickName:'刷词同学', avatarUrl:'' } };
    case 'getWordBanks': return { success:true, data: mock.wordBanks };
    case 'getWordList': return { success:true, data: mock.words.filter(w => inBank(w, data.bankId)).slice(0, data.limit || 50) };
    case 'getWordDetail': return { success:true, data: mock.words.find(w => w.id === data.wordId || w.text === data.wordId) || mock.words[0] };
    case 'getStudyProgress': return { success:true, data: wx.getStorageSync('shuaci_progress') || { learnedWords:326, masteredWords:188, todayGoal:20, streakDays:12, currentIndex:0 } };
    case 'updateWordProgress': wx.setStorageSync('shuaci_progress', data); return { success:true, data };
    case 'getGrammarTopics': return { success:true, data: mock.grammarTopics.slice(0, data.limit || 100) };
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
module.exports = { callCloud, mock, localFallback };
