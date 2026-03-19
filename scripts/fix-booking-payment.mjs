import { writeFileSync } from 'fs';
import { resolve } from 'path';

const root = process.cwd();

const bookingPage = `'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, AlertCircle, Loader, CheckCircle } from 'lucide-react';

// Lazy-load stripe only when needed — avoids build-time env var issues
let stripePromiseCache: any = null;
function getStripePromise() {
  if (stripePromiseCache) return stripePromiseCache;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key || key.length < 10) return null;
  // Dynamic import to avoid SSR issues
  const { loadStripe } = require('@stripe/stripe-js');
  stripePromiseCache = loadStripe(key);
  return stripePromiseCache;
}

function PaymentForm({ bookingId, amount, onSuccess }: { bookingId: string; amount: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const promise = getStripePromise();
        if (!promise) { setError('Stripe not configured'); return; }
        const stripe = await promise;
        if (cancelled || !stripe) return;
        stripeRef.current = stripe;
        const elements = stripe.elements();
        elementsRef.current = elements;
        const card = elements.create('card', {
          style: {
            base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9ca3af' } },
            invalid: { color: '#ef4444' },
          },
        });
        cardRef.current = card;
        // Mount after a tick to ensure DOM is ready
        setTimeout(() => {
          if (!cancelled && document.getElementById('card-element')) {
            card.mount('#card-element');
            mountedRef.current = true;
            setStripeReady(true);
          }
        }, 100);
      } catch (err) {
        if (!cancelled) setError('Failed to load payment form');
      }
    };
    init();
    return () => {
      cancelled = true;
      if (cardRef.current && mountedRef.current) {
        try { cardRef.current.unmount(); } catch {}
        mountedRef.current = false;
      }
    };
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeRef.current || !cardRef.current) {
      setError('Payment form not ready. Please refresh.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || 'Failed to create payment intent');
      }
      const { clientSecret } = await response.json();
      const result = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: { card: cardRef.current },
      });
      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg bg-white min-h-[50px]">
        {!stripeReady && <div className="text-sm text-gray-400">Loading payment form...</div>}
        <div id="card-element" />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={!stripeReady || loading}
        className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-smooth font-semibold"
      >
        {loading ? 'Processing...' : \`Pay $\${amount?.toFixed(2)}\`}
      </button>
    </form>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    if (params?.id) fetchBooking();
  }, [params?.id]);

  const fetchBooking = async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(\`/api/bookings/\${params.id}\`);
      if (!response.ok) { setLoading(false); return; }
      const data = await response.json();
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Booking not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isPending = booking.status === 'pending' || booking.status === 'pending_payment';
  const isAccepted = booking.status === 'confirmed' || booking.status === 'accepted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="mb-6 text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2">
          ← Back
        </button>
        <h1 className="text-3xl font-serif font-bold mb-8">Booking Details</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Status</h2>
                <span className={\`px-4 py-2 rounded-full font-medium \${getStatusColor(booking.status)}\`}>
                  {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                </span>
              </div>
              {isPending && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">Awaiting payment. Complete payment to confirm your booking.</p>
                </div>
              )}
              {isAccepted && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-700">Your booking is confirmed.</p>
                    <button onClick={() => router.push(\`/messages/\${booking.id}\`)} className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm">
                      Chat with Braider
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Service Details</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{booking.service_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Braider</span>
                  <span className="font-medium">{booking.braider_name}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Appointment</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600 text-sm">Date & Time</p>
                    <p className="font-medium">{booking.appointment_date ? new Date(booking.appointment_date).toLocaleString() : 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600 text-sm">Location</p>
                    <p className="font-medium">{booking.location_address || 'TBD'}</p>
                  </div>
                </div>
              </div>
            </div>
            {booking.notes && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Notes</h2>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 h-fit">
            <h2 className="text-xl font-semibold mb-6">Payment Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">\${(booking.service_price || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">\${(booking.platform_fee || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary-600">\${(booking.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
            {isPending && !paymentComplete && (
              <PaymentForm
                bookingId={booking.id}
                amount={booking.total_amount || 0}
                onSuccess={() => {
                  setPaymentComplete(true);
                  setBooking({ ...booking, status: 'confirmed' });
                }}
              />
            )}
            {paymentComplete && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">Payment Successful!</p>
                <p className="text-green-600 text-sm mt-1">Your booking is confirmed.</p>
                <button onClick={() => router.push(\`/messages/\${booking.id}\`)} className="mt-3 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm">
                  Chat with Braider →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

const filePath = resolve(root, 'app/(customer)/booking/[id]/page.tsx');
writeFileSync(filePath, bookingPage, 'utf8');
console.log('Written:', filePath);
console.log('Done.');
