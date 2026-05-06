import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Don't use middleware for auth - let client handle it with Supabase
  // Middleware was using old cookie-based auth which conflicts with Supabase
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
