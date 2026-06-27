# auto-ice-lances-asura — one-line web installer.
#
# Paste this into PowerShell (Win+R -> "powershell" -> Enter), then press Enter:
#   irm https://raw.githubusercontent.com/czentovic-tr/auto-ice-lances-asura/main/web-install.ps1 | iex
#
# It will pop ONE Windows "allow admin?" box (required to write into Program Files) — click Yes.
# Everything else is automatic. After it finishes, just restart TERA Toolbox.

$ErrorActionPreference = 'Stop'
$repo    = 'https://raw.githubusercontent.com/czentovic-tr/auto-ice-lances-asura/main'
$modName = 'salchyautoicelances'

# 1) Re-launch elevated if we're not admin (writing to Program Files needs it).
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
         ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $admin) {
    Write-Host "Requesting administrator (one popup)..." -ForegroundColor Yellow
    $boot = "irm $repo/web-install.ps1 | iex"
    Start-Process powershell -Verb RunAs -ArgumentList `
        '-NoProfile','-NoExit','-ExecutionPolicy','Bypass','-Command',$boot
    return
}

# 2) Find the TERA Toolbox folder.
$tb = @(
    'C:\Program Files (x86)\TeraToolbox Private (Asura Edition)',
    'C:\Program Files\TeraToolbox Private (Asura Edition)'
) | Where-Object { Test-Path (Join-Path $_ 'bin\loader-gui.js') } | Select-Object -First 1

if (-not $tb) {
    foreach ($base in @(${env:ProgramFiles(x86)}, $env:ProgramFiles, 'C:\', 'D:\')) {
        if (-not $base -or -not (Test-Path $base)) { continue }
        $hit = Get-ChildItem $base -Directory -ErrorAction SilentlyContinue |
               Where-Object { Test-Path (Join-Path $_.FullName 'bin\loader-gui.js') } |
               Select-Object -First 1
        if ($hit) { $tb = $hit.FullName; break }
    }
}
if (-not $tb) { throw "Couldn't find your TERA Toolbox install. Open the toolbox once, then re-run this." }

# 3) Download the mod into mods\<modName>, preserving any existing config.json (your settings).
$dest = Join-Path $tb "mods\$modName"
New-Item -ItemType Directory -Path $dest -Force | Out-Null
Write-Host "Installing to $dest" -ForegroundColor Cyan

foreach ($f in 'index.js','module.json','module.config.json','settings_migrator.js','settings_structure.js','manifest.json','README.md') {
    Invoke-WebRequest "$repo/$f" -OutFile (Join-Path $dest $f) -UseBasicParsing
    Write-Host "  downloaded $f"
}
$cfg = Join-Path $dest 'config.json'
if (Test-Path $cfg) {
    Write-Host "  kept existing config.json (settings preserved)"
} else {
    Invoke-WebRequest "$repo/config.json" -OutFile $cfg -UseBasicParsing
    Write-Host "  downloaded config.json (defaults)"
}

Write-Host ""
Write-Host "DONE. Restart TERA Toolbox, then on a Sorcerer type /8 al to enable (or /8 alui for the menu)." -ForegroundColor Green
Write-Host "Future updates install themselves automatically." -ForegroundColor Green
