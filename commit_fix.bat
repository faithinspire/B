@echo off
cd /d "%~dp0"
git add -A
git commit -m "Fix: Disable static generation on homepage to force dynamic rendering"
git push origin master
pause
