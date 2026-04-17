import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Use service role client - BYPASSES RLS COMPLETELY
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const filePath = `${userId}/${fileName}`
    const buffer = await file.arrayBuffer()

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === 'portfolio')) {
      await supabase.storage.createBucket('portfolio', { public: true, fileSizeLimit: 10485760 });
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(filePath, buffer, {
        cacheControl: '0',
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 400 })
    }

    // Get public URL
    const { data: publicData } = supabase.storage.from('portfolio').getPublicUrl(filePath)
    const imageUrl = publicData.publicUrl

    // Insert portfolio item with service role - BYPASSES RLS
    const { data: portfolioItem, error: portfolioError } = await supabase
      .from('portfolio')
      .insert({
        braider_id: userId,
        title: title || 'Portfolio Item',
        description: description || '',
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (portfolioError) {
      console.error('Portfolio insert error:', portfolioError)
      return NextResponse.json({ error: `Failed to save portfolio item: ${portfolioError.message}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ...portfolioItem,
      message: 'Portfolio item uploaded successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Portfolio upload error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
