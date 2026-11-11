# Stops the server cleanly (world saves) if it was started with start-server.bat / start-server.ps1.
#   powershell -ExecutionPolicy Bypass -File .\stop-server.ps1           clean stop, waits up to 60 s
#   powershell -ExecutionPolicy Bypass -File .\stop-server.ps1 -Force    kills it if the clean stop doesn't work
#                                                                         (may lose the last minute or so of world changes)
param([int]$TimeoutSeconds = 60, [switch]$Force)

$proc = Get-Process bedrock_server -ErrorAction SilentlyContinue
if (-not $proc) { Write-Host 'Server is not running.'; exit 0 }

New-Item -ItemType File -Path (Join-Path $PSScriptRoot 'stop.request') -Force | Out-Null
Write-Host 'Stop requested...'
$proc | Wait-Process -Timeout $TimeoutSeconds -ErrorAction SilentlyContinue
if (-not (Get-Process bedrock_server -ErrorAction SilentlyContinue)) {
  Write-Host 'Server stopped cleanly.'; exit 0
}
Remove-Item (Join-Path $PSScriptRoot 'stop.request') -ErrorAction SilentlyContinue
if ($Force) { $proc | Stop-Process -Force; Write-Host 'Server killed (-Force).'; exit 0 }
Write-Host 'Server did not stop. It was probably started directly (not with start-server.bat). Type "stop" in its window, or rerun with -Force.'
exit 1
