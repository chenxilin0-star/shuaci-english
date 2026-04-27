App({
  globalData: { envId: 'cloud1-6gy3kt0i80a1304f', user: null, brand: '刷词英语' },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: this.globalData.envId, traceUser: true });
    }
    const user = wx.getStorageSync('shuaci_user');
    if (user) this.globalData.user = user;
  }
});
