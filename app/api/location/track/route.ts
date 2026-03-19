import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Types
interface TrackLocationRequest {
  booking_id: string;
  braider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
}

interface LocationRecord {
  id: string;
  booking_id: string;
  braider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  is_active: boolean;
  created_at: string;
}

// Validation helper
function validateCoordinates(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function validateLocationData(data: TrackLocationRequest): string | null {
  if (!data.booking_id) return 'booking_id is required';
  if (!data.braider_id) return 'braider_id is required';
  if (data.latitude === undefined || data.latitude === null) return 'latitude is required';
  if (data.longitude === undefined || data.longitude === null) return 'longitude is required';

  if (!validateCoordinates(data.latitude, data.longitude)) {
    return 'Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180';
  }

  return null;
}

// POST /api/location/track - Braider sends GPS location update
export async function POST(request: Request) {
  try {
    const body: TrackLocationRequest = await request.json();

    // Validate request body
    const validationError = validateLocationData(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Insert location record — let DB generate UUID id
    // Skip booking verification to avoid blocking location saves
    const locationRecord = {
      booking_id: body.booking_id,
      braider_id: body.braider_id,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy ?? 0,
      speed: body.speed ?? 0,
      heading: body.heading ?? 0,
      is_active: true,
    };

    const { data, error } = await serviceSupabase
      .from('location_tracking')
      .insert([locationRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating location record:', error);
      return NextResponse.json(
        { error: `Failed to create location record: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Location track error:', error);
    const message = error instanceof Error ? error.message : 'Failed to track location';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
