const share = require('../../utils/share');
const store = require('../../utils/store');
const { callCloud } = require('../../utils/api');

function mergeById(local, cloud) {
  const map = new Map();
  (local || []).forEach(item => map.set(item.itemId, item));
  (cloud || []).forEach(item => {
    if (!map.has(item.itemId)) map.set(item.itemId, item);
  });
  return Array.from(map.values());
}

Page({
  data: { items: [] },
  onShow() {
    const localItems = store.listFavorites();
    callCloud('getFavorites', { itemType: 'word', limit: 100 }).then(r => {
      const cloudItems = r.data || [];
      const merged = mergeById(localItems, cloudItems);
      this.setData({ items: merged });
      // 同步本地
      const state = store.getState();
      state.favorites = merged;
      store.setState(state);
    }).catch(() => {
      this.setData({ items: localItems });
    });
  },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
