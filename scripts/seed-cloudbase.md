# 刷词英语 CloudBase 初始化

## 1. 安装 CLI

```bash
npm i -g @cloudbase/cli
cloudbase login
```

## 2. 创建集合

先 dry-run 检查：

```bash
node scripts/init-cloudbase.js --dry-run
```

有云环境 ID 后执行：

```bash
CLOUDBASE_ENV=你的环境ID node scripts/init-cloudbase.js
```

集合和索引定义在 `cloudbase/collections.json`。

## 3. 生成词库数据

```bash
node scripts/clean-ecdict-cet.js --input=data/samples/ecdict_sample.csv --output=data/processed/cet_words.sample.json
```

正式数据可将 ECDICT CSV 放到 `data/raw/ecdict.csv` 后执行：

```bash
node scripts/clean-ecdict-cet.js --input=data/raw/ecdict.csv --output=data/processed/cet_words.full.json
```

## 4. 导入数据

### 方式 A：CLI 导入（推荐）

先登录腾讯云 CloudBase CLI：

```bash
tcb login
```

然后执行：

```bash
CLOUDBASE_ENV=cloud1-6gy3kt0i80a1304f node scripts/init-cloudbase.js
CLOUDBASE_ENV=cloud1-6gy3kt0i80a1304f node scripts/import-cloudbase-data.js --clean --input=data/processed/cet_words.full.json --batch-size=100
```

没有正式登录时可 dry-run：

```bash
node scripts/init-cloudbase.js --dry-run
node scripts/import-cloudbase-data.js --dry-run --input=data/processed/cet_words.full.json --batch-size=500
```

### 方式 B：云开发控制台手动导入

生成可手动导入文件：

```bash
node scripts/prepare-cloudbase-import-files.js --input=data/processed/cet_words.full.json --out=data/import
```

然后在微信开发者工具 → 云开发 → 数据库：

1. 创建集合：`word_banks`、`words`、`grammar_topics`
2. 进入 `word_banks` 集合 → 导入 → 选择 `data/import/word_banks.array.json` 或 `data/import/word_banks.jsonl`
3. 进入 `words` 集合 → 导入 → 选择 `data/import/words.array.json` 或 `data/import/words.jsonl`
4. 进入 `grammar_topics` 集合 → 导入 → 选择 `data/import/grammar_topics.array.json` 或 `data/import/grammar_topics.jsonl`

如果控制台导入 JSON 数组失败，就使用 `.jsonl` 文件；如果 `.jsonl` 失败，就使用 `.array.json` 文件。

## 5. 微信开发者工具内确认

- 云开发控制台能看到集合：`word_banks`, `words`, `grammar_topics`, `favorites`, `mistake_books`, `user_word_records`
- 首页能读取 `getStudyProgress`
- 词库页能读取 `getWordBanks`
- 学习页能写入 `user_word_records`、`favorites`、`mistake_books`
