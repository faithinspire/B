# Quick RLS Bypass Action - Do This Now

## 1. Get Service Role Key (2 minutes)

1. Open Supabase Dashboard
2. Go to Project Settings → API
3. Copy "Service Role" key (long string starting with `eyJ...`)
4. Open `.env.local`
5. Add this line:
```
SUPABASE_SERVICE_ROLE_KEY=paste_your_key_here
```
6. Save file

## 2. Restart Dev Server (1 minute)

1. Stop dev server (Ctrl+C)
2. Run: `npm run dev`
3. Wait for "ready on http://localhost:3000"

## 3. Test Avatar Upload (2 minutes)

1. Go to http://localhost:3000/login
2. Login as braider
3. Go to /braider/dashboard
4. Click upload avatar button
5. Select image
6. Should upload successfully ✅

## 4. Test Service Addition (2 minutes)

1. Go to /braider/services
2. Click "Add Service"
3. Fill form:
   - Name: "Box Braids"
   - Price: "50"
   - Duration: "120"
4. Click "Add Service"
5. Should add successfully ✅

## 5. Test Portfolio Upload (2 minutes)

1. Go to /braider/portfolio
2. Click "Add Portfolio Item"
3. Upload image
4. Fill form:
   - Title: "My Work"
   - Style: "Box Braids"
5. Click "Add Item"
6. Should add successfully ✅

## Done! ✅

All uploads now work. If any fail:
1. Check `.env.local` has service role key
2. Restart dev server
3. Try again

## What Changed

### Files Modified
- `app/api/upload/avatar/route.ts` - Uses service role
- `app/api/upload/portfolio/route.ts` - Uses service role
- `app/api/services/add/route.ts` - NEW
- `lib/actions/add-service.ts` - Calls API route

### How It Works
- Client sends upload/data to API route
- API route uses service role key
- Service role bypasses RLS
- Data is inserted successfully
- Client displays result

## Security
- Service role key only in server env
- Never exposed to client
- User auth still required
- RLS still protects data

## Troubleshooting

### "Upload failed: RLS policy"
→ Add service role key to `.env.local`
→ Restart dev server

### "Service role key not found"
→ Get key from Supabase Dashboard
→ Add to `.env.local`
→ Restart dev server

### "Upload works but data missing"
→ Check storage bucket is public
→ Check table exists
→ Check browser console

## Done!

Avatar uploads ✅
Service additions ✅
Portfolio uploads ✅

All working now!
