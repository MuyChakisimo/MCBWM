# Starts Bedrock Dedicated Server in this window. Type server commands here as usual (e.g. "stop", "op <name>").
# Also watches for a "stop.request" file next to this script: when it appears (stop-server.ps1 creates it),
# the server gets a clean "stop" so the world saves. Lets Claude/Codex stop the server safely.
# Start it by double-clicking start-server.bat.
$ErrorActionPreference = 'Stop'
$serverDir = (Get-ChildItem -Path $PSScriptRoot -Directory -Filter 'bedrock-server-*' | Sort-Object Name | Select-Object -Last 1).FullName
$flag = Join-Path $PSScriptRoot 'stop.request'
Remove-Item $flag -ErrorAction SilentlyContinue
$cmdFile = Join-Path $PSScriptRoot 'command.request'
Remove-Item $cmdFile -ErrorAction SilentlyContinue

if (Get-Process bedrock_server -ErrorAction SilentlyContinue) { Write-Host 'Server is already running.'; exit 1 }

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = Join-Path $serverDir 'bedrock_server.exe'
$psi.WorkingDirectory = $serverDir
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true   # output still prints in this window
$server = [System.Diagnostics.Process]::Start($psi)
$Host.UI.RawUI.WindowTitle = 'Bedrock Server (type commands here)'

$line = ''
while (-not $server.HasExited) {
  # command.request: each line is sent to the server console, then the file is deleted (lets agents run e.g. "op <name>").
  if (Test-Path $cmdFile) {
    $cmds = Get-Content $cmdFile -ErrorAction SilentlyContinue
    Remove-Item $cmdFile -ErrorAction SilentlyContinue
    foreach ($c in $cmds) { if ($c.Trim()) { Write-Host "[start-server] > $c"; $server.StandardInput.WriteLine($c) } }
  }
  if (Test-Path $flag) {
    Remove-Item $flag -ErrorAction SilentlyContinue
    Write-Host '[start-server] stop requested, saving and stopping...'
    $server.StandardInput.WriteLine('stop')
  }
  # Forward what you type to the server, one line at a time.
  while ([Console]::KeyAvailable) {
    $key = [Console]::ReadKey($true)
    if ($key.Key -eq 'Enter') { Write-Host ''; $server.StandardInput.WriteLine($line); $line = '' }
    elseif ($key.Key -eq 'Backspace') { if ($line.Length) { $line = $line.Substring(0, $line.Length - 1); Write-Host -NoNewline "`b `b" } }
    elseif ($key.KeyChar -ne [char]0) { $line += $key.KeyChar; Write-Host -NoNewline $key.KeyChar }
  }
  Start-Sleep -Milliseconds 200
}
Write-Host "[start-server] server exited (code $($server.ExitCode))."
