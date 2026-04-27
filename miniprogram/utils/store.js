const KEY = 'shuaci_learning_state';
const loop = require('./learningLoop');
function getState(openid = 'local-user') {
  const data = wx.getStorageSync(KEY);
  return data && data.wordRecords ? data : loop.createInitialState(openid);
}
function setState(state) { wx.setStorageSync(KEY, state); return state; }
function toggleFavorite(word, isFavorite) { return setState(loop.toggleFavoriteState(getState(), word, isFavorite)); }
function submitSpelling(word, answer) { const result = loop.submitSpellingAnswer(getState(), word, answer); setState(result.state); return result; }
function listFavorites() { return getState().favorites || []; }
function listMistakes() { return getState().mistakes || []; }
function markMistakeReviewed(itemId) { return setState(loop.markMistakeReviewed(getState(), itemId)); }
module.exports = { getState, setState, toggleFavorite, submitSpelling, listFavorites, listMistakes, markMistakeReviewed };
