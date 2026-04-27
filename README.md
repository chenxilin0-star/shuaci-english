# 刷词英语 WeChat Mini Program MVP

刷词英语是专攻 CET-4/CET-6 的微信小程序 MVP，基于项目资料中的“微信小程序原生 + 微信云开发 CloudBase”路线实现。

## 已实现范围

- 5 个 Tab：`首页`、`词库`、`学习`、`语法`、`我的`
- 扩展页面：新手引导、单词详情、拼写练习、阅读练习、生词本、错题本
- 本地 Mock 数据 + 云函数调用封装，未开通云环境时也能预览核心流程
- 云函数：`authLogin`、`getWordBanks`、`getWordList`、`getWordDetail`、`updateWordProgress`、`getStudyProgress`、`getGrammarTopics`、`toggleFavorite`、`checkin`
- UI：按照资料规范使用主色 `#2AAE67`、卡片、圆角、rpx 间距体系
- 数据：CET4/CET6 示例词、语法、阅读题库 Seed

## 目录结构

```text
miniprogram/              小程序前端
  app.js/app.json/app.wxss
  data/                   本地示例数据
  pages/                  页面
  utils/                  API、学习逻辑、工具函数
cloudfunctions/           微信云函数
scripts/validate.js       项目静态校验
scripts/seed-cloudbase.md 云数据库初始化说明
```

## 本地运行/导入

1. 安装微信开发者工具。
2. 打开微信开发者工具 → 导入项目 → 选择本仓库根目录。
3. `AppID` 可先使用测试号；开通云开发后在 `miniprogram/app.js` 中替换 `env`。
4. 右键 `cloudfunctions/*` 上传并部署云函数。
5. 按 `scripts/seed-cloudbase.md` 初始化云数据库集合与示例数据。

## 校验

```bash
npm run validate
```

校验会检查关键文件、页面、云函数是否存在，并确认项目代码中没有旧品牌名。

## 下一步建议

- 接入正式 ECDICT/CET 数据导入脚本，替换 `miniprogram/data/mockData.js`。
- 增加微信订阅消息、打卡分享海报、Edge-TTS 音频缓存。
- 接入真实 AppID/云环境 ID 后完成端到端联调。
