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

```bash
CLOUDBASE_ENV=你的环境ID node scripts/import-cloudbase-data.js --input=data/processed/cet_words.full.json
```

没有正式环境时可 dry-run：

```bash
node scripts/import-cloudbase-data.js --dry-run --input=data/processed/cet_words.sample.json
```

## 5. 微信开发者工具内确认

- 云开发控制台能看到集合：`word_banks`, `words`, `grammar_topics`, `favorites`, `mistake_books`, `user_word_records`
- 首页能读取 `getStudyProgress`
- 词库页能读取 `getWordBanks`
- 学习页能写入 `user_word_records`、`favorites`、`mistake_books`
