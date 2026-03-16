import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and FormData
    let userId, name, category, price, duration_minutes, description
    
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      const body = await request.json()
      // Accept both userId and braider_id
      userId = body.userId || body.braider_id
      name = body.name
      category = body.category
      price = body.price
      duration_minutes = body.duration_minutes
      description = body.description
    } else {
      const formData = await request.formData()
      userId = formData.get('userId') as string || formData.get('braider_id') as string
      name = formData.get('name') as string
      category = formData.get('category') as string
      price = formData.get('price') as string
      duration_minutes = formData.get('duration_minutes') as string
      description = formData.get('description') as string
    }

    if (!userId || !name || !category || !price || !duration_minutes) {
      console.error('Missing fields:', { userId, name, category, price, duration_minutes })
      return NextResponse.json(
        { error: 'Missing required fields: userId/braider_id, name, category, price, duration_minutes' },
        { status: 400 }
      )
    }

    // Use service role client - BYPASSES RLS COMPLETELY
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    // Insert service with service role - BYPASSES RLS
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .insert({
        braider_id: userId,
        name,
        category,
        price: parseFloat(price as string),
        duration_minutes: parseInt(duration_minutes as string),
        description: description || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (serviceError) {
      console.error('Service insert error:', serviceError)
      return NextResponse.json(
        { error: `Failed to add service: ${serviceError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      ...service,
      message: 'Service added successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Add service error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
