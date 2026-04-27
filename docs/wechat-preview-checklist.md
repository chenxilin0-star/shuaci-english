# 刷词英语真机预览调试清单

> 说明：当前执行环境没有微信开发者工具 GUI，无法替你点击「真机预览」。本清单用于在本地微信开发者工具中逐项验证。

## 一、导入项目

- 项目目录：`/root/shuaci-english`
- `miniprogramRoot`：`miniprogram/`
- `cloudfunctionRoot`：`cloudfunctions/`
- AppID：替换 `project.config.json` 中的 `appid`
- 云环境：替换 `miniprogram/app.js` 中 `envId`

## 二、云开发准备

1. 开通云开发环境。
2. 执行集合初始化：
   ```bash
   CLOUDBASE_ENV=你的环境ID node scripts/init-cloudbase.js
   ```
3. 生成并导入词库：
   ```bash
   node scripts/clean-ecdict-cet.js --input=data/samples/ecdict_sample.csv --output=data/processed/cet_words.sample.json
   CLOUDBASE_ENV=你的环境ID node scripts/import-cloudbase-data.js --input=data/processed/cet_words.sample.json
   ```
4. 微信开发者工具中右键 `cloudfunctions/*` 上传部署。

## 三、真机预览核心路径

### 首页

- 能显示品牌「刷词英语」
- 今日已学、连续打卡、每日一句显示正常
- 「开始」能进入学习页

### 词库

- 能显示 CET-4 / CET-6 词库
- 点击词库能进入对应学习页

### 学习页

- 单词卡片点击能翻转
- 收藏按钮能写入生词本
- 下一个能推进进度
- 拼写练习入口可进入

### 拼写练习

- 输入错误拼写后显示正确答案
- 错词自动进入错题本
- 输入正确拼写后显示正确反馈

### 生词本 / 错题本

- 「我的」→ 生词本能看到收藏词
- 「我的」→ 错题本能看到错拼词
- 错题可点击「已复习」改变本地状态

## 四、真机重点注意

- iPhone 刘海屏底部安全区是否遮挡按钮
- Android 软键盘是否挡住拼写输入框
- 网络断开时本地 fallback 是否仍可学习
- 首次打开未登录时是否仍可看 Mock 数据
- 云函数失败时页面不应白屏

## 五、暂未自动化项

- 微信授权昵称/头像：需真实 AppID 真机授权验证
- 云函数权限：需云开发控制台确认集合读写权限
- 订阅消息与分享海报：后续版本接入
