import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';
const PORTFOLIO_BUCKET = 'portfolio';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (5242880 bytes)

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string; path: string }> {
  if (!supabase) throw new Error('Supabase not configured');

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
}

/**
 * Upload portfolio image to Supabase Storage
 */
export async function uploadPortfolioImage(
  braiderId: string,
  file: File
): Promise<{ url: string; path: string }> {
  if (!supabase) throw new Error('Supabase not configured');

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${braiderId}-${Date.now()}.${fileExt}`;
    const filePath = `${braiderId}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from(PORTFOLIO_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Portfolio upload error:', error);
    throw error;
  }
}

/**
 * Delete avatar image from Supabase Storage
 */
export async function deleteAvatar(filePath: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  try {
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Avatar delete error:', error);
    throw error;
  }
}

/**
 * Delete portfolio image from Supabase Storage
 */
export async function deletePortfolioImage(filePath: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  try {
    const { error } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Portfolio delete error:', error);
    throw error;
  }
}

/**
 * Get signed URL for private image access
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    throw error;
  }
}

/**
 * List all files in a bucket folder
 */
export async function listFiles(
  bucket: string,
  folder: string
): Promise<Array<{ name: string; id: string; updated_at: string }>> {
  if (!supabase) throw new Error('Supabase not configured');

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

/**
 * Compress image before upload
 */
export async function compressImage(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions (max 1920x1080)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1920;
        const maxHeight = 1080;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
