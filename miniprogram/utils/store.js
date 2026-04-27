const KEY = 'shuaci_learning_state';
const loop = require('./learningLoop');
function getState(openid = 'local-user') {
  const data = wx.getStorageSync(KEY);
  return data && data.wordRecords ? data : loop.createInitialState(openid);
}
function setState(state) { wx.setStorageSync(KEY, state); return state; }
function toggleFavorite(word, isFavorite) { return setState(loop.toggleFavoriteState(getState(), word, isFavorite)); }
function submitSpelling(word, answer) { const result = loop.submitSpellingAnswer(getState(), word, answer); setState(result.state); return result; }
function submitGrammar(topic, practice, answer) { const result = loop.submitGrammarAnswer(getState(), topic, practice, answer); setState(result.state); return result; }
function listFavorites() { return getState().favorites || []; }
function listMistakes(type) { const items = getState().mistakes || []; return type ? items.filter(i => i.itemType === type) : items; }
function markMistakeReviewed(itemId) { return setState(loop.markMistakeReviewed(getState(), itemId)); }
module.exports = { getState, setState, toggleFavorite, submitSpelling, submitGrammar, listFavorites, listMistakes, markMistakeReviewed };
