@echo off
cd /d "%~dp0"
git add -A
git commit -m "Cleanup: Remove temporary batch script and add fix documentation"
git push origin master
pause
