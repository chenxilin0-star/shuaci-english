App({
  globalData: { envId: 'replace-with-your-cloud-env-id', user: null, brand: '刷词英语' },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: this.globalData.envId, traceUser: true });
    }
    const user = wx.getStorageSync('shuaci_user');
    if (user) this.globalData.user = user;
  }
});
