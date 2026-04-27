# CET-4/CET-6 微信小程序 — 技术架构方案

> **版本**: v1.0  
> **日期**: 2025年1月  
> **适用范围**: 微信小程序原生开发 + 微信云开发（CloudBase）  
> **目标用户**: CET-4/CET-6 备考学生，前期完全免费

---

## 目录

1. [小程序云开发可行性评估](#1-小程序云开发可行性评估)
2. [数据库设计](#2-数据库设计)
3. [云函数设计](#3-云函数设计)
4. [用户认证方案](#4-用户认证方案)
5. [存储方案](#5-存储方案)
6. [外部依赖与接口](#6-外部依赖与接口)
7. [性能与安全](#7-性能与安全)
8. [开发里程碑建议](#8-开发里程碑建议)

---

## 1. 小程序云开发可行性评估

### 1.1 云开发能力矩阵

| 能力维度 | 是否支持 | 满足度 | 说明 |
|---------|---------|--------|------|
| 用户鉴权（微信登录） | ✅ 原生支持 | 100% | `wx.login` + 云函数 `getWXContext` 获取 openid |
| 数据存储（文档型DB） | ✅ 原生支持 | 95% | MongoDB-like 文档数据库，适合本业务 |
| 服务端逻辑（云函数） | ✅ 原生支持 | 90% | Node.js 运行时，支持 npm 依赖 |
| 文件存储（云存储） | ✅ 原生支持 | 100% | 音频、图片等静态资源存储 |
| 定时任务（云函数触发器） | ✅ 支持 | 80% | 支持定时触发器，但精度有限（分钟级） |
| 外部 HTTP 调用 | ✅ 支持 | 95% | 云函数内可使用 `axios` / `node-fetch` 调用外部 API |
| WebSocket 实时通信 | ⚠️ 有限支持 | 60% | 小程序端有 WebSocket API，但云开发无原生 WebSocket 网关 |
| 复杂事务/跨表原子操作 | ❌ 不支持 | 30% | 无多表事务，需通过单文档设计或补偿逻辑规避 |
| 全文检索（模糊搜索） | ⚠️ 有限支持 | 50% | 仅支持正则匹配，大数据量性能差；需借助外部搜索或前端索引 |
| 数据聚合（复杂报表） | ⚠️ 有限支持 | 60% | 云数据库聚合能力有限，复杂统计建议前端分批聚合 |
| 订阅消息推送 | ✅ 支持 | 100% | 微信小程序订阅消息模板 |
| 分享卡片 | ✅ 支持 | 100% | 小程序原生 `onShareAppMessage` |

**结论**：云开发能支撑本项目 **90% 以上的技术需求**，仅有复杂事务和全文检索需要额外设计规避。

### 1.2 云开发 vs 自建后端对比

| 对比维度 | 微信云开发 | 自建后端（Node.js + MySQL/PostgreSQL） | 推荐 |
|---------|-----------|-------------------------------------|------|
| **开发效率** | ⭐⭐⭐⭐⭐ 免运维，前后端一体，快速上线 | ⭐⭐⭐ 需搭建服务器、配置数据库、部署CI/CD | **云开发** |
| **初期成本** | ⭐⭐⭐⭐⭐ 免费额度够用前期 | ⭐⭐ 服务器+域名+数据库，月均 100~500 元 | **云开发** |
| **运维成本** | ⭐⭐⭐⭐⭐ 零运维，自动扩缩容 | ⭐⭐ 需监控、备份、安全补丁、日志收集 | **云开发** |
| **扩展性** | ⭐⭐⭐ 有存储/流量上限，超量后费用递增 | ⭐⭐⭐⭐⭐ 完全可控，可水平扩展 | 自建后端 |
| **灵活性** | ⭐⭐⭐ 受微信生态限制，无法自定义域名 | ⭐⭐⭐⭐⭐ 完全自主，可对接任意第三方 | 自建后端 |
| **数据库能力** | ⭐⭐⭐ 文档型，无事务，无复杂聚合 | ⭐⭐⭐⭐⭐ 关系型，强事务，复杂查询 | 自建后端 |
| **团队技能要求** | ⭐⭐⭐⭐ 仅需前端+小程序知识 | ⭐⭐⭐ 需后端、DevOps、数据库优化 | **云开发** |
| **上线周期（MVP）** | 2~4 周 | 6~10 周 | **云开发** |

**推荐策略**：
- **MVP 阶段（0~6 个月）**：采用微信云开发，快速验证产品、积累用户。
- **用户量增长期（6~12 个月，日活 > 1 万）**：评估云开发费用，若成本过高可逐步迁移核心数据到自建后端，保留小程序前端。
- **长期（> 1 年）**：若商业化成功，建议自建后端以获得完全控制权。

### 1.3 云开发免费额度与成本预估

#### 免费额度（当前政策）

| 资源类型 | 免费额度 | 本项目预估用量 | 是否够用 |
|---------|---------|--------------|---------|
| 云函数调用次数 | 5 万次/月 | 初期 < 1 万次/月 | ✅ 充足 |
| 云函数资源使用（GBs） | 4 GBs/月 | 低 | ✅ 充足 |
| 云数据库存储容量 | 2 GB | 预计 50~100 MB（不含音频） | ✅ 充足 |
| 云数据库读操作 | 5 万次/天 | 需合理设计缓存 | ✅ 够用 |
| 云数据库写操作 | 3 万次/天 | 学习进度、签到等写入 | ✅ 够用 |
| 云存储容量 | 5 GB | 音频文件可能超量 | ⚠️ 需关注 |
| 云存储下载流量 | 5 GB/月 | 音频播放消耗流量 | ⚠️ 需关注 |
| CDN 回源流量 | 5 GB/月 | 图片/音频分发 | ⚠️ 需关注 |

#### 用户增长后成本预估

| 用户规模 | 日活估算 | 月均云开发费用预估 | 关键消耗点 |
|---------|---------|------------------|-----------|
| 1,000 用户 | 100 DAU | **0 元**（免费额度内） | 无 |
| 5,000 用户 | 500 DAU | **0~20 元/月** | 云函数调用、数据库读写 |
| 10,000 用户 | 1,500 DAU | **20~80 元/月** | 数据库读、云存储流量 |
| 50,000 用户 | 5,000 DAU | **100~300 元/月** | 数据库读/写、存储流量 |
| 100,000 用户 | 12,000 DAU | **300~800 元/月** | 全资源均需付费 |

> **成本优化建议**：
> 1. TTS 音频尽量利用客户端缓存（`wx.getStorage`），减少重复下载。
> 2. 单词/句子等静态数据可打包到小程序本地或利用本地存储缓存。
> 3. 图片资源使用 CDN 压缩 + 懒加载。
> 4. 监控云开发控制台账单，设置用量告警。

### 1.4 云开发无法满足的功能及替代方案

| 无法满足的功能 | 替代方案 | 实施复杂度 |
|--------------|---------|----------|
| 复杂多表事务 | 单文档内嵌设计 + 云函数补偿逻辑 | 中等 |
| 全文检索（单词模糊搜索） | 前端建立倒排索引缓存 + 前缀匹配 | 中等 |
| 大数据量聚合统计 | 云函数定时任务预计算 + 汇总集合 | 中等 |
| 实时多人协作 | 小程序 WebSocket + 自建信令服务 | 高（本业务不需要） |
| 高精度定时任务 | 外部定时任务服务（如 GitHub Actions / 云厂商定时触发器）触发云函数 HTTP 接口 | 低 |
| 高并发 TTS 请求 | 引入外部 TTS 缓存层（Redis + CDN）或自建 TTS 代理服务 | 中等 |
| 离线语音识别 | 小程序不支持，暂不实现 | — |

---

## 2. 数据库设计

### 2.1 设计原则

1. **以用户为中心**：每个用户的学习数据独立，通过 `openid` 关联。
2. **内嵌优先**：一对少（1:N 且 N<100）的关系优先内嵌，减少查询次数。
3. **引用解耦**：一对多且数据量大、或需独立更新的场景使用引用（`doc_id`）。
4. **静态数据分离**：单词、句子等基础数据不关联用户，单独集合存储。
5. **避免深层嵌套**：内嵌数组不超过 2 层，单个文档大小控制在 2MB 以内。

### 2.2 集合总览

| 序号 | 集合名 | 类型 | 预估数据量 | 说明 |
|-----|--------|------|-----------|------|
| 1 | `users` | 用户数据 | 1 万~10 万条 | 每个用户一条 |
| 2 | `word_banks` | 词库配置 | 2~5 条 | CET-4、CET-6 等 |
| 3 | `words` | 单词数据 | ~10,000 条 | CET-4(4500) + CET-6(5500) |
| 4 | `sentence_banks` | 句子库配置 | 2~5 条 | 如阅读素材库 |
| 5 | `sentences` | 句子数据 | ~2,000 条 | 阅读理解相关 |
| 6 | `grammar_topics` | 语法知识点 | ~100 条 | 四六级高频语法 |
| 7 | `user_progress` | 用户学习进度 | 1 万~10 万条 | 每用户每词库一条 |
| 8 | `user_word_records` | 用户单词学习记录 | 50 万~500 万条 | 学习过的单词状态 |
| 9 | `user_sentence_records` | 用户句子学习记录 | 10 万~100 万条 | 句子学习/答题记录 |
| 10 | `mistake_books` | 错题本 | 5 万~50 万条 | 错题记录 |
| 11 | `favorites` | 收藏记录 | 5 万~50 万条 | 收藏单词/句子 |
| 12 | `learning_sessions` | 学习会话（听写/拼写） | 10 万~100 万条 | 每次练习一个会话 |
| 13 | `learning_logs` | 学习时长日志 | 30 万~300 万条 | 每日学习时长记录 |
| 14 | `checkins` | 签到记录 | 30 万~300 万条 | 每日签到 |
| 15 | `reading_passages` | 阅读理解文章 | ~200 条 | 四六级阅读真题/模拟题 |
| 16 | `reading_questions` | 阅读题目 | ~1,000 条 | 每篇文章 5 题 |
| 17 | `tts_cache` | TTS 音频缓存索引 | ~20,000 条 | 已生成 TTS 的音频索引 |
| 18 | `rate_limits` | 频率限制记录 | 动态清理 | 限流令牌桶数据 |

### 2.3 核心集合详细设计

#### 2.3.1 `users` — 用户表

```json
{
  "_id": "auto",
  "openid": "string (required, unique, index)",
  "unionid": "string (optional)",
  "nickName": "string (optional)",
  "avatarUrl": "string (optional)",
  "phone": "string (optional)",
  "createdAt": "Date (required, index)",
  "lastLoginAt": "Date (required)",
  "stats": {
    "totalStudyDays": "number (default: 0)",
    "totalStudyMinutes": "number (default: 0)",
    "totalWordsLearned": "number (default: 0)",
    "totalWordsMastered": "number (default: 0)",
    "streakDays": "number (default: 0)",
    "lastCheckinDate": "Date"
  },
  "settings": {
    "dailyWordGoal": "number (default: 20)",
    "ttsVoice": "enum ['us', 'uk'] (default: 'us')",
    "autoPlayAudio": "boolean (default: true)",
    "notificationEnabled": "boolean (default: true)",
    "studyRemindTime": "string (default: '20:00')"
  },
  "currentBankId": "string (optional, ref: word_banks._id)"
}
```

| 字段 | 类型 | 必填 | 索引 | 说明 |
|------|------|------|------|------|
| openid | string | ✅ | 唯一索引 | 微信用户唯一标识 |
| unionid | string | ❌ | — | 多应用打通时使用 |
| nickName | string | ❌ | — | 微信昵称 |
| avatarUrl | string | ❌ | — | 头像 URL |
| phone | string | ❌ | — | 手机号，前期不强制绑定 |
| createdAt | Date | ✅ | 索引 | 注册时间 |
| lastLoginAt | Date | ✅ | — | 最后登录时间 |
| stats | Object | ✅ | — | 汇总统计数据（反冗余，减少查询） |
| settings | Object | ✅ | — | 用户个性化设置 |
| currentBankId | string | ❌ | — | 当前学习的词库 |

**索引建议**：
```javascript
db.collection('users').createIndex({ openid: 1 }, { unique: true })
db.collection('users').createIndex({ createdAt: -1 })
```

#### 2.3.2 `word_banks` — 词库表

```json
{
  "_id": "auto",
  "name": "string (required)",
  "code": "string (required, unique)",
  "description": "string (optional)",
  "category": "enum ['cet4', 'cet6', 'custom'] (required)",
  "totalWords": "number (required)",
  "coverImage": "string (optional, 云存储URL)",
  "difficultyRange": {
    "min": "number",
    "max": "number"
  },
  "isActive": "boolean (default: true)",
  "createdAt": "Date (required)"
}
```

**数据示例**：

| _id | name | code | category | totalWords |
|-----|------|------|---------|-----------|
| wb001 | 四级核心词汇 | cet4_core | cet4 | 4500 |
| wb002 | 六级核心词汇 | cet6_core | cet6 | 5500 |

#### 2.3.3 `words` — 单词表（核心静态数据）

```json
{
  "_id": "auto",
  "bankId": "string (required, index)",
  "text": "string (required, index)",
  "phonetic": "string (optional)",
  "phonetic_us": "string (optional)",
  "phonetic_uk": "string (optional)",
  "pos": "string (optional, 词性)",
  "meaning_cn": "string (required)",
  "meanings": [
    {
      "pos": "string",
      "definition": "string"
    }
  ],
  "example_sentence": "string (optional)",
  "example_sentences": [
    {
      "en": "string",
      "cn": "string"
    }
  ],
  "audio_url_us": "string (optional, 云存储URL或外部URL)",
  "audio_url_uk": "string (optional)",
  "difficulty_level": "number (1-5, default: 3, index)",
  "frequency_tag": "enum ['high', 'medium', 'low'] (index)",
  "collocations": ["string"],
  "synonyms": ["string"],
  "antonyms": ["string"],
  "tags": ["string"],
  "createdAt": "Date"
}
```

| 字段 | 类型 | 必填 | 索引 | 说明 |
|------|------|------|------|------|
| bankId | string | ✅ | 普通索引 | 所属词库 |
| text | string | ✅ | 普通索引 | 单词文本（小写存储） |
| phonetic | string | ❌ | — | 音标 |
| meaning_cn | string | ✅ | — | 中文释义 |
| example_sentence | string | ❌ | — | 例句（主例句） |
| audio_url_us | string | ❌ | — | 美音发音 URL |
| audio_url_uk | string | ❌ | — | 英音发音 URL |
| difficulty_level | number | ❌ | 普通索引 | 难度 1-5 |
| frequency_tag | string | ❌ | 普通索引 | 考频标签 |

**索引建议**：
```javascript
db.collection('words').createIndex({ bankId: 1, difficulty_level: 1 })
db.collection('words').createIndex({ bankId: 1, frequency_tag: 1 })
db.collection('words').createIndex({ text: 1 })  // 用于精确查找
db.collection('words').createIndex({ bankId: 1, _id: 1 })  // 分页查询
```

> **关于全文检索的说明**：云数据库不支持全文索引，单词搜索建议采用以下策略：
> 1. 精确匹配：直接按 `text` 字段查询。
> 2. 前缀搜索：使用正则 `/^abc/`（利用索引前缀）。
> 3. 模糊搜索：前端缓存单词列表（10,000 条约 2MB JSON），在内存中过滤。
> 4. 生僻词搜索：若数据量大，可引入外部搜索服务（如 Algolia 免费版）。

#### 2.3.4 `sentences` — 句子表

```json
{
  "_id": "auto",
  "bankId": "string (required, index)",
  "text_en": "string (required)",
  "text_cn": "string (required)",
  "audio_url": "string (optional)",
  "key_words": ["string"],
  "difficulty_level": "number (1-5)",
  "category": "enum ['listening', 'reading', 'translation', 'writing']",
  "tags": ["string"],
  "source": "string (optional, 来源)",
  "createdAt": "Date"
}
```

#### 2.3.5 `grammar_topics` — 语法知识点表

```json
{
  "_id": "auto",
  "title": "string (required)",
  "category": "string (required, index)",
  "content": "string (required, Markdown格式)",
  "examples": [
    {
      "en": "string",
      "cn": "string"
    }
  ],
  "relatedWords": ["string"],
  "order": "number (用于排序)",
  "isActive": "boolean (default: true)",
  "createdAt": "Date"
}
```

#### 2.3.6 `user_progress` — 用户学习进度（每用户每词库一条）

```json
{
  "_id": "auto",
  "openid": "string (required, index)",
  "bankId": "string (required, index)",
  "bankCode": "string (required)",
  "totalWords": "number (词库总单词数)",
  "learnedWords": "number (已学数量)",
  "masteredWords": "number (已掌握数量)",
  "newWordsToday": "number (今日新学)",
  "reviewWordsToday": "number (今日复习)",
  "todayGoal": "number (default: 20)",
  "lastStudyDate": "Date",
  "currentIndex": "number (学习进度索引)",
  "wordStatusMap": {
    "wordId_1": "enum ['new', 'learning', 'review', 'mastered']",
    "wordId_2": "..."
  },
  "updatedAt": "Date (required)"
}
```

> **设计说明**：`wordStatusMap` 采用 Map 结构存储每个单词的状态。考虑到单个用户学习单词最多 10,000 个，Map 的 key-value 存储是可控的（约 100KB~500KB）。若未来扩展更大词库，可将 `wordStatusMap` 拆分到独立集合 `user_word_records`。

**索引建议**：
```javascript
db.collection('user_progress').createIndex({ openid: 1, bankId: 1 }, { unique: true })
db.collection('user_progress').createIndex({ openid: 1, lastStudyDate: -1 })
```

#### 2.3.7 `user_word_records` — 用户单词学习记录（细粒度记录）

```json
{
  "_id": "auto",
  "openid": "string (required, index)",
  "wordId": "string (required, index)",
  "bankId": "string (required)",
  "wordText": "string (required, 冗余加速查询)",
  "status": "enum ['new', 'learning', 'review', 'mastered'] (required, index)",
  "familiarity": "number (0-100, 熟练度)",
  "wrongCount": "number (default: 0)",
  "correctCount": "number (default: 0)",
  "lastStudyAt": "Date",
  "nextReviewAt": "Date (index, 用于复习提醒)",
  "firstStudyAt": "Date",
  "masteredAt": "Date",
  "isFavorite": "boolean (default: false, index)",
  "isInMistakeBook": "boolean (default: false, index)",
  "updatedAt": "Date (required)"
}
```

**索引建议**：
```javascript
db.collection('user_word_records').createIndex({ openid: 1, status: 1, nextReviewAt: 1 })
db.collection('user_word_records').createIndex({ openid: 1, wordId: 1 }, { unique: true })
db.collection('user_word_records').createIndex({ openid: 1, isFavorite: 1 })
db.collection('user_word_records').createIndex({ openid: 1, isInMistakeBook: 1 })
```

#### 2.3.8 `reading_passages` — 阅读理解文章

```json
{
  "_id": "auto",
  "title": "string (required)",
  "category": "enum ['cet4', 'cet6'] (required, index)",
  "type": "enum ['real', 'simulated'] (required)",
  "year": "number (optional, 真题年份)",
  "month": "number (optional, 真题月份)",
  "passageText": "string (required, 文章正文)",
  "translation": "string (optional, 全文翻译)",
  "wordCount": "number",
  "difficulty": "number (1-5)",
  "tags": ["string"],
  "keyVocabulary": [
    {
      "word": "string",
      "meaning": "string"
    }
  ],
  "isActive": "boolean (default: true)",
  "createdAt": "Date"
}
```

#### 2.3.9 `reading_questions` — 阅读题目

```json
{
  "_id": "auto",
  "passageId": "string (required, index)",
  "category": "enum ['cet4', 'cet6'] (required)",
  "questionNumber": "number (1-5)",
  "questionText": "string (required)",
  "options": {
    "A": "string",
    "B": "string",
    "C": "string",
    "D": "string"
  },
  "correctAnswer": "enum ['A', 'B', 'C', 'D'] (required)",
  "explanation": "string (解析)",
  "questionType": "enum ['detail', 'inference', 'main_idea', 'vocabulary', 'attitude']",
  "relatedParagraph": "number (optional)",
  "difficulty": "number (1-5)",
  "isActive": "boolean (default: true)"
}
```

#### 2.3.10 `mistake_books` — 错题本

```json
{
  "_id": "auto",
  "openid": "string (required, index)",
  "itemType": "enum ['word', 'sentence', 'reading'] (required, index)",
  "itemId": "string (required)",
  "itemText": "string (required, 冗余)",
  "wrongAnswer": "string (optional)",
  "correctAnswer": "string (optional)",
  "context": "string (optional, 题目上下文)",
  "wrongCount": "number (default: 1)",
  "lastWrongAt": "Date (required)",
  "isReviewed": "boolean (default: false)",
  "reviewCount": "number (default: 0)",
  "notes": "string (用户笔记)",
  "createdAt": "Date (required)"
}
```

#### 2.3.11 `favorites` — 收藏记录

```json
{
  "_id": "auto",
  "openid": "string (required, index)",
  "itemType": "enum ['word', 'sentence', 'grammar', 'passage'] (required, index)",
  "itemId": "string (required)",
  "itemText": "string (required, 冗余)",
  "createdAt": "Date (required, index)"
}
```

#### 2.3.12 `learning_sessions` — 学习会话（听写/拼写/阅读练习）

```json
{
  "_id": "auto",
  "openid": "string (required, index)",
  "sessionType": "enum ['dictation', 'spelling', 'reading', 'word_quiz'] (required, index)",
  "bankId": "string (optional)",
  "passageId": "string (optional)",
  "items": [
    {
      "itemId": "string",
      "itemText": "string",
      "userAnswer": "string",
      "correctAnswer": "string",
      "isCorrect": "boolean",
      "timeSpent": "number (秒)"
    }
  ],
  "totalItems": "number",
  "correctCount": "number",
  "wrongCount": "number",
  "accuracy": "number (0-1)",
  "timeSpent": "number (总耗时秒)",
  "startedAt": "Date",
  "completedAt": "Date (index)",
  "createdAt": "Date"
}
```

#### 2.3.13 `learning_logs` — 学习时长日志

```json
{
  "_id": "auto",
  "openid": "string (required, index)",
  "date": "string (YYYY-MM-DD, required, index)",
  "minutes": "number (default: 0)",
  "wordCount": "number (default: 0)",
  "sessionCount": "number (default: 0)",
  "activities": [
    {
      "type": "enum ['word', 'sentence', 'reading', 'grammar']",
      "minutes": "number"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**索引建议**：
```javascript
db.collection('learning_logs').createIndex({ openid: 1, date: -1 }, { unique: true })
```

#### 2.3.14 `checkins` — 签到记录

```json
{
  "_id": "auto",
  "openid": "string (required, index)",
  "date": "string (YYYY-MM-DD, required, index)",
  "checkinAt": "Date (required)",
  "consecutiveDays": "number (default: 1)",
  "rewardPoints": "number (default: 0)",
  "createdAt": "Date"
}
```

**索引建议**：
```javascript
db.collection('checkins').createIndex({ openid: 1, date: -1 }, { unique: true })
```

#### 2.3.15 `tts_cache` — TTS 音频缓存索引

```json
{
  "_id": "auto",
  "text": "string (required, unique index)",
  "voice": "enum ['us', 'uk'] (required)",
  "language": "string (default: 'en')",
  "audioUrl": "string (required, 云存储URL)",
  "fileId": "string (云存储文件ID)",
  "size": "number (字节)",
  "duration": "number (秒, optional)",
  "hitCount": "number (default: 0)",
  "lastHitAt": "Date",
  "createdAt": "Date"
}
```

> **设计说明**：`tts_cache` 仅存储音频元数据和云存储地址，不存储二进制文件。音频文件实际存储在云存储中。

### 2.4 关系设计总览图

```
┌─────────────────┐       ┌─────────────────┐
│   word_banks    │◄──────│     words       │
│   (词库配置)     │  1:N  │  (单词静态数据)  │
└─────────────────┘       └─────────────────┘
         ▲
         │
┌─────────────────┐       ┌─────────────────┐
│     users       │◄──────│  user_progress  │
│   (用户表)       │  1:N  │ (用户学习进度)   │
└─────────────────┘       └─────────────────┘
         │
         ├──► user_word_records (用户单词记录)  1:N
         ├──► learning_sessions (学习会话)      1:N
         ├──► mistake_books (错题本)            1:N
         ├──► favorites (收藏)                  1:N
         ├──► learning_logs (学习日志)          1:N
         └──► checkins (签到)                   1:N

┌─────────────────┐       ┌─────────────────┐
│reading_passages │◄──────│reading_questions│
│ (阅读文章)       │  1:N  │  (阅读题目)      │
└─────────────────┘       └─────────────────┘
```

### 2.5 数据量预估汇总

| 集合 | 单条大小 | 总条数 | 总存储 |
|------|---------|--------|--------|
| `words` | ~1 KB | 10,000 | ~10 MB |
| `sentences` | ~2 KB | 2,000 | ~4 MB |
| `reading_passages` | ~10 KB | 200 | ~2 MB |
| `reading_questions` | ~1 KB | 1,000 | ~1 MB |
| `grammar_topics` | ~5 KB | 100 | ~0.5 MB |
| `users` | ~2 KB | 10,000 | ~20 MB |
| `user_progress` | ~100 KB | 10,000 | ~100 MB |
| `user_word_records` | ~0.5 KB | 500,000 | ~250 MB |
| `learning_sessions` | ~3 KB | 100,000 | ~300 MB |
| **静态数据合计** | — | — | **~17.5 MB** |
| **用户数据（1万用户）** | — | — | **~670 MB** |
| **用户数据（10万用户）** | — | — | **~6.7 GB** |

> 云数据库免费额度 2 GB，初期（1万用户以内）够用。用户量增长后需付费扩容。

---

## 3. 云函数设计

### 3.1 云函数总览

按业务模块分组，共设计 **18 个云函数**：

| 模块 | 云函数名 | 核心职责 |
|------|---------|---------|
| **认证** | `authLogin` | 微信登录鉴权 |
| **用户** | `getUserProfile` | 获取用户信息 |
| | `updateUserSettings` | 更新用户设置 |
| | `updateUserStats` | 更新用户统计 |
| **单词** | `getWordList` | 获取单词列表（分页） |
| | `getWordDetail` | 获取单词详情 |
| | `searchWords` | 搜索单词 |
| **学习进度** | `getUserProgress` | 获取学习进度 |
| | `updateWordProgress` | 更新单词学习状态 |
| | `batchUpdateProgress` | 批量更新进度（会话结束后） |
| **TTS** | `getTtsAudio` | 获取 TTS 音频（缓存优先） |
| **练习** | `startSession` | 开始练习会话 |
| | `submitSession` | 提交练习结果 |
| | `getMistakeBook` | 获取错题本 |
| | `addToMistakeBook` | 加入错题 |
| | `removeFromMistakeBook` | 移除错题 |
| **阅读** | `getReadingPassage` | 获取阅读文章及题目 |
| | `submitReadingAnswers` | 提交阅读答案 |
| **签到** | `checkin` | 每日签到 |
| | `getCheckinCalendar` | 获取签到日历 |
| **收藏** | `toggleFavorite` | 收藏/取消收藏 |
| | `getFavorites` | 获取收藏列表 |
| **统计** | `getStudyStats` | 获取学习统计数据 |
| **限流** | `rateLimitCheck` | 频率限制校验（内部） |

### 3.2 核心云函数详细设计

#### 3.2.1 `authLogin` — 微信登录鉴权

**入参**：
```json
{
  "code": "string (required, wx.login 获取的临时 code)"
}
```

**出参**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "openid": "string",
    "token": "string (自定义登录态，可选)",
    "isNewUser": "boolean",
    "userInfo": {
      "nickName": "string",
      "avatarUrl": "string",
      "currentBankId": "string"
    }
  }
}
```

**核心逻辑**：
```javascript
// 云函数 authLogin/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { code } = event
  
  // 1. 换取 openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 2. 查询用户是否存在
  const db = cloud.database()
  const userRes = await db.collection('users').where({ openid }).get()
  
  let isNewUser = false
  let userInfo
  
  if (userRes.data.length === 0) {
    // 3. 新用户，创建记录
    isNewUser = true
    const now = new Date()
    const newUser = {
      openid,
      nickName: '',
      avatarUrl: '',
      createdAt: now,
      lastLoginAt: now,
      stats: {
        totalStudyDays: 0,
        totalStudyMinutes: 0,
        totalWordsLearned: 0,
        totalWordsMastered: 0,
        streakDays: 0
      },
      settings: {
        dailyWordGoal: 20,
        ttsVoice: 'us',
        autoPlayAudio: true,
        notificationEnabled: true,
        studyRemindTime: '20:00'
      },
      currentBankId: ''
    }
    const addRes = await db.collection('users').add({ data: newUser })
    userInfo = { ...newUser, _id: addRes._id }
  } else {
    // 4. 老用户，更新登录时间
    userInfo = userRes.data[0]
    await db.collection('users').doc(userInfo._id).update({
      data: { lastLoginAt: new Date() }
    })
  }
  
  return {
    code: 0,
    data: {
      openid,
      isNewUser,
      userInfo: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        currentBankId: userInfo.currentBankId,
        stats: userInfo.stats,
        settings: userInfo.settings
      }
    }
  }
}
```

#### 3.2.2 `getTtsAudio` — 获取 TTS 音频

**入参**：
```json
{
  "text": "string (required, 要发音的文本)",
  "voice": "enum ['us', 'uk'] (default: 'us')",
  "language": "string (default: 'en')"
}
```

**出参**：
```json
{
  "code": 0,
  "data": {
    "audioUrl": "string (云存储临时URL或永久URL)",
    "fromCache": "boolean",
    "expiresAt": "number (URL过期时间戳)"
  }
}
```

**核心逻辑**：
```javascript
// 云函数 getTtsAudio/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const TTS_TIMEOUT = 10000
const GOOGLE_TTS_URL = 'https://translate.google.com/translate_tts'

exports.main = async (event, context) => {
  const { text, voice = 'us', language = 'en' } = event
  const db = cloud.database()
  
  // 1. 先查缓存
  const cacheRes = await db.collection('tts_cache')
    .where({ text, voice, language })
    .get()
  
  if (cacheRes.data.length > 0) {
    const cache = cacheRes.data[0]
    // 更新命中统计
    await db.collection('tts_cache').doc(cache._id).update({
      data: {
        hitCount: db.command.inc(1),
        lastHitAt: new Date()
      }
    })
    // 获取临时访问链接
    const tempUrlRes = await cloud.getTempFileURL({
      fileList: [cache.fileId]
    })
    return {
      code: 0,
      data: {
        audioUrl: tempUrlRes.fileList[0].tempFileURL,
        fromCache: true
      }
    }
  }
  
  // 2. 无缓存，请求 Google TTS
  const tl = voice === 'us' ? 'en-US' : 'en-GB'
  const ttsUrl = `${GOOGLE_TTS_URL}?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob`
  
  try {
    const response = await axios.get(ttsUrl, {
      responseType: 'arraybuffer',
      timeout: TTS_TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    
    // 3. 上传至云存储
    const fileName = `tts/${language}/${voice}/${Date.now()}_${cloud.getWXContext().OPENID}.mp3`
    const uploadRes = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: Buffer.from(response.data)
    })
    
    // 4. 写入缓存索引
    const now = new Date()
    await db.collection('tts_cache').add({
      data: {
        text,
        voice,
        language,
        audioUrl: uploadRes.fileID,
        fileId: uploadRes.fileID,
        size: response.data.length,
        hitCount: 1,
        lastHitAt: now,
        createdAt: now
      }
    })
    
    // 5. 获取临时访问链接
    const tempUrlRes = await cloud.getTempFileURL({
      fileList: [uploadRes.fileID]
    })
    
    return {
      code: 0,
      data: {
        audioUrl: tempUrlRes.fileList[0].tempFileURL,
        fromCache: false
      }
    }
  } catch (err) {
    return { code: -1, message: 'TTS服务暂不可用', error: err.message }
  }
}
```

> **注意**：Google Translate TTS 为非官方 API，可能不稳定。建议实现**备选方案**（见第 6 章）。

#### 3.2.3 `updateWordProgress` — 更新单词学习状态

**入参**：
```json
{
  "wordId": "string (required)",
  "bankId": "string (required)",
  "wordText": "string (required)",
  "action": "enum ['view', 'correct', 'wrong', 'master', 'favorite', 'unfavorite']",
  "sessionId": "string (optional)"
}
```

**出参**：
```json
{
  "code": 0,
  "data": {
    "newStatus": "string",
    "familiarity": "number",
    "nextReviewAt": "Date"
  }
}
```

**核心逻辑**：
```javascript
exports.main = async (event, context) => {
  const { wordId, bankId, wordText, action } = event
  const openid = cloud.getWXContext().OPENID
  const db = cloud.database()
  const _ = db.command
  
  const now = new Date()
  
  // 1. 查询或创建用户单词记录
  let recordRes = await db.collection('user_word_records')
    .where({ openid, wordId })
    .get()
  
  let record = recordRes.data[0]
  let updates = {}
  let isNew = false
  
  if (!record) {
    isNew = true
    record = {
      openid,
      wordId,
      bankId,
      wordText,
      status: 'new',
      familiarity: 0,
      wrongCount: 0,
      correctCount: 0,
      lastStudyAt: now,
      nextReviewAt: null,
      firstStudyAt: now,
      isFavorite: false,
      isInMistakeBook: false
    }
  }
  
  // 2. 根据 action 更新状态
  switch (action) {
    case 'view':
      updates = { lastStudyAt: now }
      if (record.status === 'new') updates.status = 'learning'
      break
    case 'correct':
      updates = {
        correctCount: _.inc(1),
        lastStudyAt: now,
        familiarity: _.min(100, _.add(record.familiarity || 0, 10))
      }
      if (record.correctCount >= 2) {
        updates.status = 'mastered'
        updates.masteredAt = now
      } else if (record.status === 'new') {
        updates.status = 'learning'
      }
      break
    case 'wrong':
      updates = {
        wrongCount: _.inc(1),
        lastStudyAt: now,
        familiarity: _.max(0, _.subtract(record.familiarity || 0, 15)),
        isInMistakeBook: true
      }
      if (record.status === 'new') updates.status = 'learning'
      break
    case 'master':
      updates = { status: 'mastered', masteredAt: now, familiarity: 100 }
      break
    case 'favorite':
      updates = { isFavorite: true }
      break
    case 'unfavorite':
      updates = { isFavorite: false }
      break
  }
  
  // 3. 计算下次复习时间（简单间隔重复算法）
  if (['correct', 'wrong', 'master'].includes(action)) {
    const reviewIntervals = [1, 2, 4, 7, 15, 30] // 天数
    const level = Math.min(record.correctCount || 0, reviewIntervals.length - 1)
    const nextDate = new Date(now)
    nextDate.setDate(nextDate.getDate() + reviewIntervals[level])
    updates.nextReviewAt = nextDate
  }
  
  // 4. 写入数据库
  if (isNew) {
    await db.collection('user_word_records').add({
      data: { ...record, ...updates, updatedAt: now }
    })
  } else {
    await db.collection('user_word_records').doc(record._id).update({
      data: { ...updates, updatedAt: now }
    })
  }
  
  // 5. 同步更新 user_progress 汇总数据
  await updateUserProgressSummary(openid, bankId)
  
  return {
    code: 0,
    data: {
      newStatus: updates.status || record.status,
      familiarity: updates.familiarity || record.familiarity,
      nextReviewAt: updates.nextReviewAt
    }
  }
}
```

#### 3.2.4 `submitReadingAnswers` — 阅读答题判分

**入参**：
```json
{
  "passageId": "string (required)",
  "answers": {
    "questionId_1": "A",
    "questionId_2": "C"
  }
}
```

**出参**：
```json
{
  "code": 0,
  "data": {
    "totalQuestions": 5,
    "correctCount": 3,
    "wrongCount": 2,
    "accuracy": 0.6,
    "results": [
      {
        "questionId": "string",
        "userAnswer": "A",
        "correctAnswer": "B",
        "isCorrect": false,
        "explanation": "string"
      }
    ],
    "wrongItemIds": ["questionId_2"]
  }
}
```

**核心逻辑**：
```javascript
exports.main = async (event, context) => {
  const { passageId, answers } = event
  const openid = cloud.getWXContext().OPENID
  const db = cloud.database()
  
  // 1. 查询题目正确答案
  const questionsRes = await db.collection('reading_questions')
    .where({ passageId })
    .get()
  
  const questions = questionsRes.data
  const results = []
  let correctCount = 0
  const wrongItems = []
  
  for (const q of questions) {
    const userAnswer = answers[q._id] || ''
    const isCorrect = userAnswer === q.correctAnswer
    
    if (isCorrect) {
      correctCount++
    } else {
      wrongItems.push({
        questionId: q._id,
        userAnswer,
        correctAnswer: q.correctAnswer
      })
    }
    
    results.push({
      questionId: q._id,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation
    })
  }
  
  const totalQuestions = questions.length
  const wrongCount = totalQuestions - correctCount
  
  // 2. 错题入库
  for (const wrong of wrongItems) {
    await db.collection('mistake_books').add({
      data: {
        openid,
        itemType: 'reading',
        itemId: wrong.questionId,
        itemText: questions.find(q => q._id === wrong.questionId)?.questionText,
        wrongAnswer: wrong.userAnswer,
        correctAnswer: wrong.correctAnswer,
        lastWrongAt: new Date(),
        createdAt: new Date()
      }
    })
  }
  
  // 3. 记录学习会话
  await db.collection('learning_sessions').add({
    data: {
      openid,
      sessionType: 'reading',
      passageId,
      totalItems: totalQuestions,
      correctCount,
      wrongCount,
      accuracy: correctCount / totalQuestions,
      completedAt: new Date(),
      createdAt: new Date()
    }
  })
  
  return {
    code: 0,
    data: {
      totalQuestions,
      correctCount,
      wrongCount,
      accuracy: +(correctCount / totalQuestions).toFixed(2),
      results,
      wrongItemIds: wrongItems.map(w => w.questionId)
    }
  }
}
```

#### 3.2.5 `checkin` — 每日签到

**入参**：无（从服务端获取当前日期）

**出参**：
```json
{
  "code": 0,
  "data": {
    "checkedIn": true,
    "date": "2025-01-15",
    "consecutiveDays": 5,
    "totalDays": 12,
    "isNewRecord": false
  }
}
```

**核心逻辑**：
```javascript
exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID
  const db = cloud.database()
  
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  
  // 1. 检查今日是否已签到
  const existing = await db.collection('checkins')
    .where({ openid, date: dateStr })
    .get()
  
  if (existing.data.length > 0) {
    return { code: 0, data: { checkedIn: true, date: dateStr, alreadyChecked: true } }
  }
  
  // 2. 查询昨日签到，计算连续天数
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yestStr = yesterday.toISOString().split('T')[0]
  
  const yestCheckin = await db.collection('checkins')
    .where({ openid, date: yestStr })
    .get()
  
  const consecutiveDays = yestCheckin.data.length > 0
    ? yestCheckin.data[0].consecutiveDays + 1
    : 1
  
  // 3. 写入签到记录
  await db.collection('checkins').add({
    data: {
      openid,
      date: dateStr,
      checkinAt: now,
      consecutiveDays,
      rewardPoints: consecutiveDays >= 7 ? 10 : 5,
      createdAt: now
    }
  })
  
  // 4. 更新用户统计
  const userRes = await db.collection('users').where({ openid }).get()
  const user = userRes.data[0]
  const newStreak = consecutiveDays
  const totalDays = (user?.stats?.totalStudyDays || 0) + 1
  
  await db.collection('users').doc(user._id).update({
    data: {
      'stats.streakDays': newStreak,
      'stats.totalStudyDays': totalDays,
      'stats.lastCheckinDate': now
    }
  })
  
  return {
    code: 0,
    data: {
      checkedIn: true,
      date: dateStr,
      consecutiveDays,
      totalDays,
      rewardPoints: consecutiveDays >= 7 ? 10 : 5
    }
  }
}
```

### 3.3 云函数通用中间件

建议每个云函数统一封装以下能力：

```javascript
// common/middleware.js
const cloud = require('wx-server-sdk')

/**
 * 统一的云函数入口包装器
 */
exports.wrapper = (handler) => async (event, context) => {
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  
  try {
    // 1. 获取用户 openid
    const openid = cloud.getWXContext().OPENID
    if (!openid) {
      return { code: 401, message: '未授权，请先登录' }
    }
    
    // 2. 频率限制检查
    const rateLimitOk = await checkRateLimit(openid, event.action)
    if (!rateLimitOk) {
      return { code: 429, message: '请求过于频繁，请稍后再试' }
    }
    
    // 3. 执行业务逻辑
    const result = await handler(event, context, openid)
    
    return { code: 0, ...result }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { code: 500, message: '服务器内部错误', error: error.message }
  }
}

/**
 * 频率限制检查（简单令牌桶实现）
 */
async function checkRateLimit(openid, action) {
  const db = cloud.database()
  const limits = {
    'login': { max: 10, window: 60 },      // 10次/分钟
    'tts': { max: 30, window: 60 },       // 30次/分钟
    'default': { max: 60, window: 60 }    // 60次/分钟
  }
  
  const limit = limits[action] || limits['default']
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - limit.window
  
  // 查询窗口内的请求次数
  const countRes = await db.collection('rate_limits')
    .where({
      openid,
      action: action || 'default',
      timestamp: db.command.gte(windowStart)
    })
    .count()
  
  if (countRes.total >= limit.max) {
    return false
  }
  
  // 记录本次请求
  await db.collection('rate_limits').add({
    data: {
      openid,
      action: action || 'default',
      timestamp: now,
      createdAt: new Date()
    }
  })
  
  return true
}
```

---

## 4. 用户认证方案

### 4.1 微信一键登录流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  小程序前端  │     │   云函数    │     │  微信服务器  │     │  云数据库   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  1. wx.login()   │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │    返回 code      │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 2. 调用云函数     │                   │                   │
       │   authLogin({code})│                  │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │                   │  3. 自动获取      │                   │
       │                   │   openid/unionid  │                   │
       │                   │  (getWXContext)   │                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
       │                   │  4. 查询/创建用户  │                  │
       │                   │──────────────────────────────────────>│
       │                   │                   │                   │
       │                   │   返回用户信息    │                   │
       │                   │<──────────────────────────────────────│
       │                   │                   │                   │
       │ 5. 返回登录态     │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 6. 前端缓存       │                   │                   │
       │   (storage)       │                   │                   │
       │                   │                   │                   │
```

### 4.2 认证流程详细说明

| 步骤 | 动作 | 执行方 | 说明 |
|------|------|--------|------|
| 1 | `wx.login()` | 小程序前端 | 获取临时登录凭证 `code`，有效期 5 分钟 |
| 2 | 调用 `authLogin` 云函数 | 小程序前端 | 将 `code` 传给云函数 |
| 3 | 获取 `openid` | 云函数 | 通过 `cloud.getWXContext()` 直接获取，**无需调用微信 auth.code2Session 接口** |
| 4 | 查询/创建用户 | 云函数 | 根据 `openid` 查询 `users` 集合，不存在则创建 |
| 5 | 返回用户数据 | 云函数 | 返回 `openid`、`isNewUser`、`userInfo` |
| 6 | 前端缓存 | 小程序前端 | 使用 `wx.setStorageSync('userInfo', data)` 缓存 |

### 4.3 是否需要绑定手机号？

**前期免费阶段：不需要强制绑定手机号**。

| 场景 | 是否需要手机号 | 策略 |
|------|--------------|------|
| 基础学习功能 | ❌ 不需要 | 仅用 openid 即可 |
| 数据备份/恢复 | ❌ 不需要 | 微信登录即绑定，换设备登录数据自动同步 |
| 社交分享 | ❌ 不需要 | 微信原生分享 |
| 订阅消息推送 | ❌ 不需要 | 使用小程序订阅消息，无需手机号 |
| 后续付费/会员 | ⚠️ 建议绑定 | 支付时需实名，可引导用户自愿绑定 |
| 客服/社群运营 | ⚠️ 可选 | 通过客服消息引导自愿绑定 |

**获取手机号方式**（当需要时）：
- 使用 `getPhoneNumber` 组件，用户点击按钮授权后，前端获取 `code`，传给云函数换取手机号。
- 注意：需小程序认证主体为企业，个人主体无法获取手机号。

### 4.4 用户数据结构

```json
{
  "_id": "auto",
  "openid": "oXXXXXXXXXXXXXXXXXXXXXXXXX",
  "unionid": null,
  "nickName": "微信用户",
  "avatarUrl": "https://thirdwx.qlogo.cn/...",
  "phone": null,
  "createdAt": "ISODate",
  "lastLoginAt": "ISODate",
  "stats": {
    "totalStudyDays": 0,
    "totalStudyMinutes": 0,
    "totalWordsLearned": 0,
    "totalWordsMastered": 0,
    "streakDays": 0,
    "lastCheckinDate": null
  },
  "settings": {
    "dailyWordGoal": 20,
    "ttsVoice": "us",
    "autoPlayAudio": true,
    "notificationEnabled": true,
    "studyRemindTime": "20:00"
  },
  "currentBankId": "wb001"
}
```

### 4.5 登录态管理

```javascript
// app.js 或 utils/auth.js
const AUTH_KEY = 'auth_info'

module.exports = {
  // 检查登录态
  async checkSession() {
    try {
      await wx.checkSession()
      const authInfo = wx.getStorageSync(AUTH_KEY)
      if (authInfo && authInfo.openid) {
        return authInfo
      }
      return null
    } catch (err) {
      // session 过期，重新登录
      return null
    }
  },

  // 执行登录
  async login() {
    const res = await wx.login()
    const { code } = res
    
    const loginRes = await wx.cloud.callFunction({
      name: 'authLogin',
      data: { code }
    })
    
    if (loginRes.result.code === 0) {
      wx.setStorageSync(AUTH_KEY, loginRes.result.data)
      return loginRes.result.data
    }
    throw new Error(loginRes.result.message)
  },

  // 获取当前 openid
  getOpenid() {
    const authInfo = wx.getStorageSync(AUTH_KEY)
    return authInfo?.openid || null
  },

  // 退出登录
  logout() {
    wx.removeStorageSync(AUTH_KEY)
    // 可选：清除其他缓存
  }
}
```

---

## 5. 存储方案

### 5.1 音频文件（TTS 发音）存储策略

| 层级 | 存储位置 | 策略 | 说明 |
|------|---------|------|------|
| **L1：运行时内存** | 页面变量 | 当前播放的音频 URL | 页面关闭即释放 |
| **L2：本地缓存** | `wx.getStorage` + 本地文件 | 最近播放的音频文件路径 | 使用 `wx.getFileSystemManager` 管理 |
| **L3：云存储** | 微信云存储 | 全部 TTS 音频文件 | 永久存储，通过 CDN 分发 |
| **L4：外部 TTS 服务** | Google TTS / 备选 | 原始音频生成 | 云存储未命中时生成 |

#### 音频缓存策略

```javascript
// utils/audioCache.js
const fs = wx.getFileSystemManager()
const CACHE_DIR = `${wx.env.USER_DATA_PATH}/tts_cache`
const MAX_CACHE_SIZE = 50 * 1024 * 1024  // 50MB
const MAX_CACHE_FILES = 200

/**
 * 获取音频 URL（多级缓存）
 */
async function getAudioUrl(text, voice = 'us') {
  const cacheKey = `tts_${voice}_${text}`
  
  // 1. 检查本地缓存
  const cached = wx.getStorageSync(cacheKey)
  if (cached && cached.localPath) {
    // 验证文件是否存在
    try {
      fs.accessSync(cached.localPath)
      return cached.localPath  // 本地文件路径可直接播放
    } catch (e) {
      // 文件已被清理，继续查询
    }
  }
  
  // 2. 调用云函数获取云存储 URL
  const ttsRes = await wx.cloud.callFunction({
    name: 'getTtsAudio',
    data: { text, voice }
  })
  
  if (ttsRes.result.code !== 0) {
    throw new Error(ttsRes.result.message)
  }
  
  const audioUrl = ttsRes.result.data.audioUrl
  
  // 3. 下载到本地缓存
  const downloadRes = await wx.downloadFile({ url: audioUrl })
  if (downloadRes.statusCode === 200) {
    const localPath = `${CACHE_DIR}/${voice}_${Date.now()}.mp3`
    // 确保目录存在
    try { fs.mkdirSync(CACHE_DIR, true) } catch (e) {}
    
    fs.saveFileSync(downloadRes.tempFilePath, localPath)
    
    // 记录缓存索引
    wx.setStorageSync(cacheKey, {
      localPath,
      cloudUrl: audioUrl,
      savedAt: Date.now()
    })
    
    // 4. 清理过期缓存
    cleanupCache()
    
    return localPath
  }
  
  // 下载失败，直接返回云 URL
  return audioUrl
}

/**
 * 清理本地缓存（LRU策略）
 */
function cleanupCache() {
  const keys = wx.getStorageInfoSync().keys
    .filter(k => k.startsWith('tts_'))
    .map(k => ({
      key: k,
      savedAt: wx.getStorageSync(k).savedAt || 0
    }))
    .sort((a, b) => a.savedAt - b.savedAt)
  
  // 超过数量限制时删除最旧的
  if (keys.length > MAX_CACHE_FILES) {
    const toRemove = keys.slice(0, keys.length - MAX_CACHE_FILES)
    for (const item of toRemove) {
      const cache = wx.getStorageSync(item.key)
      if (cache && cache.localPath) {
        try { fs.unlinkSync(cache.localPath) } catch (e) {}
      }
      wx.removeStorageSync(item.key)
    }
  }
}
```

#### 音频播放

```javascript
// utils/audioPlayer.js
let innerAudioContext = null

function playAudio(url) {
  if (innerAudioContext) {
    innerAudioContext.stop()
    innerAudioContext.destroy()
  }
  
  innerAudioContext = wx.createInnerAudioContext()
  innerAudioContext.src = url
  innerAudioContext.play()
  
  return innerAudioContext
}

function stopAudio() {
  if (innerAudioContext) {
    innerAudioContext.stop()
    innerAudioContext.destroy()
    innerAudioContext = null
  }
}

module.exports = { playAudio, stopAudio }
```

### 5.2 图片资源管理

| 资源类型 | 存储位置 | 管理方式 | 说明 |
|---------|---------|---------|------|
| 小程序图标/UI | 小程序包内 | 直接放入 `images/` 目录 | 打包进小程序，访问最快 |
| 词库封面图 | 云存储 | 上传后获取 `cloud://` 协议地址 | 可动态更换 |
| 用户头像 | 直接使用微信 URL | 无需存储 | 微信 CDN 地址 |
| 文章配图 | 云存储 | 通过云存储管理后台上传 | 阅读文章配图 |
| 分享卡片背景 | 云存储 / 小程序包 | 预置 + 云存储动态 | 分享时生成 |

**图片加载优化**：
```javascript
// 使用懒加载 + 占位图
<image 
  src="{{item.coverUrl}}" 
  lazy-load 
  mode="aspectFill"
  placeholder="../../images/placeholder.png"
/>

// 使用 wx.cloud.getTempFileURL 获取临时 HTTPS URL
const tempRes = await wx.cloud.getTempFileURL({
  fileList: ['cloud://xxx.jpg']
})
```

### 5.3 前端数据缓存策略总览

| 数据类型 | 缓存方式 | 有效期 | 说明 |
|---------|---------|--------|------|
| 用户信息 | `wx.setStorageSync` | 长期 | 登录态 + 设置 |
| 单词列表（某词库） | `wx.setStorage` | 7 天 | 分页缓存，滚动加载 |
| 当前学习进度 | `wx.setStorageSync` | 实时同步 | 同时写入数据库 |
| TTS 音频文件 | 本地文件系统 | LRU 自动清理 | 50MB/200 文件上限 |
| 阅读文章 | `wx.setStorage` | 3 天 | 近期阅读的文章缓存 |
| 语法知识点 | `wx.setStorage` | 30 天 | 静态数据，变更少 |
| 今日已学单词 | `wx.setStorageSync` | 当日 | 减少重复查询 |
| 签到状态 | `wx.setStorageSync` | 当日 | 避免重复签到请求 |

---

## 6. 外部依赖与接口

### 6.1 TTS 服务方案

#### 方案对比

| TTS 服务 | 稳定性 | 音质 | 成本 | 访问方式 | 推荐度 |
|---------|--------|------|------|---------|--------|
| Google Translate TTS | ⭐⭐ 不稳定 | ⭐⭐⭐ 良好 | 免费 | 直接 HTTP | ⚠️ 备选 |
| Google Cloud Text-to-Speech | ⭐⭐⭐⭐⭐ 稳定 | ⭐⭐⭐⭐⭐ 优秀 | 前 400 万字符免费/月，后 $4/百万字符 | 官方 API | ⭐⭐⭐⭐ 推荐 |
| Azure TTS | ⭐⭐⭐⭐⭐ 稳定 | ⭐⭐⭐⭐⭐ 优秀 | 前 50 万字符免费/月，后 $16/百万字符 | 官方 API | ⭐⭐⭐ 备选 |
| 百度智能云 TTS | ⭐⭐⭐⭐ 稳定 | ⭐⭐⭐⭐ 良好 | 有免费额度 | 官方 API | ⭐⭐⭐ 备选 |
| Edge TTS (Microsoft) | ⭐⭐⭐ 较稳定 | ⭐⭐⭐⭐ 良好 | 免费（非官方封装） | 社区开源方案 | ⭐⭐⭐ 备选 |
| 有道翻译 TTS | ⭐⭐⭐ 较稳定 | ⭐⭐⭐ 良好 | 免费 | 直接 HTTP | ⭐⭐ 备选 |

#### 推荐策略：三级 fallback

```javascript
// 云函数 TTS 调用策略（伪代码）
async function getTtsWithFallback(text, voice) {
  // 1. 查云存储缓存
  const cached = await checkCloudStorageCache(text, voice)
  if (cached) return cached
  
  // 2. 尝试 Google Cloud TTS（首选，需 API Key）
  try {
    const audio = await callGoogleCloudTTS(text, voice)
    await saveToCloudStorage(text, voice, audio)
    return audio
  } catch (e) {
    console.log('Google Cloud TTS 失败，尝试备选')
  }
  
  // 3. 尝试 Edge TTS
  try {
    const audio = await callEdgeTTS(text, voice)
    await saveToCloudStorage(text, voice, audio)
    return audio
  } catch (e) {
    console.log('Edge TTS 失败，尝试备选')
  }
  
  // 4. 最后尝试 Google Translate TTS（免费但可能被封）
  try {
    const audio = await callGoogleTranslateTTS(text, voice)
    await saveToCloudStorage(text, voice, audio)
    return audio
  } catch (e) {
    return { error: '所有 TTS 服务暂不可用' }
  }
}
```

**成本预估（Google Cloud TTS）**：
- 1 万用户，每人每天学习 20 个单词，每个单词播放 3 次 TTS
- 月均字符数：10,000 × 20 × 3 × 30 = 18,000,000 字符（假设平均 6 字母/单词）
- Google Cloud 前 400 万字符免费，超出约 1400 万字符
- 费用：14 × $4 = **$56/月 ≈ 400 元/月**
- **优化后**（缓存命中 80%）：实际请求 360 万字符/月，**完全在免费额度内**

### 6.2 AI 接口需求评估

| 功能 | 是否需要 AI | 前期必须？ | 推荐方案 | 说明 |
|------|-----------|----------|---------|------|
| 单词释义生成 | ❌ 不需要 | — | 静态数据 | 词库已包含中文释义 |
| 例句生成 | ❌ 不需要 | — | 静态数据 | 词库已包含例句 |
| 智能复习算法 | ⚠️ 可用可不用 | ❌ 否 | 简单间隔重复即可 | 初期用固定间隔重复 |
| AI 对话练习 | ⚠️ 可选 | ❌ 否 | DeepSeek / GPT-3.5 | 二期功能 |
| 作文批改 | ⚠️ 可选 | ❌ 否 | DeepSeek API | 二期功能 |
| 智能推荐学习内容 | ⚠️ 可选 | ❌ 否 | 基于规则推荐 | 初期基于错误率推荐 |
| 语法解析（复杂句） | ⚠️ 可选 | ❌ 否 | DeepSeek API | 二期功能 |

**前期策略**：
- **MVP 阶段不引入 AI 接口**，降低复杂度和成本。
- 所有学习内容（单词、句子、语法、阅读）使用预置静态数据。
- 智能功能（AI 对话、作文批改）规划在二期迭代中引入 DeepSeek API 或其他大模型。

### 6.3 词汇数据来源

| 数据来源 | 获取方式 | 合法性 | 推荐度 |
|---------|---------|--------|--------|
| 开源词库（如 Youdao API、Bing API） | 公开 API | 需遵守 ToS | ⭐⭐⭐ |
| CET 官方词汇大纲 | 公开资料整理 | ✅ 合法 | ⭐⭐⭐⭐⭐ |
| 第三方词汇 API（如 有道词典 API） | 申请开发者密钥 | 需付费 | ⭐⭐⭐ |
| 手动整理 + 众包 | 团队内部 | ✅ 合法 | ⭐⭐⭐⭐ |
| 已有 Web 版数据库迁移 | 直接导出 | ✅ 自有数据 | ⭐⭐⭐⭐⭐ |

**推荐策略**：
1. 优先迁移已有 Web 版的词汇数据。
2. 缺失的补充数据通过开源 API 批量获取后审核入库。
3. 例句、音标等需人工校验，确保质量。

---

## 7. 性能与安全

### 7.1 云数据库查询优化

#### 分页策略

```javascript
// 分页查询单词列表（避免一次性加载过多）
async function getWordList(bankId, page = 1, pageSize = 20) {
  const db = wx.cloud.database()
  
  const res = await db.collection('words')
    .where({ bankId })
    .orderBy('difficulty_level', 'asc')
    .orderBy('_id', 'asc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return res.data
}
```

#### 索引优化清单

| 集合 | 索引字段 | 类型 | 用途 |
|------|---------|------|------|
| `users` | `openid` | 唯一索引 | 用户查询 |
| `words` | `bankId + difficulty_level` | 复合索引 | 按难度筛选 |
| `words` | `text` | 普通索引 | 精确查找 |
| `user_progress` | `openid + bankId` | 唯一索引 | 进度查询 |
| `user_word_records` | `openid + wordId` | 唯一索引 | 学习记录查询 |
| `user_word_records` | `openid + status + nextReviewAt` | 复合索引 | 复习队列 |
| `checkins` | `openid + date` | 唯一索引 | 签到查询 |
| `learning_logs` | `openid + date` | 唯一索引 | 学习日志 |
| `reading_questions` | `passageId` | 普通索引 | 题目查询 |

#### 聚合查询替代方案

云数据库聚合能力有限，复杂统计建议：

1. **预计算 + 定时更新**：通过云函数定时触发器，每小时/每日预计算统计数据写入 `users.stats`。
2. **前端聚合**：对于个人学习数据，单次查询数据量可控，可前端聚合。
3. **分层汇总**：`learning_logs` 按日汇总，`user_progress` 按词库汇总，减少实时计算。

### 7.2 云函数并发限制与优化

| 限制项 | 云开发限制 | 优化策略 |
|--------|-----------|---------|
| 单函数内存 | 128MB~1GB 可选 | 选择 256MB 满足大部分场景 |
| 函数执行超时 | 20 秒 | 大数据量操作分批处理 |
| 并发实例数 | 自动扩缩容，有上限 | 高并发接口增加缓存层 |
| 单次返回数据量 | 建议 < 100 KB | 分页 + 字段筛选 |
| 冷启动时间 | 1~3 秒 | 使用云函数预留实例（如有） |

**优化建议**：
1. **字段投影**：查询时只返回必要字段。
   ```javascript
   db.collection('words').field({ text: true, meaning_cn: true }).get()
   ```
2. **批量操作**：批量写入使用 ` Promise.all()` 控制并发数（< 10 个并行）。
3. **缓存热点数据**：单词列表等静态数据，小程序端缓存 7 天。

### 7.3 前端数据缓存策略

```javascript
// utils/cache.js
const CACHE_PREFIX = 'cet_app_'

const CacheManager = {
  // 设置缓存 + 过期时间
  set(key, data, ttlMinutes = 60) {
    const item = {
      data,
      expireAt: Date.now() + ttlMinutes * 60 * 1000
    }
    wx.setStorageSync(CACHE_PREFIX + key, item)
  },

  // 获取缓存
  get(key) {
    const item = wx.getStorageSync(CACHE_PREFIX + key)
    if (!item) return null
    if (Date.now() > item.expireAt) {
      wx.removeStorageSync(CACHE_PREFIX + key)
      return null
    }
    return item.data
  },

  // 清除所有缓存
  clear() {
    const keys = wx.getStorageInfoSync().keys
    keys.forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) {
        wx.removeStorageSync(k)
      }
    })
  }
}

module.exports = CacheManager
```

### 7.4 频率限制实现方案

#### 需要限流的接口

| 接口/功能 | 限流策略 | 实现位置 |
|----------|---------|---------|
| 登录（`wx.login`） | 10 次/分钟/用户 | 云函数 + 前端防抖 |
| TTS 请求 | 30 次/分钟/用户 | 云函数 |
| 学习进度保存 | 60 次/分钟/用户 | 云函数 |
| 签到 | 1 次/天/用户 | 数据库唯一索引 |
| 收藏操作 | 30 次/分钟/用户 | 云函数 |
| 分享点击 | 不限制 | — |

#### 频率限制实现（云函数层）

```javascript
// 基于云数据库的简单限流实现
// 适用于无 Redis 的云开发环境

const RATE_LIMIT_CONFIG = {
  'authLogin': { max: 10, window: 60 },
  'getTtsAudio': { max: 30, window: 60 },
  'updateWordProgress': { max: 60, window: 60 },
  'submitSession': { max: 20, window: 60 },
  'toggleFavorite': { max: 30, window: 60 }
}

async function rateLimitCheck(openid, action) {
  const db = cloud.database()
  const config = RATE_LIMIT_CONFIG[action] || { max: 60, window: 60 }
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.window
  
  // 清理过期记录（异步，不阻塞主流程）
  db.collection('rate_limits').where({
    timestamp: db.command.lt(windowStart - 3600) // 保留1小时
  }).remove().catch(() => {})
  
  const countRes = await db.collection('rate_limits').where({
    openid,
    action,
    timestamp: db.command.gte(windowStart)
  }).count()
  
  if (countRes.total >= config.max) {
    return { allowed: false, retryAfter: config.window }
  }
  
  await db.collection('rate_limits').add({
    data: { openid, action, timestamp: now, createdAt: new Date() }
  })
  
  return { allowed: true }
}
```

#### 前端防抖/节流

```javascript
// utils/throttle.js
function throttle(fn, interval = 1000) {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      return fn.apply(this, args)
    }
  }
}

function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 使用示例：TTS 按钮防抖
Page({
  onTapPlay: throttle(function() {
    this.playAudio()
  }, 500)
})
```

### 7.5 安全注意事项

| 安全风险 | 防护措施 |
|---------|---------|
| 云函数未鉴权被调用 | 所有云函数通过 `getWXContext().OPENID` 鉴权 |
| 数据库权限泄露 | 严格配置数据库安全规则，禁止前端直接操作敏感集合 |
| 数据注入攻击 | 云函数入参严格校验，拒绝非法字段 |
| 云存储文件泄露 | 敏感文件不设置公开读，使用临时签名 URL |
| 订阅消息滥用 | 用户主动触发订阅，不自动推送 |
| 爬虫/刷量 | 频率限制 + 行为检测（如短时间内大量答题标记异常） |

#### 数据库安全规则示例

```javascript
// 只允许用户读写自己的数据
{
  "user_progress": {
    "read": "doc.openid == auth.openid",
    "write": "doc.openid == auth.openid"
  },
  "users": {
    "read": "doc.openid == auth.openid",
    "write": "doc.openid == auth.openid"
  },
  "words": {
    "read": true,  // 静态数据公开读
    "write": false  // 禁止前端写入
  }
}
```

---

## 8. 开发里程碑建议

### 8.1 MVP 阶段（第 1~2 个月）

**目标**：核心学习闭环跑通，可内测使用

| 周次 | 模块 | 功能点 | 优先级 |
|------|------|--------|--------|
| W1 | 基础架构 | 小程序初始化、云开发环境搭建、数据库集合创建 | P0 |
| W1 | 认证 | 微信登录、用户创建、登录态管理 | P0 |
| W1~2 | 首页 | 仪表盘 UI、学习数据展示（mock 数据） | P0 |
| W2 | 词库 | 词库列表、单词列表分页加载 | P0 |
| W2~3 | 单词学习 | 卡片翻转、TTS 播放、学习状态切换 | P0 |
| W3 | 学习进度 | 进度保存、今日学习目标 | P0 |
| W3~4 | 生词本/收藏 | 收藏单词、生词本列表 | P1 |
| W4 | 签到 | 每日签到、连续天数统计 | P1 |
| W4 | 我的页面 | 个人中心、设置页面 | P1 |

**MVP 交付标准**：
- [ ] 用户可微信登录
- [ ] 可浏览 CET-4/CET-6 词库
- [ ] 可卡片式学习单词（翻转、发音）
- [ ] 学习进度自动保存
- [ ] 可收藏/取消收藏单词
- [ ] 每日签到
- [ ] 基础学习统计展示

### 8.2 第二阶段（第 3~4 个月）

**目标**：增强学习功能，提升用户留存

| 模块 | 功能点 | 说明 |
|------|--------|------|
| 拼写练习 | 单词拼写输入、自动判分 | 巩固记忆 |
| 听写练习 | 播放音频后输入单词 | 听力+拼写 |
| 复习模式 | 基于间隔重复的复习队列 | 根据 `nextReviewAt` 推荐 |
| 学习日历 | 学习热力图、日历视图 | 可视化学习记录 |
| 阅读模块 | 阅读理解文章 + 题目 | 引入 50 篇文章 |
| 错题本 | 阅读/拼写错题收集 | 错题回顾 |
| 语法学习 | 语法知识点列表 | 静态内容展示 |
| 分享功能 | 学习打卡分享卡片 | 原生分享 + 自定义图片 |

### 8.3 第三阶段（第 5~6 个月）

**目标**：功能完善，准备推广

| 模块 | 功能点 | 说明 |
|------|--------|------|
| 订阅消息 | 学习提醒推送 | 每日定时提醒 |
| 数据分析 | 更丰富的统计图表 | 周/月/年维度 |
| 社交功能 | 学习排行榜（好友/全局） | 提升动力 |
| AI 功能（可选） | AI 对话练习 / 作文批改 | 引入 DeepSeek API |
| 内容扩展 | 更多真题/模拟题 | 阅读题库扩充至 200+ |
| 性能优化 | 首屏加载、缓存优化 | 提升体验 |

### 8.4 里程碑甘特图

```
月份:    |  第1月  |  第2月  |  第3月  |  第4月  |  第5月  |  第6月  |
         ├─────────┤─────────┤─────────┤─────────┤─────────┤─────────┤
基础架构  |█████████|         |         |         |         |         |
微信登录  |█████████|         |         |         |         |         |
词库/单词 |    ████████████████|         |         |         |         |
卡片学习  |    ████████████████|         |         |         |         |
进度系统  |         |█████████|         |         |         |         |
收藏/生词  |         |█████████|         |         |         |         |
签到系统  |         |█████████|         |         |         |         |
拼写/听写 |         |         |█████████|         |         |         |
阅读模块  |         |         |█████████|█████████|         |         |
复习模式  |         |         |█████████|         |         |         |
错题本    |         |         |    █████|██████    |         |         |
语法学习  |         |         |    ██████████     |         |         |
分享/订阅 |         |         |         |    █████|██████    |         |
AI功能    |         |         |         |         |    █████|██████    |
性能优化  |         |         |         |         |    ████████████████|
         ├─────────┤─────────┤─────────┤─────────┤─────────┤─────────┤
里程碑:   |  M1内测  |  M2公测  |         |         |         |         |
```

### 8.5 风险评估与应对

| 风险 | 影响度 | 应对策略 |
|------|--------|---------|
| Google TTS 不可用 | 高 | 实现多级 fallback，优先使用缓存 |
| 云开发费用超预期 | 中 | 监控用量，适时迁移到自建后端 |
| 单词数据质量差 | 中 | 人工审核 + 用户反馈机制 |
| 用户增长缓慢 | 中 | MVP 聚焦核心功能，快速迭代 |
| 小程序审核不通过 | 低 | 提前阅读审核规范，避免敏感内容 |
| 云数据库查询性能瓶颈 | 中 | 严格索引设计 + 前端缓存 + 数据分页 |

---

## 附录

### A. 项目目录结构建议

```
cet-wechat-miniapp/
├── cloudfunctions/           # 云函数
│   ├── authLogin/
│   ├── getUserProfile/
│   ├── getWordList/
│   ├── getWordDetail/
│   ├── searchWords/
│   ├── getUserProgress/
│   ├── updateWordProgress/
│   ├── batchUpdateProgress/
│   ├── getTtsAudio/
│   ├── startSession/
│   ├── submitSession/
│   ├── getMistakeBook/
│   ├── addToMistakeBook/
│   ├── getReadingPassage/
│   ├── submitReadingAnswers/
│   ├── checkin/
│   ├── getCheckinCalendar/
│   ├── toggleFavorite/
│   ├── getFavorites/
│   ├── getStudyStats/
│   └── common/              # 公共模块
│       ├── middleware.js
│       ├── rateLimit.js
│       └── utils.js
├── miniprogram/             # 小程序前端
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── components/          # 公共组件
│   │   ├── word-card/
│   │   ├── audio-player/
│   │   ├── progress-ring/
│   │   └── loading/
│   ├── pages/               # 页面
│   │   ├── index/           # 首页/仪表盘
│   │   ├── word-bank/       # 词库列表
│   │   ├── word-learn/      # 单词学习
│   │   ├── spelling/        # 拼写练习
│   │   ├── dictation/       # 听写练习
│   │   ├── reading/         # 阅读列表
│   │   ├── reading-detail/  # 阅读答题
│   │   ├── grammar/         # 语法学习
│   │   ├── grammar-detail/  # 语法详情
│   │   ├── mistake-book/    # 错题本
│   │   ├── favorites/       # 收藏
│   │   ├── statistics/      # 学习统计
│   │   ├── checkin/         # 签到
│   │   └── profile/         # 我的
│   ├── utils/               # 工具函数
│   │   ├── auth.js
│   │   ├── cache.js
│   │   ├── audio.js
│   │   ├── request.js
│   │   └── throttle.js
│   ├── services/            # 数据服务层
│   │   ├── userService.js
│   │   ├── wordService.js
│   │   ├── readingService.js
│   │   └── studyService.js
│   ├── static/              # 静态资源
│   │   └── images/
│   └── store/               # 状态管理（MobX）
│       ├── userStore.js
│       ├── studyStore.js
│       └── index.js
├── database/                # 数据库初始化脚本
│   ├── initWords.js
│   ├── initSentences.js
│   └── initReading.js
└── project.config.json
```

### B. 技术栈映射表（Web 版 → 小程序版）

| Web 版技术 | 小程序替代方案 | 说明 |
|-----------|--------------|------|
| React Router | 小程序原生页面路由 (`wx.navigateTo`) | 基于文件目录的路由 |
| Zustand | MobX / `globalData` / 页面间传参 | MobX 需要额外配置 |
| Axios | `wx.request` / `wx.cloud.callFunction` | 云函数调用用 `callFunction` |
| Tailwind CSS | WXSS + rpx 单位 | 小程序自适应单位 |
| Web Audio API | `wx.createInnerAudioContext()` | 小程序音频播放 |
| LocalStorage | `wx.setStorage` / `wx.getStorage` | 同步/异步 API 均有 |
| useState/useEffect | `Page({ data })` / `onLoad` 等生命周期 | 小程序页面机制 |

### C. 外部依赖 npm 包（云函数）

```json
{
  "dependencies": {
    "wx-server-sdk": "latest",
    "axios": "^1.6.0"
  }
}
```

### D. 云开发环境配置检查清单

- [ ] 开通微信云开发环境
- [ ] 配置云数据库权限规则
- [ ] 创建所有数据库集合
- [ ] 创建必要索引
- [ ] 部署所有云函数
- [ ] 配置云存储访问权限
- [ ] 上传静态资源到云存储（如有）
- [ ] 配置小程序后台（AppID、服务器域名）
- [ ] 开通订阅消息模板（学习提醒）
- [ ] 配置分享域名白名单

---

> **文档结束**  
> 本方案基于微信原生小程序 + 微信云开发（CloudBase）设计，适用于 CET-4/CET-6 专项学习应用的快速开发与迭代。实际开发中可根据业务变化调整数据库结构和接口设计。
