const share = require('../../utils/share');
Page({ back(){ wx.navigateBack({fail(){wx.switchTab({url:'/pages/index/index'});}}); },
  onShareAppMessage() { return share.onShareAppMessage(); },
  onShareTimeline() { return share.onShareTimeline(); }
});