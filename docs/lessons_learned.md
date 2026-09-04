# everbrew-ui : lessons learned

事後の知見（事象 / 原因 / 対策）。事前の設計判断は書かない。
一般化できるものは **【昇格候補】** を付け、週次の `/知見統合` で中央へ上げる。

---

## 2026-09-04 #1 A4縦の刷り幅はモバイル分岐に入る 【昇格候補】

- **事象**: 進捗ダッシュボード（型E）を Ctrl+P すると、PC 画面では3カラムのカンバンが1カラムになり、
  ガントの「今日」マーカーが消えた。
- **原因**: A4縦・余白12mm の刷り幅は **186mm ≒ 703 CSS px**。
  `@media (max-width: 768px)` のモバイル分岐に**入ってしまう**。
  「印刷 = 大きい画面」という思い込みが誤りだった。
- **対策**: `@media print` を**モバイル分岐より後ろ**に置き、多カラム配置・フォントサイズ・余白を
  明示的に戻す（同一詳細度なら後勝ち）。`src/status.css` の print 節がその実装。
  印刷CSSを書くときは「印刷 = 狭い幅」を前提にレイアウトを確認する。

## 2026-09-04 #2 `@media print` は「印刷時の分割単位」を節ではなく部品に置く

- **事象**: `.ebs-sec`（節）に `break-inside: avoid` を付けたら、カンバン節の高さ 1040px が
  A4の刷り高 1032px を超え、避けられずに分割された上、前ページに大きな空白が出た。
- **原因**: 1ページに収まらない要素の `break-inside: avoid` はブラウザが無視する。
  節単位で不可分にすると、収まらない節が出た瞬間に破綻する。
- **対策**: 節は分割を許し、**壊れると読めなくなる最小単位**
  （ヘッダー / リング / ガント全体 / カンバンの1列 / ブロッカー1件）だけを不可分にする。
  実測で最大 516px となり、余裕を持って1ページに収まった。

## 2026-09-04 #3 `position: relative` の兄弟は `z-index: auto` の絶対配置を覆う

- **事象**: ガントの「今日」マーカーのラベルが描画されているのに見えなかった
  （`document.elementFromPoint` が `.ebs-gantt__track` を返した）。
- **原因**: マーカー（`position: absolute`）もトラック（`position: relative`）も `z-index: auto` で、
  **DOM順が後のトラックが後から描かれる**。位置指定要素同士は「前に書いた方が下」になる。
- **対策**: マーカー側に `z-index: 1` を付ける。
  目視だけで「消えている」と判断せず、`elementFromPoint` で覆っている要素を特定すると早い。

## 2026-09-04 #4 jsDelivr の `.min` はリポにもワークフローにも存在しない

- **事象**: 「`.github/workflows/build.yml` が `.min` を生成する対象に新ファイルが入るか確認せよ」
  という前提の指示を受けたが、build.yml に `.min` を作る処理は無かった。
- **原因**: `.min` は **jsDelivr が配信時に動的生成**している。リポの `dist/` には存在しない。
  実際 `dist/everbrew-status.min.css` は commit していないのに 200 で配信される（16,819 bytes）。
- **対策**: build.yml は `git add dist` で `dist/` 全体を拾うので、**出力を増やしても workflow の変更は不要**。
  `.min` の健全性はリポではなく **CDN 側で実測**する（minify で `calc()` やカスタムプロパティが
  壊れていないかを、`.min` を読み込んだ実描画で確認した）。

## 2026-09-04 #5 Node の `import.meta.url` はスペース入りパスで壊れる 【昇格候補】

- **事象**: `new URL("./", import.meta.url).pathname` から組んだパスで `ENOENT`。
  実体は `C:\Users\Yuji%20Kenmotsu\...`（`%20` のまま）。
- **原因**: `pathname` は URL のパーセントエンコードを解かない。
  ユーザー名にスペースが入る Windows 環境（`Yuji Kenmotsu`）で必ず踏む。
- **対策**: `import { fileURLToPath } from "node:url"` を使い
  `fileURLToPath(new URL("./", import.meta.url))` にする。
  **`~/.claude/scripts/render-status.mjs`（セッションB）でも同じ罠を踏むので注意。**
