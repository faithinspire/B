# ⚡ QUICK ACTION CARD - PASSWORD RESET & MARKETPLACE FIX

## 🎯 WHAT TO DO RIGHT NOW

### 1️⃣ RUN SQL (5 minutes)
```
File: CORRECTED_MARKETPLACE_EMAIL_FIX.sql
Location: Supabase → SQL Editor → New Query → Paste & Run
```

### 2️⃣ CHECK ENV VARIABLES (2 minutes)
```env
RESEND_API_KEY=re_your_key_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com (or http://localhost:3000)
```

### 3️⃣ CREATE PAGES (5 minutes)
- `app/(public)/auth/forgot-password/page.tsx` ← Copy from guide
- `app/(public)/auth/reset-password/page.tsx` ← Copy from guide

### 4️⃣ UPDATE LOGIN PAGE (2 minutes)
Add link: `<Link href="/auth/forgot-password">Forgot Password?</Link>`

### 5️⃣ TEST (5 minutes)
- Request password reset
- Check email
- Click link
- Reset password
- Log in with new password

---

## ✅ WHAT'S ALREADY DONE

- ✅ API endpoints created and secured
- ✅ Rate limiting implemented
- ✅ Token security configured
- ✅ Email logging enabled
- ✅ Marketplace products API working
- ✅ SQL schema corrected

---

## 🔑 KEY FILES

| File | Purpose |
|------|---------|
| `CORRECTED_MARKETPLACE_EMAIL_FIX.sql` | Database setup |
| `app/api/auth/password-reset/request/route.ts` | Request endpoint |
| `app/api/auth/password-reset/verify/route.ts` | Verify endpoint |
| `IMMEDIATE_ACTIONS_MARKETPLACE_EMAIL.md` | Full guide |

---

## 🚀 DEPLOYMENT ORDER

1. Run SQL migration
2. Set environment variables
3. Create frontend pages
4. Update login page
5. Test locally
6. Commit to git
7. Deploy to production
8. Test in production

---

## 📊 VERIFICATION QUERIES

```sql
-- Check marketplace products
SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active 
FROM marketplace_products;

-- Check password reset tokens
SELECT COUNT(*) as total, COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid 
FROM password_reset_tokens;

-- Check email logs
SELECT status, COUNT(*) FROM email_logs GROUP BY status;
```

---

## 🔒 SECURITY FEATURES

✅ Rate limiting (5/hour)  
✅ Cryptographic tokens (32 bytes)  
✅ SHA-256 hashing  
✅ 1-hour expiration  
✅ One-time use  
✅ Password strength validation  
✅ No email enumeration  
✅ Email logging  

---

## ⏱️ TOTAL TIME: ~20 minutes

**Status:** ✅ READY TO DEPLOY
