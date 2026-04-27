const DEFAULT_TITLE = '刷词英语｜四六级刷词、语法和错题复盘';
const DEFAULT_PATH = '/pages/index/index';

function getShareTitle(customTitle) {
  return customTitle || DEFAULT_TITLE;
}

function onShareAppMessage(options = {}) {
  return {
    title: getShareTitle(options.title),
    path: options.path || DEFAULT_PATH
  };
}

function onShareTimeline(options = {}) {
  return {
    title: getShareTitle(options.title),
    query: options.query || ''
  };
}

module.exports = {
  DEFAULT_TITLE,
  DEFAULT_PATH,
  onShareAppMessage,
  onShareTimeline
};
