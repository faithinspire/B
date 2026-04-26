import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { file, media_type, braider_id } = body;

    if (!file || !media_type || !braider_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Convert base64 to buffer
    const base64Data = file.split(',')[1] || file;
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = media_type === 'video' ? 'mp4' : 'jpg';
    const filename = `${braider_id}/${timestamp}-${random}.${ext}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('braider-status')
      .upload(filename, buffer, {
        contentType: media_type === 'video' ? 'video/mp4' : 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 400 }
      );
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('braider-status')
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error('Status upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
