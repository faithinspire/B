# Supabase Storage Setup Guide

## Overview
This guide explains how to set up Supabase Storage for avatars and portfolio images.

## Step 1: Create Storage Buckets

In Supabase Dashboard:

1. Go to **Storage** section
2. Click **Create a new bucket**
3. Create two buckets:

### Bucket 1: Avatars
- **Name**: `avatars`
- **Public**: Yes
- **File size limit**: 5MB

### Bucket 2: Portfolio
- **Name**: `portfolio`
- **Public**: Yes
- **File size limit**: 5MB

## Step 2: Set Up Storage Policies

### For Avatars Bucket

```sql
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
```

### For Portfolio Bucket

```sql
-- Allow braiders to upload portfolio images
CREATE POLICY "Braiders can upload portfolio images"
ON storage.objects FOR INSERT
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
```

## Step 3: Usage in Code

### Upload Avatar

```typescript
import { uploadAvatar } from '@/lib/supabaseStorage';

const handleAvatarUpload = async (file: File) => {
  try {
    const { url, path } = await uploadAvatar(userId, file);
    
    // Update user profile with avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId);
      
    console.log('Avatar uploaded:', url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Upload Portfolio Image

```typescript
import { uploadPortfolioImage } from '@/lib/supabaseStorage';

const handlePortfolioUpload = async (file: File) => {
  try {
    const { url, path } = await uploadPortfolioImage(braiderId, file);
    
    // Add to portfolio in database
    await supabase
      .from('portfolio')
      .insert({
        braider_id: braiderId,
        image_url: url,
        title: 'New Portfolio Item',
        description: 'Description here',
        style: 'box_braids',
      });
      
    console.log('Portfolio image uploaded:', url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Delete Image

```typescript
import { deleteAvatar, deletePortfolioImage } from '@/lib/supabaseStorage';

// Delete avatar
await deleteAvatar('user-id/filename.jpg');

// Delete portfolio image
await deletePortfolioImage('braider-id/filename.jpg');
```

### List User's Images

```typescript
import { listFiles } from '@/lib/supabaseStorage';

// List user's avatars
const avatars = await listFiles('avatars', userId);

// List braider's portfolio
const portfolio = await listFiles('portfolio', braiderId);
```

## Step 4: Image Compression

Images are automatically compressed before upload:

```typescript
import { compressImage, uploadAvatar } from '@/lib/supabaseStorage';

const handleImageUpload = async (file: File) => {
  // Compress image
  const compressedBlob = await compressImage(file, 0.8);
  const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
  
  // Upload compressed image
  const { url } = await uploadAvatar(userId, compressedFile);
};
```

## Step 5: CORS Configuration

In Supabase Dashboard:

1. Go to **Storage** → **Settings**
2. Add CORS configuration:

```json
[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

## Step 6: CDN Configuration

For better performance:

1. Go to **Storage** → **Settings**
2. Enable **CDN** for both buckets
3. Configure cache control:
   - Avatars: 3600 seconds (1 hour)
   - Portfolio: 86400 seconds (24 hours)

## File Structure

Images are organized by user/braider ID:

```
avatars/
├── user-id-1/
│   ├── user-id-1-1234567890.jpg
│   └── user-id-1-1234567891.jpg
└── user-id-2/
    └── user-id-2-1234567892.jpg

portfolio/
├── braider-id-1/
│   ├── braider-id-1-1234567890.jpg
│   ├── braider-id-1-1234567891.jpg
│   └── braider-id-1-1234567892.jpg
└── braider-id-2/
    └── braider-id-2-1234567893.jpg
```

## Troubleshooting

### Images not uploading
- Check bucket exists and is public
- Verify storage policies are set correctly
- Check file size is under 5MB
- Verify user is authenticated

### Images not loading
- Check public URL is correct
- Verify bucket is public
- Check CORS configuration
- Clear browser cache

### Slow image loading
- Enable CDN
- Compress images before upload
- Use appropriate image formats (JPEG for photos)
- Set cache control headers

## Best Practices

1. **Organize by user**: Store images in user/braider folders
2. **Compress images**: Reduce file size before upload
3. **Use CDN**: Enable CDN for faster delivery
4. **Set cache headers**: Configure appropriate cache times
5. **Validate files**: Check file type and size before upload
6. **Handle errors**: Implement proper error handling
7. **Monitor usage**: Track storage usage in dashboard
8. **Clean up**: Delete old/unused images regularly

## Limits

- **File size**: 5MB per file
- **Storage**: Based on Supabase plan
- **Bandwidth**: Based on Supabase plan
- **Requests**: Based on Supabase plan

## Support

For issues:
1. Check Supabase Storage documentation
2. Review browser console for errors
3. Check Supabase dashboard for storage usage
4. Verify authentication is working
5. Test with Supabase CLI: `supabase storage ls`
