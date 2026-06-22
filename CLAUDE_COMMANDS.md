# Claude Code スラッシュコマンド定義(everbrew-ui 用)
# 既存の /再開 /振り返り /立ち上げ と同じ場所(~/.claude/commands/ など)に置く想定。

## /ui立ち上げ
目的: everbrew-ui の public リポジトリを新規作成し、雛形を push して初版タグを切る。
中央リポジトリ(everbrew-claude-config)には一切書き込まない。

手順:
1. この雛形フォルダ(src/ build.mjs 等)がカレントにあることを確認する。
2. `node build.mjs` で dist を生成し、`node verify.mjs` が PASS することを確認する。
3. `scripts/init-everbrew-ui.ps1 -Owner Yuji-Kenmotsu -Version v0.1.0` を実行する。
   - gh CLI で public リポジトリを作成・push・タグ付けまで行う。
   - 日本語コミットは git commit -F を使う(PS5.1 の here-string 問題を回避)。
4. 出力された jsDelivr URL をユーザーに提示し、ブラウザで配信開始を確認してもらう
   (タグ反映に数分かかる場合がある)。

## /ui配布 <ProjectPath> <Version>
目的: 指定した1つの GAS プロジェクトに everbrew-ui を反映/バージョン更新する。

手順:
1. 対象プロジェクトの .clasp.json と include パーシャル名を確認する。
2. `scripts/apply-everbrew-ui.ps1 -ProjectPath <ProjectPath> -Version <Version> -DryRun`
   を先に実行し、差分(sentinel ブロックの upsert と CLAUDE.md 追記)を提示する。
3. ユーザーが承認したら -DryRun を外して実行する。
   - sentinel ブロックは冪等更新(二度実行しても重複しない / 版更新は in-place 置換)。
   - CLAUDE.md に「chrome は everbrew-ui@<Version> から読む。手書きしない」を追記/更新。
4. コミットまで自動。**git push と clasp push はユーザーが確認して実行**する
   (本番デプロイに関わる不可逆操作のため自動化しない)。

## /ui一括配布 <Version>
目的: 全プロジェクトへ順次反映。
手順:
1. projects 配下の対象プロジェクト一覧をユーザーに提示し、対象を確認する。
2. リスクの低い順(例: Type A → B → C)に /ui配布 を1つずつ実行する。
3. 各プロジェクトで demo と同等の表示確認(iPhone Chrome)が取れてから次へ進む。
   一度に全部 push しない(段階ロールアウト)。
