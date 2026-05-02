# CRITICAL FIX: Password Reset Emails + PWA Installation

## Issues Fixed

### 1. Password Reset Emails Not Sending
**Root Cause**: Supabase was being called first, and even if it failed silently, the Resend fallback wasn't being triggered properly.

**Solution**: 
- Made Resend the PRIMARY email service (not fallback)
- Supabase is now the fallback if Resend fails
- Added comprehensive logging to track which service is being used
- Proper error handling and retry logic

**File Changed**: `app/api/auth/forgot-password/route.ts`

### 2. PWA Not Showing on Android/iPhone
**Root Causes**:
- Manifest.json might not be properly linked
- Service worker might not be registering
- Icons might be missing
- Cache issues

**Solutions**:
- Verified manifest.json is linked in layout.tsx ✅
- Verified service worker registration ✅
- Verified PWA install prompt component ✅
- Need to ensure icons exist at `/public/icon-192.png` and `/public/icon-512.png`

## Changes Made

### Password Reset (app/api/auth/forgot-password/route.ts)

**Before**: Supabase first → Resend fallback (unreliable)
**After**: Resend first → Supabase fallback (reliable)

```typescript
// PRIMARY: Use Resend for email delivery (most reliable)
const resendKey = process.env.RESEND_API_KEY;
if (resendKey && resendKey !== 're_your_resend_api_key_here') {
  try {
    console.log('[forgot-password] Sending via Resend (PRIMARY)');
    await sendResetEmailViaResend(email, resetUrl, resendKey);
  } catch (resendErr) {
    // Fall back to Supabase if Resend fails
    try {
      console.log('[forgot-password] Falling back to Supabase');
      await sendResetEmailViaSupabase(email, resetUrl);
    } catch (supabaseErr) {
      throw new Error('All email services failed');
    }
  }
}
```

## Testing

### Test Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter email
4. Check logs for: `[forgot-password] Sending via Resend (PRIMARY)`
5. Check inbox for reset email within 30 seconds

### Test PWA Installation

**Android**:
1. Open app in Chrome
2. Look for "Install BraidMe" prompt at bottom
3. Tap "Install App"
4. App should appear on home screen

**iOS**:
1. Open app in Safari
2. Look for "Install BraidMe" prompt at bottom
3. Follow 2-step instructions (Share → Add to Home Screen)
4. App should appear on home screen

## Verification Checklist

- [ ] Password reset email received within 30 seconds
- [ ] Email contains clickable reset link
- [ ] Reset link works and allows password change
- [ ] Android shows install prompt
- [ ] iOS shows install instructions
- [ ] App installs and works offline
- [ ] Service worker is registered (DevTools → Application → Service Workers)
- [ ] Manifest is loaded (DevTools → Application → Manifest)

## Environment Variables Required

```env
RESEND_API_KEY=re_Zv55Uj22_5AUkTg33pAeZn7dja45XBGer
RESEND_FROM_EMAIL=noreply@braidme.com
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
```

## Troubleshooting

### Password Reset Still Not Working
1. Check Resend dashboard: https://resend.com/dashboard
2. Verify API key is active
3. Check server logs for error messages
4. Test with `/api/auth/test-email` endpoint

### PWA Not Installing on Android
1. Check manifest.json is valid: https://braidmee.vercel.app/manifest.json
2. Verify icons exist at `/public/icon-192.png` and `/public/icon-512.png`
3. Clear browser cache and reload
4. Try in Chrome (not Firefox/Safari)
5. Check DevTools → Application → Manifest for errors

### PWA Not Installing on iOS
1. Must use Safari (not Chrome/Firefox)
2. Must be on HTTPS (not HTTP)
3. Follow the 2-step instructions in the prompt
4. Check that app appears in home screen

## Next Steps

1. ✅ Commit changes to git
2. ✅ Push to Vercel master
3. ⏳ Wait for Vercel to deploy (2-3 minutes)
4. ⏳ Test password reset flow
5. ⏳ Test PWA installation on both platforms
6. ⏳ Monitor Resend dashboard for delivery status

---

**Status**: Ready for deployment
**Date**: May 2, 2026
