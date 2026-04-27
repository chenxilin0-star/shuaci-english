const share = require('../../utils/share');
const store = require('../../utils/store');
const { callCloud } = require('../../utils/api');

function mergeMistakes(local, cloud) {
  const map = new Map();
  (local || []).forEach(item => map.set(item.itemId, item));
  (cloud || []).forEach(item => {
    const localItem = map.get(item.itemId);
    if (!localItem) {
      map.set(item.itemId, item);
    } else {
      // 合并：取 wrongCount 更大的，isReviewed 以本地为准
      map.set(item.itemId, {
        ...item,
        wrongCount: Math.max(item.wrongCount || 0, localItem.wrongCount || 0),
        isReviewed: localItem.isReviewed,
        reviewCount: Math.max(item.reviewCount || 0, localItem.reviewCount || 0),
        meaning_cn: localItem.meaning_cn || item.meaning_cn || ''
      });
    }
  });
  return Array.from(map.values()).filter(m => !m.isReviewed);
}

Page({
  data: { items: [] },
  onShow() { this.refresh(); },
  refresh() {
    const localItems = store.listMistakes();
    callCloud('getMistakeBook', { itemType: 'word', limit: 100 }).then(r => {
      const cloudItems = r.data || [];
      const merged = mergeMistakes(localItems, cloudItems);
      this.setData({ items: merged });
      // 同步本地：只保留合并后的错题
      const state = store.getState();
      state.mistakes = merged;
      store.setState(state);
    }).catch(() => {
      this.setData({ items: localItems.filter(m => !m.isReviewed) });
    });
  },
  review(e) {
    const itemId = e.currentTarget.dataset.id;
    store.markMistakeReviewed(itemId);
    callCloud('updateMistakeBook', { itemId, isReviewed: true, reviewCountIncrement: 1 }).then(() => {
      this.refresh();
    }).catch(() => {
      this.refresh();
    });
  },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
