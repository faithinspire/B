import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Build conversation context (for future use with external AI APIs)
    // const conversationContext = conversationHistory
    //   .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    //   .join('\n');

    // Use a simple AI response generator (can be replaced with OpenAI/Claude API)
    const response = generateAIResponse(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function generateAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Booking-related queries
  if (lowerMessage.includes('book') || lowerMessage.includes('booking')) {
    return 'To book a braider on Braidly:\n1. Search for braiders by location and style\n2. View their profile, ratings, and availability\n3. Select your preferred date and time\n4. Choose your service and review the price\n5. Complete payment (funds held securely)\n6. Receive confirmation and braider details\n\nYour payment is protected in escrow until the service is complete. Need help with a specific booking?';
  }

  if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
    return 'You can cancel a booking anytime before the appointment:\n1. Go to your bookings\n2. Select the booking to cancel\n3. Click "Cancel Booking"\n4. Provide a reason (optional)\n5. Receive full refund within 2-3 business days\n\nIf you\'ve already completed the service, you can file a dispute within 7 days. Would you like help with a specific cancellation?';
  }

  if (lowerMessage.includes('payment') || lowerMessage.includes('price')) {
    return 'Braidly pricing includes:\n- Service cost (set by braider)\n- Platform fee (15-25% of service cost)\n- Taxes (varies by location)\n\nYour total is shown before payment. We accept all major credit/debit cards, Apple Pay, and Google Pay. All payments are secure and encrypted. Questions about a specific service?';
  }

  if (lowerMessage.includes('verify') || lowerMessage.includes('verification')) {
    return 'All Braidly braiders are verified through:\n1. Government ID verification\n2. Live selfie capture (face match)\n3. Address confirmation\n4. Optional background check (Tier 2)\n\nVerified braiders display a blue checkmark badge. This ensures your safety and quality service. Need to verify your own account?';
  }

  if (lowerMessage.includes('emergency') || lowerMessage.includes('sos') || lowerMessage.includes('safety')) {
    return 'Braidly Safety Features:\n- SOS Emergency Button: Available during appointments for immediate support\n- Location Tracking: Real-time location sharing with support team\n- Incident Reporting: Report safety concerns anytime\n- 24/7 Support: Contact us immediately for emergencies\n\nIf you\'re in immediate danger, call 911. For Braidly emergencies, use the SOS button in your active booking. Are you experiencing an issue right now?';
  }

  if (lowerMessage.includes('earn') || lowerMessage.includes('braider') || lowerMessage.includes('income')) {
    return 'As a Braidly Braider:\n- Set your own rates and availability\n- Receive bookings from verified customers\n- Earn $50-$200+ per appointment\n- Get paid within 2-3 days after service\n- Access analytics and customer reviews\n- Build your professional profile\n\nCommission: 15-25% platform fee. Payouts via bank transfer or instant transfer (fee applies). Ready to join as a braider?';
  }

  if (lowerMessage.includes('dispute') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
    return 'If you have an issue with a booking:\n1. Contact the braider first to resolve\n2. If unresolved, file a dispute within 7 days\n3. Provide evidence (photos, messages, etc.)\n4. Our team reviews and makes a decision\n5. Refund or resolution within 5-7 business days\n\nCommon issues: Quality concerns, no-show, safety issues. What\'s your specific concern?';
  }

  if (lowerMessage.includes('rating') || lowerMessage.includes('review')) {
    return 'After your appointment:\n1. You\'ll receive a review request\n2. Rate the braider 1-5 stars\n3. Write optional comments\n4. Submit your review\n\nReviews help other customers and help braiders improve. Honest feedback is appreciated! Have you completed a booking?';
  }

  if (lowerMessage.includes('profile') || lowerMessage.includes('account')) {
    return 'Manage your Braidly profile:\n- Update personal information\n- Add/change profile photo\n- Manage payment methods\n- View booking history\n- Check earnings (braiders)\n- Update preferences\n\nGo to your dashboard and click "Profile" or "Settings". Need help with a specific profile update?';
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('contact')) {
    return 'Braidly Support:\n- Email: support@braidly.com\n- Chat: Available 24/7 in app\n- Phone: 1-800-BRAIDLY\n- Help Center: braidly.com/help\n\nFor urgent issues, use the SOS button or call our emergency line. How can we help you today?';
  }

  // Default response
  return 'I\'m here to help! You can ask me about:\n- Booking a braider\n- Cancellations and refunds\n- Payments and pricing\n- Braider verification\n- Safety features\n- Earning as a braider\n- Disputes and issues\n- Account management\n\nWhat would you like to know?';
}
