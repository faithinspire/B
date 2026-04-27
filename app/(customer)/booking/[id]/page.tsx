'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, AlertCircle, Loader, CheckCircle, CreditCard, Lock, MessageCircle } from 'lucide-react';
import { CustomerLocationMap } from '@/app/components/CustomerLocationMap';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

// ─── Paystack Payment (Nigeria) ────────────────────────────────────────────
function PaystackPaymentForm({ bookingId, amount, email }: { bookingId: string; amount: number; email: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount, email, currency: 'NGN' }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorizationUrl) throw new Error(data.error || 'Failed to initialize payment');
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      setError(err.message || 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🇳🇬</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Pay with Paystack</p>
            <p className="text-xs text-green-600">Cards, bank transfer, USSD & more</p>
          </div>
        </div>
        <p className="text-xs text-green-600">You will be redirected to Paystack to complete payment securely.</p>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5 text-green-500" />
        <span>Secured by Paystack</span>
      </div>
      <button onClick={handlePay} disabled={loading}
        className="w-full px-4 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold text-base transition-colors flex items-center justify-center gap-2">
        {loading ? <><Loader className="w-5 h-5 animate-spin" /> Redirecting...</> : <>🔒 Pay with Paystack</>}
      </button>
    </div>
  );
}

// ─── Stripe Payment (USA / International) ─────────────────────────────────
function StripePaymentForm({ bookingId, amount, onSuccess }: { bookingId: string; amount: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const stripeRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const mountedRef = useRef(false);
  const elementsMountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function initStripe() {
      try {
        const key = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();
        if (!key || (!key.startsWith('pk_live_') && !key.startsWith('pk_test_'))) {
          setError('Stripe not configured. Contact support.');
          return;
        }
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(key);
        if (cancelled || !stripe) { if (!cancelled) setStripeReady(true); return; }
        stripeRef.current = stripe;
        const elements = stripe.elements();
        const card = elements.create('card', {
          style: {
            base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' }, iconColor: '#9333ea' },
            invalid: { color: '#ef4444', iconColor: '#ef4444' },
          },
          hidePostalCode: false,
        });
        cardRef.current = card;
        card.on('change', (e: any) => {
          setCardComplete(e.complete);
          setError(e.error ? e.error.message : '');
        });
        const tryMount = () => {
          const el = document.getElementById('stripe-card-element');
          if (el && !elementsMountedRef.current) {
            card.mount('#stripe-card-element');
            elementsMountedRef.current = true;
            mountedRef.current = true;
            if (!cancelled) setStripeReady(true);
          } else if (!el) setTimeout(tryMount, 100);
        };
        setTimeout(tryMount, 200);
      } catch (err) {
        if (!cancelled) setStripeReady(true);
      }
    }
    initStripe();
    return () => {
      cancelled = true;
      if (cardRef.current && mountedRef.current) {
        try { cardRef.current.unmount(); } catch {}
        mountedRef.current = false;
        elementsMountedRef.current = false;
      }
    };
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!stripeRef.current || !cardRef.current) throw new Error('Payment form not ready. Please refresh.');
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create payment'); }
      const { clientSecret } = await res.json();
      if (!clientSecret) throw new Error('No payment session received.');
      const { error: stripeError, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: { card: cardRef.current },
      });
      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Check your card details.');
      } else if (paymentIntent?.status === 'succeeded') {
        await fetch(`/api/bookings/${bookingId}/confirm`, { method: 'POST' }).catch(() => {});
        onSuccess();
      } else {
        setError('Payment did not complete. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-600" /> Card Details
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-xl bg-white focus-within:border-purple-500 transition-colors min-h-[52px]">
          {!stripeReady && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader className="w-4 h-4 animate-spin" /> Loading secure payment form...
            </div>
          )}
          <div id="stripe-card-element" className={stripeReady && !!stripeRef.current ? '' : 'hidden'} />
        </div>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5 text-green-500" />
        <span>Secured by Stripe — card details are encrypted</span>
      </div>
      <button type="submit"
        disabled={!stripeReady || loading || !cardComplete || !stripeRef.current}
        className="w-full px-4 py-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base transition-colors flex items-center justify-center gap-2">
        {loading ? <><Loader className="w-5 h-5 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Pay ${amount.toFixed(2)}</>}
      </button>
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Auth guard — redirect to login with return URL if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user && params?.id) {
      router.push(`/login?redirect=/booking/${params.id}`);
    }
  }, [user, authLoading, params?.id, router]);

  useEffect(() => {
    if (params?.id && user) fetchBooking();
  }, [params?.id, user]);

  // Handle Paystack callback: ?payment=success&ref=xxx
  useEffect(() => {
    const paymentStatus = searchParams?.get('payment');
    const ref = searchParams?.get('ref');
    if (paymentStatus === 'success' && params?.id) {
      if (ref) {
        fetch(`/api/paystack/verify?reference=${ref}&bookingId=${params.id}`)
          .then(r => r.json())
          .then(data => { if (data.verified) { setPaymentComplete(true); setBooking((b: any) => b ? { ...b, status: 'confirmed' } : b); } })
          .catch(() => { setPaymentComplete(true); });
      } else {
        setPaymentComplete(true);
      }
    }
  }, [searchParams, params?.id]);

  const fetchBooking = async () => {
    if (!params?.id) return;
    try {
      const res = await fetch('/api/bookings/' + params.id);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setBooking(data);
      if (['confirmed', 'accepted', 'escrowed'].includes(data.status)) setPaymentComplete(true);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="w-12 h-12 text-purple-600 animate-spin" />
    </div>
  );

  // Show loading while auth is resolving
  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="w-12 h-12 text-purple-600 animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-gray-600 font-semibold">Booking not found</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Back to Dashboard</button>
      </div>
    </div>
  );

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    accepted: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    pending_payment: 'bg-orange-100 text-orange-700',
  };

  const isPending = booking.status === 'pending' || booking.status === 'pending_payment';
  const isConfirmed = booking.status === 'confirmed' || booking.status === 'accepted' || booking.status === 'escrowed';

  // Use Paystack for Nigerian bookings, Stripe for USA/international
  const isNigerianBooking = booking.braider_country === 'NG' || booking.currency === 'NGN' || booking.country === 'NG';
  const customerEmail = user?.email || booking.customer_email || 'customer@braidmee.com';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="mb-6 text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2 text-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                  {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1).replace('_', ' ')}
                </span>
              </div>
              {isPending && !paymentComplete && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">Complete payment to confirm your booking.</p>
                </div>
              )}
              {(isConfirmed || paymentComplete) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">Booking confirmed! 🎉</p>
                    <button onClick={() => router.push('/messages/' + booking.id)}
                      className="mt-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Chat with Professional
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold mb-3">Service Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{booking.service_name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Professional</span><span className="font-medium">{booking.braider_name || '—'}</span></div>
              </div>
            </div>

            {/* Appointment */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold mb-3">Appointment</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div><p className="text-gray-500">Date & Time</p><p className="font-medium">{booking.appointment_date ? new Date(booking.appointment_date).toLocaleString() : 'TBD'}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div><p className="text-gray-500">Location</p><p className="font-medium">{booking.location_address || 'TBD'}</p></div>
                </div>
              </div>
            </div>

            {/* Live Map */}
            {(isConfirmed || paymentComplete) && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-lg font-semibold mb-3">Live Professional Location</h2>
                <div className="h-64 rounded-xl overflow-hidden">
                  <CustomerLocationMap bookingId={booking.id} braiderName={booking.braider_name || 'Professional'} />
                </div>
              </div>
            )}

            {booking.notes && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-lg font-semibold mb-2">Notes</h2>
                <p className="text-gray-700 text-sm">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Right — Payment */}
          <div className="bg-white rounded-2xl shadow-sm p-5 h-fit">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">${(booking.service_price || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span className="font-medium">${(booking.platform_fee || 0).toFixed(2)}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-purple-600">${(booking.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method based on country */}
            {isPending && !paymentComplete && (
              isNigerianBooking ? (
                <PaystackPaymentForm bookingId={booking.id} amount={booking.total_amount || 0} email={customerEmail} />
              ) : (
                <StripePaymentForm
                  bookingId={booking.id}
                  amount={booking.total_amount || 0}
                  onSuccess={() => { setPaymentComplete(true); setBooking({ ...booking, status: 'confirmed' }); }}
                />
              )
            )}

            {(paymentComplete || isConfirmed) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-bold">Payment Complete ✓</p>
                <button onClick={() => router.push('/messages/' + booking.id)}
                  className="mt-3 w-full px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-sm flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Chat with Professional →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
