function getPronunciationUrl(word, type = 2) {
  const text = String(word || '').trim();
  if (!text) return '';
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;
}

function playWord(word, type = 2) {
  const url = getPronunciationUrl(word, type);
  if (!url) {
    wx.showToast({ title: '暂无可播放单词', icon: 'none' });
    return null;
  }
  const audio = wx.createInnerAudioContext();
  audio.autoplay = true;
  audio.src = url;
  audio.onError(() => {
    audio.destroy();
    wx.showToast({ title: '发音加载失败，请检查网络/域名配置', icon: 'none' });
  });
  audio.onEnded(() => audio.destroy());
  audio.onStop(() => audio.destroy());
  return audio;
}

module.exports = { getPronunciationUrl, playWord };
