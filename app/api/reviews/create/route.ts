import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { booking_id, reviewer_id, braider_id, rating, comment, photos } = await request.json();

    // Validate required fields
    if (!booking_id || !reviewer_id || !braider_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if booking exists and is completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed bookings' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this booking' },
        { status: 400 }
      );
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        reviewer_id,
        braider_id,
        rating,
        comment: comment || null,
        photos: photos || [],
        is_flagged: false,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review creation error:', reviewError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Update braider rating average
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('braider_id', braider_id)
      .eq('is_flagged', false);

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await supabase
        .from('braider_profiles')
        .update({
          rating_avg: parseFloat(avgRating.toFixed(2)),
          rating_count: allReviews.length,
        })
        .eq('id', braider_id);
    }

    // Create notification for braider
    await supabase
      .from('notifications')
      .insert({
        user_id: braider_id,
        type: 'new_review',
        title: 'New Review',
        body: `You received a ${rating}-star review from a customer`,
        data: {
          review_id: review.id,
          rating,
        },
      });

    return NextResponse.json({
      success: true,
      review: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
