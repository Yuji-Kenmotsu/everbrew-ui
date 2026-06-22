<#  init-everbrew-ui.ps1
    Create the public everbrew-ui repo via gh CLI, push the scaffold, and tag it.
    NOTE: This file is PURE ASCII on purpose, so it cannot be garbled by a
    Shift-JIS (cp932) console or editor. The only Japanese (the commit message)
    is embedded as UTF-8 bytes and restored at runtime via JP().
    Usage: ./scripts/init-everbrew-ui.ps1 -Owner "Yuji-Kenmotsu" -Version "v0.1.0"
#>
param(
  [string]$Owner   = "Yuji-Kenmotsu",
  [string]$Repo    = "everbrew-ui",
  [string]$Version = "v0.1.0",
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"

function JP([byte[]]$b) { [System.Text.Encoding]::UTF8.GetString($b) }
function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}
function Run($cmd) {
  Write-Host "-> $cmd" -ForegroundColor Cyan
  if (-not $DryRun) { Invoke-Expression $cmd }
}

Run "gh repo create $Owner/$Repo --public --description 'EVER BREW unified UI (tokens + app shell)' --disable-wiki"
Run "node build.mjs"
if (-not (Test-Path .git)) { Run "git init -b main" }
Run "git remote add origin https://github.com/$Owner/$Repo.git"
Run "git add -A"
$msg = New-TemporaryFile
$initMsg = JP @(0x66,0x65,0x61,0x74,0x3a,0x20,0x65,0x76,0x65,0x72,0x62,0x72,0x65,0x77,0x2d,0x75,0x69,0x20,0xe5,0x88,0x9d,0xe7,0x89,0x88,0x28,0xe3,0x83,0x88,0xe3,0x83,0xbc,0xe3,0x82,0xaf,0xe3,0x83,0xb3,0x20,0x2b,0x20,0xe3,0x82,0xa2,0xe3,0x83,0x97,0xe3,0x83,0xaa,0xe3,0x82,0xb7,0xe3,0x82,0xa7,0xe3,0x83,0xab,0x29)
Write-Utf8NoBom $msg.FullName $initMsg
Run "git commit -F `"$($msg.FullName)`""
Run "git push -u origin main"
Run "git tag $Version"
Run "git push origin $Version"

Write-Host ""
Write-Host "Done. CDN URLs (live in a few minutes):" -ForegroundColor Green
Write-Host "  https://cdn.jsdelivr.net/gh/$Owner/$Repo@$Version/dist/everbrew.min.css"
Write-Host "  https://cdn.jsdelivr.net/gh/$Owner/$Repo@$Version/dist/everbrew.min.js"
