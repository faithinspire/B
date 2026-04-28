import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Supabase auth callback handler.
 * Supabase redirects here after the user clicks the password-reset email link.
 * The URL contains a `code` query param (PKCE flow) or a hash fragment with
 * access_token (implicit flow). We exchange the code for a session, then
 * redirect the user to the `next` page (default: /reset-password).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/reset-password';

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the reset-password page — the session cookie is now set
      // so supabase.auth.updateUser({ password }) will work client-side.
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('Auth callback exchange error:', error.message);
  }

  // Something went wrong — send back to forgot-password with an error hint
  return NextResponse.redirect(`${origin}/forgot-password?error=link_expired`);
}
