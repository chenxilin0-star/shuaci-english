const share = require('../../utils/share');
const store=require('../../utils/store'); Page({data:{items:[]}, onShow(){this.setData({items:store.listFavorites()});},
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});
