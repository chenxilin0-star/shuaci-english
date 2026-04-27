const share = require('../../utils/share');
Page({
  data: {
    features: [
      { icon: '📚', title: '双核词库', desc: 'CET-4 核心 3846 词 + CET-6 新增 1956 词，精准覆盖大学英语四六级考试大纲' },
      { icon: '🎯', title: '科学模式', desc: '新词推进 35 + 复习巩固 10 + 错题回炉 5，每日 50 词量化目标，对抗遗忘曲线' },
      { icon: '✍️', title: '拼写训练', desc: '听写拼写强化肌肉记忆，拼写错误自动收录错题本，针对性复盘' },
      { icon: '🧩', title: '语法专项', desc: '四六级高频语法考点拆解，例句+练习+错题本形成完整学习闭环' },
      { icon: '☁️', title: '云端同步', desc: '本地+云端双备份，换设备登录学习记录不丢，微信一键登录即学' },
      { icon: '📊', title: '数据追踪', desc: '连续打卡天数、已学词汇量、掌握词汇量、错题统计，可视化成长轨迹' }
    ],
    modes: [
      { title: '新词模式', desc: '每天推进 35 个新词，优先高频核心词，适合系统备考四级、六级' },
      { title: '复习模式', desc: '40 复习 + 10 错词，不塞新词，适合考前巩固和周期性复盘' },
      { title: '错题模式', desc: '优先错词回炉，不够再用复习词补位，专治反复忘记的单词' }
    ],
    audiences: [
      '正在备考 CET-4 / CET-6 的大学生',
      '英语基础薄弱、需要系统提升词汇量的学习者',
      '考前冲刺、需要高效复习核心高频词的考生',
      '想利用碎片时间每天背单词的职场人士'
    ],
    keywords: '刷词英语、四六级背单词、CET4词汇、CET6词汇、大学英语四级、大学英语六级、英语单词、背单词小程序、四六级备考、英语词汇、高频词、核心词汇、单词拼写、语法专项、生词本、错题本、学习打卡'
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '关于刷词英语｜四六级背单词神器' });
  },
  back() { wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/profile/profile' }); } }); },
  onShareAppMessage() { return share.onShareAppMessage({ title: '刷词英语｜四六级背单词神器，CET4/CET6核心词库' }); },
  onShareTimeline() { return share.onShareTimeline({ title: '刷词英语｜四六级背单词神器，CET4/CET6核心词库' }); }
});
