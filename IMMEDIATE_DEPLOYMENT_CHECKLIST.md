# Immediate Deployment Checklist

## Pre-Deployment (5 minutes)

- [ ] **Backup Database**
  ```
  Supabase Dashboard → Settings → Backups → Create backup
  ```

- [ ] **Review Changes**
  ```bash
  git diff HEAD~1
  ```

## Deployment (5 minutes)

- [ ] **Fix Existing Data**
  ```bash
  npx ts-node scripts/fix-data-consistency.ts
  ```

- [ ] **Commit Changes**
  ```bash
  git add -A
  git commit -m "fix: critical system fixes - role misclassification, data consistency, API failures"
  ```

- [ ] **Push to Master**
  ```bash
  git push origin master
  ```

## Post-Deployment (10 minutes)

- [ ] **Wait for Deployment**
  - Vercel will automatically deploy
  - Check deployment status in Vercel dashboard

- [ ] **Run Tests**
  ```bash
  npx ts-node scripts/test-system-fixes.ts
  ```

- [ ] **Manual Testing**
  1. Test braider signup
  2. Check dashboard stats
  3. Verify braiders page
  4. Check verification page

- [ ] **Run Audit**
  ```bash
  curl -X GET https://your-domain.com/api/admin/audit/data-consistency \
    -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
  ```

## Verification Checklist

- [ ] ✅ Braiders appear in braiders page
- [ ] ✅ Users count updates after signup
- [ ] ✅ Dashboard stats are accurate
- [ ] ✅ Verification page loads
- [ ] ✅ Role separation works
- [ ] ✅ No data mismatches
- [ ] ✅ All APIs respond correctly
- [ ] ✅ Signup is atomic

## If Issues Occur

### Quick Rollback
```bash
git revert HEAD
git push origin master
```

### Run Auto-Fix
```bash
curl -X POST https://your-domain.com/api/admin/audit/auto-fix \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Restore Database
```
Supabase Dashboard → Settings → Backups → Restore backup
```

## Files Modified

1. ✅ `app/api/auth/signup/route.ts`
2. ✅ `app/api/admin/dashboard/stats/route.ts`
3. ✅ `app/api/braiders/route.ts`
4. ✅ `app/api/auth/verify-role/route.ts`
5. ✅ `app/api/admin/verification/route.ts`
6. ✅ `app/api/admin/audit/data-consistency/route.ts`
7. ✅ `app/api/admin/audit/auto-fix/route.ts`

## Files Created

1. ✅ `scripts/fix-data-consistency.ts`
2. ✅ `scripts/test-system-fixes.ts`
3. ✅ `DEPLOYMENT_GUIDE_CRITICAL_FIXES.md`
4. ✅ `CRITICAL_FIXES_SUMMARY.md`
5. ✅ `IMMEDIATE_DEPLOYMENT_CHECKLIST.md`

## Success Criteria

After deployment, all of these should be true:

- [ ] Signup creates braider_profiles record
- [ ] Stats API queries braider_profiles table
- [ ] Braiders API only returns verified braiders
- [ ] Verification page loads without error
- [ ] Role is correctly assigned during signup
- [ ] No data inconsistencies detected
- [ ] All tests pass
- [ ] No errors in logs

## Estimated Time

- Pre-Deployment: 5 minutes
- Deployment: 5 minutes
- Post-Deployment: 10 minutes
- **Total: 20 minutes**

## Support

If you need help:
1. Check `DEPLOYMENT_GUIDE_CRITICAL_FIXES.md` for detailed instructions
2. Check `CRITICAL_FIXES_SUMMARY.md` for what was fixed
3. Run audit endpoint to identify issues
4. Use auto-fix endpoint to repair issues

---

**Ready to deploy?** Follow the checklist above in order.
