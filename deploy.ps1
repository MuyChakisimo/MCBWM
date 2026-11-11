# Deploys every pack in .\addons into the server and enables it in the world.
# Run with the server STOPPED:  powershell -ExecutionPolicy Bypass -File .\deploy.ps1
# Works on the laptop and the host PC (paths are relative to this script).
param(
  [string]$ServerDir = (Get-ChildItem -Path $PSScriptRoot -Directory -Filter 'bedrock-server-*' | Sort-Object Name | Select-Object -Last 1).FullName,
  [string]$WorldName = ''   # default: level-name from server.properties (the world the server actually loads)
)
$ErrorActionPreference = 'Stop'

if (Get-Process bedrock_server -ErrorAction SilentlyContinue) { throw 'bedrock_server.exe is running. Type "stop" in its window first.' }
if (-not $ServerDir) { throw 'No bedrock-server-* folder found next to this script.' }
if (-not $WorldName) {
  $line = Select-String -Path (Join-Path $ServerDir 'server.properties') -Pattern '^level-name=(.+)$' | Select-Object -First 1
  $WorldName = if ($line) { $line.Matches[0].Groups[1].Value.Trim() } else { 'Bedrock level' }
}
$world = Join-Path $ServerDir "worlds\$WorldName"
if (-not (Test-Path $world)) { throw "World '$WorldName' not found. Boot the server once to create it." }

$bp = @(); $rp = @()
foreach ($pack in Get-ChildItem (Join-Path $PSScriptRoot 'addons') -Directory) {
  $manifest = Get-Content (Join-Path $pack.FullName 'manifest.json') -Raw | ConvertFrom-Json
  $isBehavior = $manifest.modules.type -contains 'data' -or $manifest.modules.type -contains 'script'
  $target = Join-Path $ServerDir ($(if ($isBehavior) { 'development_behavior_packs' } else { 'development_resource_packs' }))
  $dest = Join-Path $target $pack.Name
  # /MIR keeps the server copy identical to addons\ (deleted files are removed too).
  robocopy $pack.FullName $dest /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed for $($pack.Name)" }
  $entry = [ordered]@{ pack_id = $manifest.header.uuid; version = $manifest.header.version }
  if ($isBehavior) { $bp += $entry } else { $rp += $entry }
  Write-Host ("{0,-8} {1}  v{2}" -f $(if ($isBehavior) { 'behavior' } else { 'resource' }), $pack.Name, ($manifest.header.version -join '.'))
}

# Resource pack order: first in the list = highest priority.
# Written without a BOM (Windows PowerShell's -Encoding utf8 adds one, which BDS may reject).
$utf8 = New-Object System.Text.UTF8Encoding $false
[IO.File]::WriteAllText((Join-Path $world 'world_behavior_packs.json'), (ConvertTo-Json -InputObject @($bp) -Depth 5), $utf8)
[IO.File]::WriteAllText((Join-Path $world 'world_resource_packs.json'), (ConvertTo-Json -InputObject @($rp) -Depth 5), $utf8)
Write-Host "Deployed to $world"
