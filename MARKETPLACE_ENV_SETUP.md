# 🔧 MARKETPLACE ENVIRONMENT SETUP

## Add These to Your `.env.local` File

### 1. **Supabase (Already configured, verify)**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. **Stripe Payment (Required for checkout)**
```env
# Get from https://stripe.com
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 3. **AI Image Generation (Optional but recommended)**

#### Option A: Replicate (Recommended)
```env
# Get from https://replicate.com
REPLICATE_API_TOKEN=your_token_here
```

#### Option B: Hugging Face
```env
# Get from https://huggingface.co
HUGGINGFACE_API_KEY=your_key_here
```

#### Option C: OpenAI DALL-E
```env
# Get from https://openai.com
OPENAI_API_KEY=sk-your_key_here
```

### 4. **Optional: Email Notifications**
```env
# For order notifications
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 5. **Optional: Analytics**
```env
# For tracking and analytics
NEXT_PUBLIC_ANALYTICS_ID=your_id_here
```

---

## 📋 Complete `.env.local` Example

```env
# ============================================================================
# SUPABASE (Required)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# STRIPE (Required for payments)
# ============================================================================
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnop

# ============================================================================
# AI IMAGE GENERATION (Optional - Choose one)
# ============================================================================

# Option A: Replicate (Recommended - Free tier available)
REPLICATE_API_TOKEN=r8_your_token_here

# Option B: Hugging Face (Free tier available)
# HUGGINGFACE_API_KEY=hf_your_key_here

# Option C: OpenAI DALL-E (Paid)
# OPENAI_API_KEY=sk-your_key_here

# ============================================================================
# EMAIL NOTIFICATIONS (Optional)
# ============================================================================
# SENDGRID_API_KEY=SG.your_key_here
# SENDGRID_FROM_EMAIL=noreply@braidme.com

# ============================================================================
# ANALYTICS (Optional)
# ============================================================================
# NEXT_PUBLIC_ANALYTICS_ID=G-your_id_here
```

---

## 🔑 How to Get Each Key

### Supabase Keys
1. Go to https://supabase.com
2. Open your project
3. Settings → API
4. Copy `URL` and `anon key`
5. Settings → Database → Connection pooling
6. Copy `Service role key`

### Stripe Keys
1. Go to https://stripe.com
2. Sign in to dashboard
3. Developers → API keys
4. Copy `Secret key` and `Publishable key`
5. Use `sk_test_` for testing, `sk_live_` for production

### Replicate API Token
1. Go to https://replicate.com
2. Sign in
3. Account → API tokens
4. Create new token
5. Copy token

### Hugging Face API Key
1. Go to https://huggingface.co
2. Sign in
3. Settings → Access Tokens
4. Create new token
5. Copy token

### OpenAI API Key
1. Go to https://openai.com
2. Sign in
3. API keys
4. Create new secret key
5. Copy key

### SendGrid API Key
1. Go to https://sendgrid.com
2. Sign in
3. Settings → API Keys
4. Create new API key
5. Copy key

---

## ✅ Verification

After adding keys, verify they work:

```bash
# Test Supabase
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://YOUR_PROJECT.supabase.co/rest/v1/marketplace_categories?select=*

# Test Stripe
curl https://api.stripe.com/v1/account \
  -u YOUR_SECRET_KEY:

# Test Replicate
curl -H "Authorization: Token YOUR_TOKEN" \
  https://api.replicate.com/v1/account
```

---

## 🚀 Deployment Environment Variables

### For Vercel
1. Go to Vercel dashboard
2. Project → Settings → Environment Variables
3. Add all keys from above
4. Redeploy

### For Netlify
1. Go to Netlify dashboard
2. Site settings → Build & deploy → Environment
3. Add all keys from above
4. Trigger redeploy

### For Docker/Self-hosted
1. Create `.env.production` file
2. Add all production keys
3. Deploy with environment variables

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`**
   - Add to `.gitignore`
   - Use `.env.local.example` for template

2. **Use different keys for dev/prod**
   - Dev: Use `sk_test_` and `pk_test_`
   - Prod: Use `sk_live_` and `pk_live_`

3. **Rotate keys regularly**
   - Change Stripe keys monthly
   - Rotate API tokens quarterly

4. **Restrict key permissions**
   - Use minimal required permissions
   - Create separate keys for different services

5. **Monitor key usage**
   - Check API logs regularly
   - Set up alerts for unusual activity

---

## 🧪 Testing Keys

### Test Stripe Payments
Use these test card numbers:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

### Test Replicate Image Generation
```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "db21e45d3f7023abc9e53f8e04be30e46434305c601fc55aa58eec22b02eeebb",
    "input": {
      "prompt": "a beautiful product photo"
    }
  }'
```

---

## 📝 Template `.env.local.example`

```env
# Copy this file to .env.local and fill in your keys

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI Image Generation (choose one)
REPLICATE_API_TOKEN=
# HUGGINGFACE_API_KEY=
# OPENAI_API_KEY=

# Optional
# SENDGRID_API_KEY=
# SENDGRID_FROM_EMAIL=
# NEXT_PUBLIC_ANALYTICS_ID=
```

---

## 🆘 Troubleshooting

### "API key not found"
- Check `.env.local` exists
- Verify key is not empty
- Restart dev server: `npm run dev`

### "Invalid API key"
- Check key format (should start with `sk_` or `pk_`)
- Verify key is for correct environment (test vs live)
- Check key hasn't expired

### "Unauthorized" errors
- Verify key has correct permissions
- Check key is for correct service
- Regenerate key if needed

### "Connection refused"
- Check internet connection
- Verify API endpoint is correct
- Check firewall/proxy settings

---

## 📊 Environment Variables by Feature

| Feature | Required | Keys Needed |
|---------|----------|------------|
| Marketplace Browse | ✅ | Supabase |
| Add Products | ✅ | Supabase |
| Checkout | ✅ | Supabase + Stripe |
| AI Images | ❌ | Replicate/HF/OpenAI |
| Email Notifications | ❌ | SendGrid |
| Analytics | ❌ | Analytics service |

---

## 🎯 Quick Setup (5 minutes)

1. Copy `.env.local.example` to `.env.local`
2. Add Supabase keys (required)
3. Add Stripe keys (required for payments)
4. Add AI key (optional)
5. Restart dev server
6. Test marketplace

---

**All set! Your marketplace is ready to go!** 🚀
