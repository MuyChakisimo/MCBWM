# Host PC: pull the latest project from GitHub and redeploy.
#   powershell -ExecutionPolicy Bypass -File .\update-server.ps1
# Stops the server cleanly (if running), git pull, deploy.ps1, starts the server again in its own window.
# First run on a folder unzipped from MinecraftServer_for_PC.zip (no .git yet): connects it to the repo
# without touching the server program or the world (they are in .gitignore).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$repo = 'https://github.com/MuyChakisimo/MCBWM.git'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git is not installed. Install Git for Windows first: https://git-scm.com/download/win' }

$wasRunning = [bool](Get-Process bedrock_server -ErrorAction SilentlyContinue)
if ($wasRunning) {
  & powershell -ExecutionPolicy Bypass -File .\stop-server.ps1
  for ($i = 0; $i -lt 60 -and (Get-Process bedrock_server -ErrorAction SilentlyContinue); $i++) { Start-Sleep 1 }
  if (Get-Process bedrock_server -ErrorAction SilentlyContinue) { throw 'Server did not stop. Type "stop" in its window, then run this again.' }
}

if (-not (Test-Path .git)) {
  Write-Host 'First run: connecting this folder to GitHub...'
  git init -q -b main
  git config core.longpaths true
  git remote add origin $repo
  git fetch -q origin main
  git reset -q origin/main          # adopt the repo history, keep the files on disk
  git branch -q --set-upstream-to=origin/main main
}

# Files changed on this PC (e.g. allowlist edited from the console) would block the pull: show them and stop.
$local = git status --porcelain --untracked-files=no
if ($local) {
  Write-Host 'These tracked files were changed on this PC:' -ForegroundColor Yellow
  $local | ForEach-Object { Write-Host "  $_" }
  throw 'Commit/push them from here, or discard them with: git checkout -- <file>. Then run this again.'
}

git pull --ff-only origin main
if ($LASTEXITCODE -ne 0) { throw 'git pull failed (see above).' }
& powershell -ExecutionPolicy Bypass -File .\deploy.ps1
if ($LASTEXITCODE -ne 0) { throw 'deploy.ps1 failed (see above).' }

Start-Process (Join-Path $PSScriptRoot 'start-server.bat') -WorkingDirectory $PSScriptRoot
Write-Host 'Updated and started.' -ForegroundColor Green
