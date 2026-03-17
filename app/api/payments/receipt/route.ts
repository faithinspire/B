import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    const bookingId = searchParams.get('bookingId');

    if (!paymentIntentId && !bookingId) {
      return NextResponse.json(
        { error: 'Missing required parameters: paymentIntentId or bookingId' },
        { status: 400 }
      );
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get booking details
    let booking;
    if (bookingId) {
      const { data } = await serviceSupabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      booking = data;
    }

    // Get payment intent from Stripe
    let paymentIntent;
    if (paymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } else if (booking?.payment_intent_id) {
      paymentIntent = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
    }

    if (!paymentIntent) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML({
      paymentIntent,
      booking,
      bookingId: bookingId || booking?.id,
    });

    // Return as PDF or HTML
    const format = searchParams.get('format') || 'html';

    if (format === 'pdf') {
      // For PDF, we'll return HTML and let the client handle PDF generation
      return new NextResponse(receiptHTML, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': 'attachment; filename="receipt.html"',
        },
      });
    }

    return new NextResponse(receiptHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateReceiptHTML(data: any) {
  const { paymentIntent, booking, bookingId } = data;
  const amount = (paymentIntent.amount / 100).toFixed(2);
  const date = new Date(paymentIntent.created * 1000).toLocaleDateString();
  const time = new Date(paymentIntent.created * 1000).toLocaleTimeString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    .section-content {
      font-size: 14px;
      line-height: 1.8;
      color: #333;
    }
    .section-content p {
      margin-bottom: 8px;
    }
    .section-content strong {
      color: #000;
    }
    .divider {
      height: 1px;
      background: #eee;
      margin: 30px 0;
    }
    .amount-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .amount-row.total {
      border-top: 2px solid #ddd;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 600;
      color: #667eea;
    }
    .status {
      display: inline-block;
      padding: 8px 16px;
      background: #10b981;
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .footer {
      background: #f9f9f9;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
    }
    .footer p {
      margin-bottom: 8px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Receipt</h1>
      <p>Transaction Confirmed</p>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">Payment Status</div>
        <div class="section-content">
          <span class="status">✓ Completed</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="section-content">
          <p><strong>Transaction ID:</strong> ${paymentIntent.id}</p>
          <p><strong>Booking ID:</strong> ${bookingId || 'N/A'}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Payment Method:</strong> ${paymentIntent.payment_method_types?.[0]?.toUpperCase() || 'Card'}</p>
        </div>
      </div>

      ${booking ? `
      <div class="section">
        <div class="section-title">Service Details</div>
        <div class="section-content">
          <p><strong>Service:</strong> ${booking.service_name || 'Braiding Service'}</p>
          <p><strong>Braider:</strong> ${booking.braider_name || 'Professional Braider'}</p>
          <p><strong>Date:</strong> ${booking.appointment_date || 'N/A'}</p>
          <p><strong>Location:</strong> ${booking.location_address || 'N/A'}</p>
        </div>
      </div>
      ` : ''}

      <div class="amount-section">
        <div class="amount-row">
          <span>Subtotal:</span>
          <span>$${amount}</span>
        </div>
        <div class="amount-row total">
          <span>Total Paid:</span>
          <span>$${amount}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">Important Information</div>
        <div class="section-content">
          <p>• This receipt confirms your payment has been successfully processed.</p>
          <p>• Your booking is now confirmed and the braider has been notified.</p>
          <p>• You can track your booking status in your account dashboard.</p>
          <p>• For any issues, please contact our support team.</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for using Braidly!</p>
      <p>© ${new Date().getFullYear()} Braidly. All rights reserved.</p>
      <p>This is an automated receipt. Please keep it for your records.</p>
    </div>
  </div>

  <script>
    // Auto-print on load (optional)
    // window.print();
    
    // Download as PDF function
    function downloadPDF() {
      const element = document.querySelector('.container');
      const opt = {
        margin: 10,
        filename: 'receipt.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      html2pdf().set(opt).save();
    }
  </script>
</body>
</html>
  `;
}
