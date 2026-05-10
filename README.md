# 金山杉クラフトコーラ 試飲アンケートアプリ

Vercelにそのままデプロイできる静的Webアプリです。

## 機能

- スマホ対応アンケート入力
- ⭐総合評価
- Supabase DB保存
- 統計照会
- 全件CSVダウンロード
- 美杉ちゃん画像差し替え
- 金山背景画像差し替え

## ファイル

- `index.html`
- `style.css`
- `script.js`
- `config.js`
- `supabase-schema.sql`
- `README.md`

## 画像

同じフォルダに以下を置いてください。

- `misugichan.png`：美杉ちゃん画像
- `kanayama-bg.jpg`：金山の風景背景

画像がなくてもアプリ自体は動きます。

## Supabase設定

### 1. テーブル作成

Supabase管理画面の SQL Editor で `supabase-schema.sql` の内容を実行してください。

### 2. config.js を編集

`config.js` の以下を自分のSupabase情報に差し替えます。

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
```

Supabase管理画面で確認できます。

- Project Settings > Data API：Project URL
- Project Settings > API Keys：anon public key

### 3. 管理用パスコード

`config.js` の以下を変更してください。

```js
const ADMIN_PASSCODE = "kanayama";
```

## Vercelデプロイ

1. GitHubにこのファイル一式をアップロード
2. VercelでNew Project
3. 対象リポジトリを選択
4. Framework PresetはOtherまたは自動
5. Deploy

## 注意

この構成は「イベント用の簡易管理画面」です。

CSV取得画面はパスコードで隠していますが、完全なセキュリティではありません。
回答データを厳密に守りたい場合は、Supabase AuthやEdge Functionsで管理者認証を入れてください。
