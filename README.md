# 料理メモ（旧 Air Fryer Times）

レシピと加熱時間をまとめた個人用メモ。エアフライヤー専用だったものを、料理全般を置ける形に作り変えました。

公開URL: https://cooking-notes.vercel.app/

旧 `air-fryer-times`（リポジトリ・Vercelプロジェクト・旧URL）から2026-08-09に改名。旧URL `air-fryer-times.vercel.app` は失効しています。

## 構成

| ファイル | 役割 |
| --- | --- |
| `data.js` | 掲載内容。`recipes`（手順つき）と `quickTable`（温度と時間だけ）の2配列 |
| `app.js` | タブ切替、検索、フィルタ、開閉状態の保存 |
| `index.html` / `styles.css` | 画面 |

## 2つのタブ

- **レシピ** … 材料・手順・押さえるポイント・別のやり方を持つもの。現在は醤油麹（低温調理器・60℃×6時間）。
- **加熱早見表** … 温度と時間だけの一覧。エアフライヤーの食材8点。

器具・ジャンルはデータ側の文字列がそのままフィルタになるので、`data.js` に追記するだけで選択肢が増えます。

## 追加のしかた

レシピを増やすときは `data.js` の `recipes` に1件足します。`id` は他と重複しない英小文字で（開閉状態の保存キーになります）。

```js
{
  id: "shio-koji",
  name: "塩麹",
  genre: "発酵・仕込み",
  tool: "低温調理器",
  lead: "1行の説明",
  specs: [{ label: "温度", value: "60℃" }],
  ingredients: [{ item: "米麹（生）", amount: "100g", note: "任意" }],
  steps: [{ title: "見出し", body: "本文", meta: "任意のバッジ" }],
  points: [{ title: "見出し", body: "本文" }],   // 任意
  variants: [{ title: "見出し", body: "本文" }], // 任意
  doneCheck: "完成の目安",                        // 任意
  uses: "使い道",                                 // 任意
}
```

早見表は `quickTable` に `tool` / `category` / `state` / `temp` / `time` / `turn` / `finish` / `tip` を持つオブジェクトを足します。

## キーボード操作

`/` 検索 ／ `1` `2` タブ切替 ／ `⌘←` `⌘→` タブ移動 ／ `e` レシピ全開閉 ／ `Esc` 検索クリア

表示条件と開閉状態は localStorage（キー `kitchen-notes.v1`）に保存され、次回そのまま復元されます。

## 使い方

```bash
npm run check
npm start
```

ローカル確認後、GitHubへpushしてVercelへ公開します。

```bash
git status -sb
git add .
git commit -m "Update kitchen notes"
git push
vercel --prod --yes
```

## 情報の扱い

- 加熱時間は機種差が出るので、短めから始めて1から2分ずつ追加します。
- 肉と魚は中心温度を優先します。安全温度の根拠はFoodSafety.govの表を参照しています。
- 発酵ものは温度帯に理由（酵素の失活温度など）を必ず書き添えます。
