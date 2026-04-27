# 刷词英语上线配置说明

## 1. 小程序后台配置

- 小程序名称：刷词英语
- 类目建议：教育 / 在线教育 或 工具 / 效率
- 服务内容：CET-4/CET-6 词汇学习、拼写练习、语法学习
- 隐私说明：收集 openid、学习进度、收藏与错题记录；不强制手机号

## 2. 云开发环境变量

在 `miniprogram/app.js` 设置：

```js
globalData: { envId: '正式云环境ID', brand: '刷词英语' }
```

## 3. 数据库权限建议

MVP 阶段：

- `word_banks`, `words`, `grammar_topics`, `reading_passages`：所有用户可读，仅管理员可写
- `users`, `user_progress`, `user_word_records`, `favorites`, `mistake_books`, `checkins`：仅创建者可读写

## 4. 上传前检查

```bash
npm test
npm run validate
node scripts/init-cloudbase.js --dry-run
node scripts/import-cloudbase-data.js --dry-run --input=data/processed/cet_words.sample.json
```

## 5. 版本号建议

- `0.1.0`：当前 MVP，可内部体验
- `0.2.0`：接入正式 ECDICT 词库与 CloudBase 真实数据
- `0.3.0`：加入 Edge-TTS 音频缓存、阅读题、打卡分享
- `1.0.0`：提交微信审核上线

## 6. 审核风险与规避

- 词库版权：优先使用 ECDICT MIT 数据，并在关于页声明开源许可
- 用户隐私：隐私弹窗中说明学习数据用途
- 内容安全：阅读材料和例句避免敏感内容
- 付费能力：前期免费，不展示未开通的支付入口
