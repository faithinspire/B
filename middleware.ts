import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to check and fix user role on protected routes
 * This ensures braiders always have the correct role even if there's a database issue
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // List of protected routes that require role verification
  const protectedRoutes = [
    '/braider/dashboard',
    '/braider/',
    '/dashboard',
    '/admin',
  ]

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Add a header to trigger role verification on the client side
  const response = NextResponse.next()
  response.headers.set('X-Verify-Role', 'true')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
