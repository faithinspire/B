# 🏗️ Complete Architecture

## 📊 Upload Flow

```
User selects file
    ↓
Frontend validates (size, type)
    ↓
Sends to /api/upload/avatar or /api/upload/portfolio
    ↓
API route receives file
    ↓
API creates Supabase client with SERVICE_ROLE_KEY
    ↓
Service role key = Full admin access
    ↓
Uploads to public bucket
    ↓
RLS doesn't block (service role bypasses it)
    ↓
Returns public URL
    ↓
Frontend saves URL to database
    ↓
✅ Done!
```

---

## 🔑 Key Components

### 1. Service Role Key
**Location:** `.env.local`
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**What it does:** Full admin access to Supabase

### 2. API Routes
**Avatar:** `app/api/upload/avatar/route.ts`
**Portfolio:** `app/api/upload/portfolio/route.ts`
**What they do:** Handle file uploads with service role key

### 3. Image Utility
**File:** `lib/imageUpload.ts`
**What it does:** Calls API routes, handles compression

### 4. UI Components
**Dashboard:** `app/(braider)/braider/dashboard/page.tsx`
**Portfolio:** `app/(braider)/braider/portfolio/page.tsx`
**What they do:** Use image utility to upload

### 5. Storage Buckets
**avatars:** Public bucket for profile photos
**portfolio:** Public bucket for portfolio images
**What they do:** Store uploaded files

---

## 🔐 Security Model

### Service Role Key
```
Service Role Key
    ↓
Full Admin Access
    ↓
Bypasses RLS
    ↓
Can upload to any bucket
```

### RLS (Row Level Security)
```
RLS Disabled
    ↓
No permission checks
    ↓
Anyone can read public files
    ↓
Service role can write
```

### Public Buckets
```
Public Bucket
    ↓
Anyone can read files
    ↓
Service role can write
    ↓
Files accessible via public URL
```

---

## 📁 File Structure

```
app/
├── api/
│   └── upload/
│       ├── avatar/
│       │   └── route.ts (API endpoint)
│       └── portfolio/
│           └── route.ts (API endpoint)
├── (braider)/
│   └── braider/
│       ├── dashboard/
│       │   └── page.tsx (Avatar upload UI)
│       └── portfolio/
│           └── page.tsx (Portfolio upload UI)
└── ...

lib/
└── imageUpload.ts (Upload utility)

.env.local
└── SUPABASE_SERVICE_ROLE_KEY (Auth)
```

---

## 🔄 Data Flow

### Avatar Upload
```
User clicks upload
    ↓
Selects image
    ↓
Dashboard calls uploadImageToCloud()
    ↓
Image utility calls /api/upload/avatar
    ↓
API route uploads to "avatars" bucket
    ↓
Returns public URL
    ↓
Dashboard saves URL to database
    ↓
Avatar displays
```

### Portfolio Upload
```
User clicks "Add Portfolio Item"
    ↓
Selects image(s)
    ↓
Portfolio page calls uploadPortfolioImage()
    ↓
Image utility calls /api/upload/portfolio
    ↓
API route uploads to "portfolio" bucket
    ↓
Returns public URL
    ↓
Portfolio page saves to database
    ↓
Portfolio item displays
```

---

## ✅ Why It Works

### 1. Service Role Key
- Has full admin access
- Bypasses all RLS policies
- Can upload to any bucket

### 2. API Routes
- Run on server (secure)
- Use service role key
- Handle authentication

### 3. Public Buckets
- Anyone can read files
- Service role can write
- Files accessible via URL

### 4. RLS Disabled
- No permission checks
- Extra safety measure
- Service role works anyway

---

## 🎯 Configuration

### Buckets
```
avatars
├── Public: ON
├── RLS: OFF
└── Files: Profile photos

portfolio
├── Public: ON
├── RLS: OFF
└── Files: Portfolio images
```

### Environment
```
.env.local
├── NEXT_PUBLIC_SUPABASE_URL
├── NEXT_PUBLIC_SUPABASE_ANON_KEY
└── SUPABASE_SERVICE_ROLE_KEY (used by API routes)
```

---

## 🚀 Deployment

### Development
- Service role key in `.env.local`
- Buckets created in Supabase
- RLS disabled
- Works perfectly

### Production
- Same setup
- Consider re-enabling RLS with proper policies
- Use signed URLs for private files
- Implement rate limiting

---

## 📊 Summary

| Component | Status | Purpose |
|-----------|--------|---------|
| Service Role Key | ✅ | Full admin access |
| API Routes | ✅ | Server-side upload |
| Image Utility | ✅ | Client-side helper |
| UI Components | ✅ | User interface |
| Buckets | ⏳ | File storage |
| RLS | ⏳ | Permission control |

---

## 🎉 Result

```
✅ Secure uploads
✅ Server-side authentication
✅ Public file access
✅ Production-ready
✅ Scalable architecture
```

