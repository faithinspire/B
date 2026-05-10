# 🔴 Password Reset System - Issues Found & Fixes Required

## Issues Identified

### 1. **Recovery Link Not Generated** ❌
**Root Cause**: Supabase's `generateLink()` was failing silently
- The code was trying to use Supabase's built-in recovery link generation
- This requires the user to exist in Supabase Auth
- Users might not be in Supabase Auth yet

**Fix Applied**: ✅ Now generates custom reset tokens
- Creates a random 32-byte token
- Stores token hash in database
- Builds custom reset URL with token

### 2. **Emails Not Being Received** ❌
**Root Cause**: Resend domain not verified
```
Error: The braidme.com domain is not verified. 
Please add and verify your domain on https://resend.com/domains
```

**Fix Required**: 
1. Go to https://resend.com/domains
2. Add domain: `braidme.com`
3. Verify DNS records
4. Once verified, emails will send successfully

### 3. **Database Table Schema Issue** ❌
**Root Cause**: `password_reset_tokens` table has wrong schema
```
Error: Could not find the 'token_hash' column of 'password_reset_tokens'
```

**Fix Required**: Run the SQL migration in Supabase
- File: `FIX_PASSWORD_RESET_TABLE.sql`
- Creates proper table structure
- Disables RLS for the table

---

## What Changed in Code

### Before (Broken)
```typescript
// Tried to use Supabase's generateLink - failed silently
const { data, error: generateError } = await supabase.auth.admin.generateLink({
  type: 'recovery',
  email: normalizedEmail,
});
// Result: No recovery link generated
```

### After (Fixed)
```typescript
// Generate custom token
const token = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

// Store in database
await supabase.from('password_reset_tokens').insert({
  email: normalizedEmail,
  token_hash: tokenHash,
  expires_at: expiresAt,
});

// Build reset link
const resetLink = `${appUrl}/update-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
```

---

## Action Items

### ✅ DONE
- [x] Fixed forgot-password route to generate custom tokens
- [x] Code now generates reset links properly
- [x] Created SQL migration file

### ⏳ TODO - REQUIRED
1. **Run SQL Migration in Supabase**
   - Go to Supabase Dashboard
   - SQL Editor
   - Copy & paste content from `FIX_PASSWORD_RESET_TABLE.sql`
   - Execute

2. **Verify Resend Domain**
   - Go to https://resend.com/domains
   - Add `braidme.com`
   - Follow DNS verification steps
   - Wait for verification (usually instant)

3. **Test Password Reset**
   - Go to http://localhost:3001/login
   - Click "Forgot Password"
   - Enter email
   - Check inbox for email from `noreply@braidme.com`
   - Click reset link
   - Should work!

---

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Code Fix** | ✅ Done | Custom token generation implemented |
| **Database Schema** | ⏳ Pending | Need to run SQL migration |
| **Resend Domain** | ⏳ Pending | Need to verify domain |
| **Email Sending** | ⏳ Pending | Will work after domain verification |

---

## Testing After Fixes

```bash
# 1. Run SQL migration in Supabase
# 2. Verify Resend domain
# 3. Test endpoint
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'

# 4. Check email inbox
# 5. Click reset link
# 6. Set new password
```

---

## Files to Review

- `app/api/auth/forgot-password/route.ts` - Updated with custom token generation
- `FIX_PASSWORD_RESET_TABLE.sql` - SQL migration to create proper table
- `.env.local` - Already has Resend API key configured

---

**Next Step**: Run the SQL migration in Supabase, then verify the Resend domain.
