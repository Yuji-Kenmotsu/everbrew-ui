<#  apply-everbrew-ui.ps1
    Apply / bump everbrew-ui in ONE GAS project. Idempotent sentinel block
    (re-run does not duplicate; a version bump replaces in place).
    PURE ASCII source. Japanese (commit message + CLAUDE.md guardrail) is
    embedded as UTF-8 bytes and restored at runtime via JP().
    Usage:
      ./apply-everbrew-ui.ps1 -ProjectPath "E:\...\projects\stockscan" -Version v1.0.0
      ./apply-everbrew-ui.ps1 -ProjectPath ... -Version v1.1.0 -DryRun
#>
param(
  [Parameter(Mandatory)] [string]$ProjectPath,
  [Parameter(Mandatory)] [string]$Version,
  [string]$Owner   = "Yuji-Kenmotsu",
  [string]$Repo    = "everbrew-ui",
  [string]$Partial = "_everbrew_ui.html",
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"

function JP([byte[]]$b) { [System.Text.Encoding]::UTF8.GetString($b) }
function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}
function Read-Text([string]$Path) { [System.IO.File]::ReadAllText($Path) }

$base  = "https://cdn.jsdelivr.net/gh/$Owner/$Repo@$Version/dist"
$block = @(
  "<!-- EVERBREW-UI:START (apply-everbrew-ui.ps1 manages this block) -->"
  "<link rel=`"stylesheet`" href=`"$base/everbrew.min.css`">"
  "<script defer src=`"$base/everbrew.min.js`"></script>"
  "<!-- EVERBREW-UI:END -->"
) -join "`n"

$srcDir = $ProjectPath
$claspCfg = Join-Path $ProjectPath ".clasp.json"
if (Test-Path $claspCfg) {
  $root = (Get-Content $claspCfg -Raw | ConvertFrom-Json).rootDir
  if ($root) { $srcDir = Join-Path $ProjectPath $root }
}
$partialPath = Join-Path $srcDir $Partial

if (Test-Path $partialPath) {
  $cur = Read-Text $partialPath
  if ($cur -match "(?s)<!-- EVERBREW-UI:START.*?EVERBREW-UI:END -->") {
    $new = [regex]::Replace($cur, "(?s)<!-- EVERBREW-UI:START.*?EVERBREW-UI:END -->", [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $block })
  } else {
    $new = $block + "`n" + $cur
  }
} else {
  $new = $block + "`n"
}
Write-Host "-> $partialPath ($Version)" -ForegroundColor Cyan
if (-not $DryRun) { Write-Utf8NoBom $partialPath $new }

$claudeMd = Join-Path $ProjectPath "CLAUDE.md"
$rule = "- UI: chrome" + (JP @(0x28,0xe3,0x82,0xb5,0xe3,0x82,0xa4,0xe3,0x83,0x89,0xe3,0x83,0x90,0xe3,0x83,0xbc,0x2f,0xe3,0x83,0x88,0xe3,0x83,0x83,0xe3,0x83,0x97,0xe3,0x83,0x90,0xe3,0x83,0xbc,0x2f,0xe3,0x83,0xad,0xe3,0x82,0xb4,0x2f,0xe3,0x82,0xbf,0xe3,0x83,0x96,0x29,0xe3,0x81,0xaf,0x20,0x65,0x76,0x65,0x72,0x62,0x72,0x65,0x77,0x2d,0x75,0x69,0x40)) + $Version + (JP @(0x20,0xe3,0x81,0x8b,0xe3,0x82,0x89,0xe8,0xaa,0xad,0xe3,0x82,0x80,0xe3,0x80,0x82,0xe6,0x89,0x8b,0xe6,0x9b,0xb8,0xe3,0x81,0x8d,0xe3,0x81,0xa7,0xe5,0x86,0x8d,0xe5,0xae,0x9f,0xe8,0xa3,0x85,0xe3,0x81,0x97,0xe3,0x81,0xaa,0xe3,0x81,0x84,0xe3,0x80,0x82))
if (Test-Path $claudeMd) {
  $md = Read-Text $claudeMd
  if ($md -notmatch "everbrew-ui@") {
    if (-not $DryRun) { Write-Utf8NoBom $claudeMd ($md.TrimEnd() + "`n" + $rule + "`n") }
    Write-Host "-> CLAUDE.md: added guardrail" -ForegroundColor Cyan
  } else {
    if (-not $DryRun) {
      $md2 = [regex]::Replace($md, "everbrew-ui@v[\d.]+", "everbrew-ui@$Version")
      Write-Utf8NoBom $claudeMd $md2
    }
    Write-Host "-> CLAUDE.md: bumped version to $Version" -ForegroundColor Cyan
  }
}

if (-not $DryRun) {
  Push-Location $ProjectPath
  $msg = New-TemporaryFile
  $applyMsg = "chore(ui): everbrew-ui " + (JP @(0xe3,0x82,0x92,0x20)) + $Version + (JP @(0x20,0xe3,0x81,0xab,0xe5,0x9b,0xba,0xe5,0xae,0x9a))
  Write-Utf8NoBom $msg.FullName $applyMsg
  git add -- $Partial CLAUDE.md 2>$null
  git commit -F "$($msg.FullName)" 2>$null
  Pop-Location
}
Write-Host "Done. Review changes, then run 'git push' and 'clasp push' in each project." -ForegroundColor Green
