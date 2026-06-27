# Installs the staged salchyautoicelances mod into the toolbox mods folder.
# The mods folder lives under Program Files, so this must run elevated (Run as administrator).
$ErrorActionPreference = 'Stop'

$dest = 'C:\Program Files (x86)\TeraToolbox Private (Asura Edition)\mods\salchyautoicelances'

Write-Host "Installing salchyautoicelances -> $dest"
New-Item -ItemType Directory -Path $dest -Force | Out-Null

# Copy mod files (everything except this installer and any logs)
Get-ChildItem -Path $PSScriptRoot -File |
    Where-Object { $_.Name -ne 'install.ps1' -and $_.Extension -ne '.log' } |
    ForEach-Object { Copy-Item $_.FullName -Destination $dest -Force }

# Write a result log into the staging dir (user-writable) so the outcome can be reviewed
$log = Join-Path $PSScriptRoot 'install.log'
"[$(Get-Date -Format o)] installed to $dest" | Out-File $log -Encoding utf8
Get-ChildItem $dest | Select-Object Name, Length | Out-File $log -Encoding utf8 -Append

Write-Host "Done. Installed files:" -ForegroundColor Green
Get-ChildItem -Recurse $dest | Select-Object FullName

Write-Host ""
Write-Host "Next: fully restart TERA Toolbox (as admin) and reconnect." -ForegroundColor Cyan
Write-Host "Then on a Sorcerer: /8 al to enable, /8 alui for the GUI." -ForegroundColor Cyan
