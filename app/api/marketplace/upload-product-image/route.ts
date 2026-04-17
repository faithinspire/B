import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated - missing authorization header' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key for uploads
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // First verify the token with anon key
    const anonSupabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await anonSupabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth verification error:', userError);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Now use service role for upload
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `marketplace/${timestamp}-${random}.${ext}`;

    // Upload file to storage
    const { data, error: uploadError } = await supabase.storage
      .from('braider-uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('braider-uploads')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: publicUrl,
        fileName: fileName,
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
