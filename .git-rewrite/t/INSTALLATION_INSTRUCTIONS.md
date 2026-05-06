# Braidly - Installation Instructions

## ✅ Environment Variables Configured

The `.env.local` file has been created with all required variables. You need to fill in your actual credentials:

```bash
# Copy the template
cp .env.local.example .env.local

# Edit .env.local and add your actual values:
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
# ... etc
```

## 🚀 Installation Steps

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

Or if you encounter peer dependency issues:

```bash
npm install --legacy-peer-deps
```

### Step 2: Verify Installation

Check that all dependencies installed correctly:

```bash
npm list
```

### Step 3: Configure Environment Variables

Edit `.env.local` and add your actual API keys:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Persona
PERSONA_API_KEY=...
NEXT_PUBLIC_PERSONA_TEMPLATE_ID=...

# Checkr
CHECKR_API_KEY=...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@braidly.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Step 5: Build for Production

```bash
npm run build
npm start
```

## 📋 Dependencies Installed

### Core Framework
- next@14.2.0
- react@18.3.1
- react-dom@18.3.1
- typescript@5.3.3

### Styling
- tailwindcss@3.4.1
- autoprefixer@10.4.16
- postcss@8.4.32

### State Management
- zustand@4.4.7

### Forms & Validation
- react-hook-form@7.51.0
- zod@3.22.4
- @hookform/resolvers@3.3.4

### UI Components
- lucide-react@0.408.0
- react-hot-toast@2.4.1
- react-day-picker@8.10.0

### Backend & APIs
- @supabase/supabase-js@2.45.0
- @supabase/auth-helpers-nextjs@0.10.0
- stripe@14.21.0
- @stripe/react-stripe-js@2.7.0
- @stripe/stripe-js@3.0.0

### Maps & Location
- @googlemaps/js-api-loader@1.16.2

### Date & Time
- date-fns@3.3.1

### Charts
- recharts@2.12.0

### External Services
- @persona-kyc/persona@1.0.0
- resend@3.0.0
- twilio@4.10.0

## ✅ Verification Checklist

After installation, verify everything is working:

```bash
# Check TypeScript compilation
npm run type-check

# Build the project
npm run build

# Start dev server
npm run dev
```

## 🔧 Troubleshooting

### Issue: "Module not found" errors

**Solution**: Clear cache and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use

**Solution**: Use a different port
```bash
npm run dev -- -p 3001
```

### Issue: TypeScript errors

**Solution**: Check tsconfig.json and run type check
```bash
npm run type-check
```

### Issue: Tailwind CSS not working

**Solution**: Rebuild Tailwind
```bash
npm run build
```

## 📚 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env.local` with your API keys
3. ✅ Set up Supabase database (see SETUP_GUIDE.md)
4. ✅ Start dev server: `npm run dev`
5. ✅ Test the application
6. ✅ Deploy to Vercel

## 🚀 Ready to Go!

Your Braidly marketplace is now ready for development!

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app in action.

---

**For detailed setup instructions, see SETUP_GUIDE.md**
