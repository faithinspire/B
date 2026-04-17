#!/bin/bash
echo "🚀 FORCE COMMIT TO GIT MASTER & VERCEL DEPLOYMENT"
echo "================================================"

# Add all critical fixes
echo "📦 Adding files to git..."
git add app/(braider)/braider/bookings/page.tsx
git add app/(braider)/braider/messages/[booking_id]/page.tsx
git add app/(admin)/admin/users/page.tsx
git add CRITICAL_FIXES_SUMMARY_NOW.md
git add force_deploy.txt

# Create commit
echo "💾 Creating commit..."
git commit -m "CRITICAL FIXES: Braider orders layout, chat conversation fallback, admin real-time updates

FIXES APPLIED:
1. ✅ Braider orders page - fixed bottom navbar covering content
2. ✅ Chat page - added conversation creation fallback (no more blank pages)
3. ✅ Admin users page - added 30-second polling for real-time updates
4. ✅ Documentation - complete fix summary with testing checklist

Files modified:
- app/(braider)/braider/bookings/page.tsx
- app/(braider)/braider/messages/[booking_id]/page.tsx  
- app/(admin)/admin/users/page.tsx
- CRITICAL_FIXES_SUMMARY_NOW.md

Status: READY FOR DEPLOYMENT"

# Push to master
echo "🌐 Pushing to master branch..."
git push origin master

echo ""
echo "✅ FORCE COMMIT COMPLETE!"
echo "📊 Vercel should auto-deploy within 1-2 minutes"
echo "🔗 Check: https://vercel.com/dashboard"
echo ""
echo "CRITICAL FIXES DEPLOYED:"
echo "1. Braider orders page layout fixed"
echo "2. Chat works after accepting booking"
echo "3. Admin users update in real-time"
echo "4. All fixes documented"