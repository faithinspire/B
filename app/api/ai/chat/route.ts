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

    const response = generateAIResponse(message);

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function generateAIResponse(message: string): { response: string; actions?: Array<{ label: string; action: string }> } {
  const lowerMessage = message.toLowerCase();

  // BOOKING & SEARCH
  if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('braider')) {
    return {
      response: '🔍 I can help you find the perfect braider! You can search by:\n• Location (city or zip code)\n• Braiding style (box braids, knotless, cornrows, etc.)\n• Price range\n• Rating\n\nWhere are you located?',
      actions: [
        { label: '📍 Use My Location', action: 'location' },
        { label: '🔍 Browse All', action: 'browse' },
      ],
    };
  }

  if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    return {
      response: '📅 Ready to book! Here\'s how it works:\n1. Select a braider\n2. Choose your service & style\n3. Pick date & time\n4. Secure payment (funds held safely)\n5. Get confirmation\n\nLet\'s get started!',
      actions: [
        { label: '📅 Book Now', action: 'book' },
        { label: '❓ Learn More', action: 'help' },
      ],
    };
  }

  // PAYMENTS & PRICING
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('payment')) {
    return {
      response: '💳 Payment Information:\n• Service cost (set by braider)\n• Platform fee: 15-25%\n• Taxes (varies by location)\n\nYour payment is held securely in escrow until the service is complete. You\'re fully protected!\n\nAccepted: Credit/Debit cards, Apple Pay, Google Pay',
      actions: [
        { label: '🔒 Security Info', action: 'security' },
        { label: '💰 Pricing Details', action: 'pricing' },
      ],
    };
  }

  // CANCELLATION & REFUNDS
  if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
    return {
      response: '❌ Cancellation & Refunds:\n• Cancel anytime before appointment → Full refund\n• Cancel within 24 hours → 50% refund\n• After service → File a dispute\n\nRefunds processed within 2-3 business days.',
      actions: [
        { label: '📋 My Bookings', action: 'bookings' },
        { label: '💬 Contact Support', action: 'support' },
      ],
    };
  }

  // VERIFICATION & SAFETY
  if (lowerMessage.includes('verify') || lowerMessage.includes('verification') || lowerMessage.includes('safe') || lowerMessage.includes('safety')) {
    return {
      response: '✅ Safety & Verification:\n• All braiders are ID-verified\n• Government ID + Live selfie verification\n• Optional background checks (Tier 2)\n• Verified badge on profile\n• SOS button during appointments\n• 24/7 support team',
      actions: [
        { label: '🛡️ Safety Features', action: 'safety' },
        { label: '👤 Become a Braider', action: 'braider' },
      ],
    };
  }

  // EARNINGS & BRAIDER INFO
  if (lowerMessage.includes('earn') || lowerMessage.includes('braider') || lowerMessage.includes('income')) {
    return {
      response: '💰 Braider Earnings:\n• Set your own rates\n• Earn $50-$200+ per appointment\n• Get paid within 2-3 days\n• Platform fee: 15-25%\n• Access analytics & reviews\n• Build your professional profile\n\nReady to join?',
      actions: [
        { label: '👤 Sign Up as Braider', action: 'braider_signup' },
        { label: '📊 View Earnings', action: 'earnings' },
      ],
    };
  }

  // DISPUTES & ISSUES
  if (lowerMessage.includes('dispute') || lowerMessage.includes('issue') || lowerMessage.includes('problem') || lowerMessage.includes('complaint')) {
    return {
      response: '⚠️ Having an issue?\n1. Contact the braider first\n2. If unresolved, file a dispute within 7 days\n3. Provide evidence (photos, messages)\n4. Our team reviews & decides\n5. Resolution within 5-7 business days\n\nWe\'ve got your back!',
      actions: [
        { label: '📝 File Dispute', action: 'dispute' },
        { label: '💬 Chat Support', action: 'support' },
      ],
    };
  }

  // REVIEWS & RATINGS
  if (lowerMessage.includes('review') || lowerMessage.includes('rating')) {
    return {
      response: '⭐ Reviews & Ratings:\n• Rate braiders 1-5 stars\n• Leave detailed comments\n• Help other customers\n• Honest feedback appreciated\n• Reviews appear on braider profile\n\nYour feedback matters!',
      actions: [
        { label: '⭐ Leave Review', action: 'review' },
        { label: '📊 View Ratings', action: 'ratings' },
      ],
    };
  }

  // ACCOUNT & PROFILE
  if (lowerMessage.includes('profile') || lowerMessage.includes('account') || lowerMessage.includes('settings')) {
    return {
      response: '👤 Account Management:\n• Update personal info\n• Change profile photo\n• Manage payment methods\n• View booking history\n• Update preferences\n• Download data\n\nGo to your dashboard → Profile/Settings',
      actions: [
        { label: '⚙️ Settings', action: 'settings' },
        { label: '👤 My Profile', action: 'profile' },
      ],
    };
  }

  // REFERRALS
  if (lowerMessage.includes('refer') || lowerMessage.includes('referral') || lowerMessage.includes('invite')) {
    return {
      response: '🎁 Referral Program:\n• Share your unique link\n• Get $10 credit per referral\n• Braiders get 3 months reduced commission\n• Unlimited referrals!\n• Track your earnings\n\nStart earning today!',
      actions: [
        { label: '🔗 Get Referral Link', action: 'referral' },
        { label: '💰 My Earnings', action: 'earnings' },
      ],
    };
  }

  // HELP & SUPPORT
  if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('contact') || lowerMessage.includes('question')) {
    return {
      response: '📞 Braidly Support:\n• Email: support@braidly.com\n• Chat: 24/7 in app\n• Phone: 1-800-BRAIDLY\n• Help Center: braidly.com/help\n\nFor emergencies during appointments, use the SOS button!',
      actions: [
        { label: '💬 Chat Support', action: 'support' },
        { label: '📧 Email Us', action: 'email' },
      ],
    };
  }

  // DEFAULT - MAIN MENU
  return {
    response: 'Welcome to Braidly! 👋 I can help you with:\n• Finding & booking braiders\n• Payments & refunds\n• Safety & verification\n• Account management\n• Disputes & issues\n• Referrals & earnings\n\nWhat would you like to do?',
    actions: [
      { label: '🔍 Find Braiders', action: 'search' },
      { label: '📅 Book Now', action: 'book' },
      { label: '💬 Contact Support', action: 'support' },
    ],
  };
}
