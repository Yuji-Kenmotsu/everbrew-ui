# everbrew-ui ― プロジェクト固有ルール（Claude Code 向け）

ユーザーレベル `~/.claude/CLAUDE.md` の共通ルールに加え、このリポジトリでは以下を厳守する。
（README は人間向けの導入。本ファイルは Claude Code 向けの恒久ルールで読者が違う。）

## 正本ドライブの一本化
- **正本は `C:\Users\Yuji Kenmotsu\Documents\projects\everbrew-ui`**（このコピー）。
- `E:\Claude\UI_Design\everbrew-ui-starter\everbrew-ui` に origin 接続済みの**旧コピー**が別に存在する。
  - E: 側は**使わない / 触らない**（後で削除予定）。E: 側で push すると履歴が GitHub と再分離する事故になる。
- 作業前 pull・離脱前 push を守り、最新は常に origin/main で確定させる。

## このリポジトリは静的UIライブラリ（GAS ではない）
- **clasp は使わない。** GAS プロジェクトではないので `clasp push` / `clasp deploy` は無関係。
- 配布は **jsDelivr のタグ固定**（`@vX.Y.Z`）。ブランチ参照（@main）は使わせない。各アプリ側でタグを上げて更新時期を制御する。
- **`dist/` はコミットする。** jsDelivr が配信する実体であり、`.github/workflows/build.yml` が `.min` を生成する。`src/` 編集後は `node build.mjs` で `dist/` を再生成してからコミットする。
- 確認用 HTML は `demo/index.html` 以外に増やさない。一時スクショ（`*.png`）はリポジトリに残さない（.gitignore 済み）。

## デザイン/トークンの所在分離
- 色・寸法 = `src/tokens.css`、骨格 = `src/shell.css`、その他共有部品 = `src/components.css`。この分離を崩さない。
- 色はブランド体系を厳守: `--eb-brand`(#58b9e2) に白文字を直接載せない。インタラクティブ要素は `--eb-brand-deep`(#2b86ae、WCAG準拠)。
- デザイン基準は lark-message-analytics（構造・余白・タイポ・質感）。色はブランド体系を優先する。
