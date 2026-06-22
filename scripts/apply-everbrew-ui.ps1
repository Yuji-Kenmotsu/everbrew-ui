<#  apply-everbrew-ui.ps1
    1つの GAS プロジェクトに everbrew-ui を反映(初回)/バージョン更新する。
    sentinel ブロックを冪等に書き換えるので、何度実行しても重複しない。

    使い方:
      pwsh ./apply-everbrew-ui.ps1 -ProjectPath "C:\Users\...\projects\stockscan" -Version v1.0.0
      pwsh ./apply-everbrew-ui.ps1 -ProjectPath ... -Version v1.1.0 -DryRun
#>
param(
  [Parameter(Mandatory)] [string]$ProjectPath,
  [Parameter(Mandatory)] [string]$Version,
  [string]$Owner   = "Yuji-Kenmotsu",
  [string]$Repo    = "everbrew-ui",
  [string]$Partial = "_everbrew_ui.html",  # GAS の clasp src 内に置く include 用パーシャル
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"

$base  = "https://cdn.jsdelivr.net/gh/$Owner/$Repo@$Version/dist"
$block = @(
  "<!-- EVERBREW-UI:START (apply-everbrew-ui.ps1 が管理。手で編集しない) -->"
  "<link rel=`"stylesheet`" href=`"$base/everbrew.min.css`">"
  "<script defer src=`"$base/everbrew.min.js`"></script>"
  "<!-- EVERBREW-UI:END -->"
) -join "`n"

# clasp src ディレクトリを推定(.clasp.json の rootDir、無ければ src/ か直下)
$srcDir = $ProjectPath
$claspCfg = Join-Path $ProjectPath ".clasp.json"
if (Test-Path $claspCfg) {
  $root = (Get-Content $claspCfg -Raw | ConvertFrom-Json).rootDir
  if ($root) { $srcDir = Join-Path $ProjectPath $root }
}
$partialPath = Join-Path $srcDir $Partial

# --- パーシャルの sentinel ブロックを冪等に upsert ---
if (Test-Path $partialPath) {
  $cur = Get-Content $partialPath -Raw
  if ($cur -match "(?s)<!-- EVERBREW-UI:START.*?EVERBREW-UI:END -->") {
    $new = [regex]::Replace($cur, "(?s)<!-- EVERBREW-UI:START.*?EVERBREW-UI:END -->", [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $block })
  } else {
    $new = $block + "`n" + $cur
  }
} else {
  $new = $block + "`n"
}
Write-Host "→ $partialPath ($Version)" -ForegroundColor Cyan
if (-not $DryRun) { $new | Out-File -FilePath $partialPath -Encoding utf8 }

# --- CLAUDE.md にガードレールを1行(無ければ追記) ---
$claudeMd = Join-Path $ProjectPath "CLAUDE.md"
$rule = "- UI: chrome(サイドバー/トップバー/ロゴ/タブ)は everbrew-ui@$Version から読む。手書きで再実装しない。"
if (Test-Path $claudeMd) {
  $md = Get-Content $claudeMd -Raw
  if ($md -notmatch "everbrew-ui@") {
    if (-not $DryRun) { Add-Content $claudeMd "`n$rule" }
    Write-Host "→ CLAUDE.md にガードレール追記" -ForegroundColor Cyan
  } else {
    if (-not $DryRun) {
      $md2 = [regex]::Replace($md, "everbrew-ui@v[\d.]+", "everbrew-ui@$Version")
      $md2 | Out-File -FilePath $claudeMd -Encoding utf8
    }
    Write-Host "→ CLAUDE.md のバージョンを $Version に更新" -ForegroundColor Cyan
  }
}

# --- コミット(日本語メッセージは -F で。push と clasp push は人間が確認して実行) ---
if (-not $DryRun) {
  Push-Location $ProjectPath
  $msg = New-TemporaryFile
  "chore(ui): everbrew-ui を $Version に固定" | Out-File -FilePath $msg -Encoding utf8
  git add -- $Partial CLAUDE.md 2>$null
  git commit -F "$($msg.FullName)" 2>$null
  Pop-Location
}
Write-Host "完了。確認後に各プロジェクトで git push と clasp push を実行してください。" -ForegroundColor Green
