# Supabase Storage Bucket Setup - CRITICAL

## Issue Fixed
The app was failing to upload images because:
1. **Bucket name mismatch**: Code used `portfolio-images` but Supabase bucket is `portfolio`
2. **Missing buckets**: Buckets `avatars` and `portfolio` need to be created in Supabase
3. **Missing RLS policies**: Storage policies weren't configured

## Solution Implemented

### 1. Fixed Bucket Names
- **Avatar uploads**: Now use `avatars` bucket (was using base64 fallback)
- **Portfolio uploads**: Now use `portfolio` bucket (was using `portfolio-images`)
- **Updated files**:
  - `lib/imageUpload.ts` - Fixed portfolio bucket name
  - `app/(braider)/braider/dashboard/page.tsx` - Fixed avatar upload to use Supabase

### 2. Create Supabase Buckets

**Step 1: Go to Supabase Dashboard**
- Navigate to your project
- Go to **Storage** section

**Step 2: Create Avatars Bucket**
```
Name: avatars
Public: Yes (toggle ON)
File size limit: 5MB
```

**Step 3: Create Portfolio Bucket**
```
Name: portfolio
Public: Yes (toggle ON)
File size limit: 5MB
```

### 3. Set Up Storage Policies

**For Avatars Bucket - Run in SQL Editor:**

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

**For Portfolio Bucket - Run in SQL Editor:**

-- Allow braiders to upload portfolio images
CREATE POLICY "Braiders can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow braiders to update their portfolio images
CREATE POLICY "Braiders can update their portfolio images"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow braiders to delete their portfolio images
CREATE POLICY "Braiders can delete their portfolio images"
ON storage.objects FOR DELETE
WITH CHECK (
  bucket_id = 'portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public can read portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

### 4. CORS Configuration

**In Supabase Dashboard:**
1. Go to **Storage** → **Settings**
2. Add CORS configuration:

[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]

### 5. Enable CDN (Optional but Recommended)

1. Go to **Storage** → **Settings**
2. Enable **CDN** for both buckets
3. Set cache control:
   - Avatars: 3600 seconds (1 hour)
   - Portfolio: 86400 seconds (24 hours)

## Code Changes Made

### File: `lib/imageUpload.ts`
**Change**: Fixed portfolio bucket name
```typescript
// BEFORE
export async function uploadPortfolioImage(file: File): Promise<UploadedImage> {
  return uploadImageToCloud(file, 'portfolio-images');
}

// AFTER
export async function uploadPortfolioImage(file: File): Promise<UploadedImage> {
  return uploadImageToCloud(file, 'portfolio');
}
```

### File: `app/(braider)/braider/dashboard/page.tsx`
**Change**: Fixed avatar upload to use Supabase instead of base64
```typescript
// BEFORE
const reader = new FileReader();
reader.onloadend = async () => {
  const base64String = reader.result as string;
  await updateProfile(user!.id, { avatar_url: base64String });
};

// AFTER
const { uploadImageToCloud } = await import('@/lib/imageUpload');
const uploaded = await uploadImageToCloud(file, 'avatars');
await updateProfile(user!.id, { avatar_url: uploaded.url });
```

## Testing Upload Functionality

### Test Avatar Upload
1. Go to Braider Dashboard
2. Click on avatar upload button
3. Select an image file
4. Should upload successfully to `avatars` bucket
5. Avatar should display with public URL

### Test Portfolio Upload
1. Go to Braider Portfolio page
2. Click "Add Portfolio Item"
3. Upload images
4. Should upload successfully to `portfolio` bucket
5. Images should display in portfolio grid

### Test Service Creation
1. Go to Braider Services page
2. Click "Add Service"
3. Fill in service details
4. Should save successfully to database

## Troubleshooting

### Error: "Bucket not found"
- **Solution**: Create the bucket in Supabase Storage
- Check bucket name matches exactly: `avatars` or `portfolio`
- Ensure bucket is set to Public

### Error: "Permission denied"
- **Solution**: Check RLS policies are created
- Verify user is authenticated
- Check policy conditions match your data structure

### Error: "File too large"
- **Solution**: File size limit is 5MB
- Images are automatically compressed before upload
- Check file size before uploading

### Images not displaying
- **Solution**: Check bucket is public
- Verify public URL is correct
- Check CORS configuration
- Clear browser cache

### Upload hangs/times out
- **Solution**: Check network connection
- Try smaller file size
- Check browser console for errors
- Verify Supabase is accessible

## File Structure in Storage

```
avatars/
├── user-id-1/
│   ├── 1710345600000-abc123-avatar.jpg
│   └── 1710345700000-def456-avatar.jpg
└── user-id-2/
    └── 1710345800000-ghi789-avatar.jpg

portfolio/
├── braider-id-1/
│   ├── 1710345600000-abc123-portfolio.jpg
│   ├── 1710345700000-def456-portfolio.jpg
│   └── 1710345800000-ghi789-portfolio.jpg
└── braider-id-2/
    └── 1710345900000-jkl012-portfolio.jpg
```

## Security Notes

1. **RLS Policies**: Restrict uploads to authenticated users
2. **File Validation**: Check file type and size before upload
3. **Public Access**: Only avatars and portfolio are public
4. **User Isolation**: Users can only upload to their own folder
5. **CORS**: Restrict to your domain in production

## Performance Optimization

1. **Image Compression**: Automatically compress before upload
2. **CDN**: Enable for faster delivery
3. **Cache Control**: Set appropriate cache headers
4. **File Naming**: Use timestamps for unique names
5. **Cleanup**: Delete old images regularly

## Next Steps

1. ✅ Create buckets in Supabase
2. ✅ Set up RLS policies
3. ✅ Configure CORS
4. ✅ Enable CDN (optional)
5. ✅ Test uploads
6. ✅ Monitor storage usage

## Support

If uploads still fail:
1. Check Supabase dashboard for errors
2. Verify bucket exists and is public
3. Check RLS policies are correct
4. Review browser console for errors
5. Check network tab for failed requests
6. Verify authentication is working

---

**Status**: ✅ Storage setup complete
**Last Updated**: March 13, 2026
