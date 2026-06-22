# everbrew-ui

EVER BREW の全 GAS Web アプリで共有する単一のUI実装(デザイントークン + アプリシェル)。
各プロジェクトは UIガイドライン.md を「読んで実装し直す」のをやめ、ここを CDN 経由で読むだけにする。

## 構成
- `src/tokens.css` … 色・余白・文字・角丸・影・モーションの唯一の定義
- `src/shell.css` / `src/shell.js` … サイドバー/トップバー/ロゴ/タブ(`<eb-shell>`)
- `src/components.css` … 共有コンポーネント
- `dist/` … 結合済み(jsDelivr が `.min` を自動生成)
- `demo/index.html` … 実装を「詰める」場所。iPhone Chrome で確認
- `scripts/` … 立ち上げ・反映の自動化

## 配布(タグ固定)
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Yuji-Kenmotsu/everbrew-ui@v1.0.0/dist/everbrew.min.css">
<script defer src="https://cdn.jsdelivr.net/gh/Yuji-Kenmotsu/everbrew-ui@v1.0.0/dist/everbrew.min.js"></script>
```
※ public リポジトリ必須(jsDelivr は private を配信しない)。見た目のみを置き、秘密は入れない。
※ ブランチ参照(@main)ではなくタグ(@v1.0.0)に固定し、更新時期は各アプリで制御する。

## 使い方(各アプリ)
```html
<eb-shell active-app="canlabel" title="缶ラベル"
  brand="RIO BREWING"
  user="剱持 雄二"
  mobile-nav="auto"
  apps='[{"id":"canlabel","label":"缶ラベル","href":"/label","icon":"label"}, ...]'
  tabs='[{"id":"list","label":"一覧"}]'>
  <div slot="content"> このアプリ固有の中身だけ </div>
</eb-shell>
```

### 属性
- `brand` … サイドバーのロゴ文字(既定 `EVER BREW`)
- `user` … トップバー右のアカウント表示。文字列 or `{"name","initial"}`。未指定なら非表示
- `mobile-nav` … `auto`(既定)/ `bar` / `drawer`
  - `auto`: サイドバー項目 5個以下 → 下部タブバー、6個以上 → ハンバーガー＋ドロワー
  - PC(>768px)は常に左サイドバー。下部バー/ドロワーはモバイル幅のみ
- `icon` 候補: `label` `seal` `image` `master` `menu` `stock` `invoice` `dot`

## 開発
```bash
node build.mjs     # src -> dist
node verify.mjs    # <eb-shell> をjsdomでマウント検証
```

## バージョン運用
1. `src/` を編集 → `node build.mjs` → `demo/` で確認
2. `main` に push(Action が dist を再生成)
3. `git tag vX.Y.Z && git push origin vX.Y.Z`
4. 各アプリを `apply-everbrew-ui.ps1 -Version vX.Y.Z` で順次更新
