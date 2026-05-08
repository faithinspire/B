import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      console.error('Error listing users:', getUserError);
      return NextResponse.json(
        { error: 'Failed to list users' },
        { status: 500 }
      );
    }

    const user = users?.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }

    // Update user metadata to add admin role
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          role: 'admin',
        },
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} is now an admin`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.user_metadata?.role,
      },
    });
  } catch (error) {
    console.error('Make admin endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list all admins
export async function GET() {
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error);
      return NextResponse.json(
        { error: 'Failed to list users' },
        { status: 500 }
      );
    }

    const admins = users?.users.filter(u => u.user_metadata?.role === 'admin') || [];

    return NextResponse.json({
      success: true,
      admins: admins.map(u => ({
        id: u.id,
        email: u.email,
        role: u.user_metadata?.role,
        created_at: u.created_at,
      })),
      total: admins.length,
    });
  } catch (error) {
    console.error('List admins endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
