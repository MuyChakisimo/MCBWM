@echo off
rem WaterdogPE proxy for playit.gg (Bedrock NetherNet tunnel). Needs Java 17+ and Waterdog.jar in this folder.
rem Start order: start-server.bat first, then this, and keep playit running.
cd /d "%~dp0"
if not exist Waterdog.jar (
  echo Waterdog.jar is missing. Download it from https://github.com/WaterdogPE/WaterdogPE/releases into this folder.
  pause
  exit /b 1
)
java -Xms256M -Xmx1G -jar Waterdog.jar
pause
