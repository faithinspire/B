/**
 * Image Upload Utility
 * Handles image uploads with compression and validation
 * Uses Supabase Storage for cloud storage
 */

import { supabase } from '@/lib/supabase';

export interface UploadedImage {
  url: string;
  name: string;
  size: number;
  type: string;
}

// Removed file size limit - allow unlimited uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF' };
  }

  return { valid: true };
}

/**
 * Compress image using Canvas API
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

        // Calculate new dimensions (max 2000px)
        let width = img.width;
        let height = img.height;
        const maxDim = 2000;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
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
          file.type,
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

/**
 * Upload image to Supabase Storage via API route
 * Uses server-side authentication to bypass RLS issues
 */
export async function uploadImageToCloud(file: File, bucket: string = 'avatars'): Promise<UploadedImage> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Compress image for optimization
    const compressedBlob = await compressImage(file, 0.85);
    
    // Determine API endpoint based on bucket
    const endpoint = bucket === 'avatars' ? '/api/upload/avatar' : '/api/upload/portfolio';

    // Create form data
    const formData = new FormData();
    formData.append('file', compressedBlob, file.name);

    // Upload via API route (server-side authentication)
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return {
      url: result.url,
      name: result.name,
      size: result.size,
      type: result.type,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    throw new Error(message);
  }
}

/**
 * Upload portfolio image to Supabase Storage
 * Supports multiple images per portfolio
 */
export async function uploadPortfolioImage(file: File): Promise<UploadedImage> {
  return uploadImageToCloud(file, 'portfolio');
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImageFromCloud(imageUrl: string, bucket: string = 'braider-avatars'): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      throw new Error('Invalid image URL');
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filename]);

    if (error) {
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete image';
    throw new Error(message);
  }
}

/**
 * Convert file to base64 data URL
 * Used for fallback storage
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(file: File, size: number = 200): Promise<string> {
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

        canvas.width = size;
        canvas.height = size;

        // Center crop
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
