@echo off
cd /d "%~dp0"
git add app/(public)/page.tsx
git commit -m "Simplify homepage - remove dynamic config, keep marketplace visible

- Removed problematic export const dynamic and revalidate
- Marketplace carousel is hardcoded on homepage
- Will display regardless of caching
- Marketplace is now permanently on homepage"
git push origin master
echo.
echo ===================================================
echo IMPORTANT: Manual Vercel Deployment Required
echo ===================================================
echo.
echo The code is now on GitHub. You must manually trigger
echo deployment on Vercel:
echo.
echo 1. Go to: https://vercel.com/dashboard
echo 2. Click on your project
echo 3. Click "Deployments" tab
echo 4. Click "Redeploy" on the latest commit
echo.
echo OR use Vercel CLI:
echo   vercel --prod
echo.
pause
