@echo off
copy /Y _tmp_users_page.tsx "app/(admin)/admin/users/page.tsx"
copy /Y _tmp_verification_page.tsx "app/(admin)/admin/verification/page.tsx"
git add -A
git commit -m "Rebuild: Complete Users and Verification pages with full functionality"
git push origin master
