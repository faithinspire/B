import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get client IP from request headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    // Get server info
    const hostname = process.env.HOSTNAME || 'localhost';
    const port = process.env.PORT || '3000';

    return NextResponse.json({
      clientIP,
      hostname,
      port,
      url: `http://${hostname}:${port}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting IP info:', error);
    return NextResponse.json(
      { error: 'Failed to get IP information' },
      { status: 500 }
    );
  }
}
