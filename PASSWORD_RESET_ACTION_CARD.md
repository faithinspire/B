# ⚡ Password Reset System - Quick Action Card

## Current Status
✅ Code deployed to master (Vercel deploying now)
⏳ Waiting for: SQL migration + Resend domain verification

---

## 🎯 DO THIS NOW (10 minutes total)

### Action 1: Run SQL in Supabase (5 min)
1. Go to: https://app.supabase.com/
2. Select project → SQL Editor → New Query
3. Paste this:
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
```
4. Click **Run**
5. ✅ Done!

### Action 2: Verify Resend Domain (5 min)
1. Go to: https://resend.com/domains
2. Click **Add Domain**
3. Enter: `braidme.com`
4. Add DNS records to your registrar
5. Wait for verification ✅

---

## 🧪 Then Test It

1. Go to: http://localhost:3001/login
2. Click "Forgot Password"
3. Enter your email
4. Check inbox for email from `noreply@braidme.com`
5. Click reset link
6. Set new password
7. ✅ Done!

---

## 📊 What's Working Now

| Component | Status |
|-----------|--------|
| Code | ✅ Deployed |
| Token Generation | ✅ Working |
| Email Template | ✅ Ready |
| Database Schema | ⏳ Needs SQL |
| Email Sending | ⏳ Needs domain |

---

## 🔗 Links

- Supabase: https://app.supabase.com/
- Resend: https://resend.com/domains
- App: http://localhost:3001/login

---

**Time to complete**: ~10 minutes
**Difficulty**: Easy (copy-paste)

