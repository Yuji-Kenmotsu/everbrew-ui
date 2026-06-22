<#  init-everbrew-ui.ps1
    everbrew-ui の public リポジトリを gh CLI で新規作成し、雛形を push してタグを切る。
    Claude Code から実行する想定。auth は gh / GitHub App(PAT は使わない)。

    前提: カレントが everbrew-ui の雛形フォルダ(src/ build.mjs 等がある)。
    使い方: pwsh ./scripts/init-everbrew-ui.ps1 -Owner "Yuji-Kenmotsu" -Version "v0.1.0"
#>
param(
  [string]$Owner   = "Yuji-Kenmotsu",
  [string]$Repo    = "everbrew-ui",
  [string]$Version = "v0.1.0",
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"

function Run($cmd) {
  Write-Host "› $cmd" -ForegroundColor Cyan
  if (-not $DryRun) { Invoke-Expression $cmd }
}

# 1) public リポジトリ作成(デザインシステムは見た目のみ=公開可。秘密は入れない)
Run "gh repo create $Owner/$Repo --public --description 'EVER BREW unified UI (tokens + app shell)' --disable-wiki"

# 2) ビルドして dist を生成
Run "node build.mjs"

# 3) 初期コミット & push。日本語コミットは here-string を避け -F を使う(PS5.1対策)
if (-not (Test-Path .git)) { Run "git init -b main" }
Run "git remote add origin https://github.com/$Owner/$Repo.git"
Run "git add -A"
$msg = New-TemporaryFile
"feat: everbrew-ui 初版(トークン + アプリシェル)" | Out-File -FilePath $msg -Encoding utf8
Run "git commit -F `"$($msg.FullName)`""
Run "git push -u origin main"

# 4) バージョンタグ(jsDelivr はタグ単位で配信)
Run "git tag $Version"
Run "git push origin $Version"

Write-Host ""
Write-Host "完了。CDN URL(数分後に有効):" -ForegroundColor Green
Write-Host "  https://cdn.jsdelivr.net/gh/$Owner/$Repo@$Version/dist/everbrew.min.css"
Write-Host "  https://cdn.jsdelivr.net/gh/$Owner/$Repo@$Version/dist/everbrew.min.js"
