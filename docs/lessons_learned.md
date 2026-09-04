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

---

## 2026-09-04 #6 承認済みモック HTML は体裁の正本ではない

- **経緯**: Cowork の出力がリポ直下の `Claude outputs/` に落ちていた
  （`status-dashboard-mock.html` / 指示書 `.md`）。プロジェクト規約
  「確認用 HTML は `demo/index.html` 以外に増やさない」に触れるため commit していない。
- **対応**: `..\_scratch\status-dashboard-mock-v2.html` へ移動し、`.gitignore` に
  `Claude outputs/` を追加した（出力先設定が直るまでの保険）。
- **位置づけ**: **見た目の正本は `src/status.css` 冒頭の DOM 契約**。
  モック HTML は「承認時にどう見えていたか」の記録にすぎない。
  モックと CSS が食い違ったら CSS を正とし、モックは更新しない。

## 2026-09-04 #7 IntersectionObserver の reveal は「撮影」で消える 【昇格候補】

- **事象**: viewport 1000px でスクロールせずに fullPage スクショを撮ると、
  下方の節が `opacity:0` のまま写り、2節が丸ごと白紙になった。
- **原因**: reveal を IO だけに任せていた。人が読むときは必ずスクロールするが、
  **スクリーンショット・headless の PDF 生成・印刷プレビューはスクロールしない**。
  `beforeprint` を足しても救えるのは印刷経路だけ。
- **対策**: ①`DOMContentLoaded` から 1500ms のタイムアウトで未 reveal を強制確定
  ②`window.ebsRevealAll()` を公開して自動化から1行で確定できるようにする（冪等）
  ③カウントアップにも中断フラグを持たせ、確定要求後に走行中の rAF が
  中間値を書き戻さないようにする。
  **スクロール前提の演出を入れたら「撮られる経路」を必ず1つ用意する。**

## 2026-09-04 #8 `:first-child` は「見た目の先頭」ではなく DOM の先頭

- **事象**: 「最初のグループ行だけ上余白を消す」ための
  `.ebs-gantt__row--group:first-child` が一度も当たらなかった。
- **原因**: `.ebs-gantt` の実際の最初の子は `position:absolute` の
  `.ebs-gantt__today`。浮いていても DOM 上は先頭なので `:first-child` を奪う。
- **対策**: `.ebs-gantt__today + .ebs-gantt__row--group` を併記する。
  絶対配置の兄弟がある構造で `:first-child` を使うときは、
  DOM 順を実測してから書く（`getComputedStyle` で確認できる）。

## 2026-09-04 #9 `.eb-badge--ok` は AA 未達（未修正・要判断）【昇格候補】

- **事象**: `components.css` の `.eb-badge--ok`（`--eb-ok` on `--eb-ok-soft`）は
  コントラスト **3.80:1**。11px 太字は WCAG の「大きい文字」に当たらないため AA（4.5:1）未達。
  型E の `.ebs-chip--end` が同じ組み合わせで同じ問題を持っていた。
- **原因**: `--eb-ok`(#2f8a57) が soft 面に載せるには明るすぎる。
  既存トークンの組み合わせでは 4.5:1 に届くものが無かった（白 on `--eb-ok` でも 4.29:1）。
- **対策（部分適用）**: `tokens.css` に **`--eb-ok-deep`(#24704a)** を追加した
  （ok-soft 上 5.33:1 / 白上 6.01:1 / surface-2 上 5.61:1）。
  型E の `.ebs-chip--end` はこれに差し替え済み（実測 5.33:1）。
- **未対応**: `.eb-badge--ok` は**あえて変えていない**。
  直すと**既存の全 GAS アプリのバッジの見た目が変わる**ため、影響範囲の判断が別途要る。
  置換自体は `--eb-ok-deep` があるので1行でできる。**人間の判断待ち。**
