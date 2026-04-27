const share = require('../../utils/share');
const store=require('../../utils/store'); Page({data:{items:[]}, onShow(){this.refresh();}, refresh(){this.setData({items:store.listMistakes()});}, review(e){store.markMistakeReviewed(e.currentTarget.dataset.id); this.refresh();},
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
