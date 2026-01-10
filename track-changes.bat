@echo off
echo Tracking changes and adding to git...
git add -A
git status
echo.
echo Changes have been staged for commit.
echo To commit with message: git commit -m "Your message here"
echo To push to GitHub: git push origin main
echo.
pause
