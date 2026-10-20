# emoji shelf

公開URL: https://ttsukasan.github.io/emoji-shelf/

広告なし・ログインなし・保存なしの絵文字一覧。クリックで絵文字をコピーできます。
各絵文字の下にSlackでの名前(`cry`, `innocent` など)を表示し、日本語・英語・Slack名で検索できます。

- Preact + Vite + TypeScript
- データ: [emojibase-data](https://github.com/milesj/emojibase)(日本語ラベル/タグ、iamcalのショートコード)
- 肌色バリアントは含めず、基本セットのみ

## 開発

```sh
npm install
npm run dev      # 開発サーバー (データ生成も自動実行)
npm run build    # dist/ に出力
```

`src/data/emoji.json` は `npm run data` で生成されます(git管理外)。

## 公開

`main` へ push すると GitHub Actions が GitHub Pages にデプロイします。
リポジトリの Settings → Pages → Source を **GitHub Actions** にしてください。
