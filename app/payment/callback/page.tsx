'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<{
    amount?: number;
    currency?: string;
    reference?: string;
    type?: 'booking' | 'order';
    id?: string;
  }>({});

  useEffect(() => {
    verifyPayment();
  }, [searchParams]);

  async function verifyPayment() {
    try {
      // Check for Paystack callback (reference)
      const reference = searchParams.get('reference') || searchParams.get('trxref');
      
      // Check for Stripe callback (payment_intent)
      const paymentIntent = searchParams.get('payment_intent');
      const redirectStatus = searchParams.get('redirect_status');

      if (reference) {
        // Paystack payment verification
        const res = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await res.json();

        if (data.success && data.verification?.status === 'success') {
          setStatus('success');
          setMessage('Payment successful!');
          setDetails({
            amount: data.verification.amount,
            currency: data.verification.currency,
            reference: data.verification.reference,
            type: data.verification.metadata?.bookingId ? 'booking' : 'order',
            id: data.verification.metadata?.bookingId || data.verification.metadata?.orderId,
          });
        } else {
          setStatus('failed');
          setMessage(data.error || 'Payment verification failed');
        }
      } else if (paymentIntent) {
        // Stripe payment verification
        if (redirectStatus === 'succeeded') {
          const res = await fetch(`/api/stripe/verify?payment_intent=${paymentIntent}`);
          const data = await res.json();

          if (data.success) {
            setStatus('success');
            setMessage('Payment successful!');
            setDetails({
              amount: data.verification?.amount,
              currency: data.verification?.currency || 'USD',
              reference: paymentIntent,
              type: data.verification?.metadata?.bookingId ? 'booking' : 'order',
              id: data.verification?.metadata?.bookingId || data.verification?.metadata?.orderId,
            });
          } else {
            setStatus('failed');
            setMessage(data.error || 'Payment verification failed');
          }
        } else {
          setStatus('failed');
          setMessage('Payment was not completed successfully');
        }
      } else {
        setStatus('failed');
        setMessage('No payment reference found');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('Failed to verify payment. Please contact support.');
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">{message}</p>

          {details.amount && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                {details.currency === 'NGN' ? '₦' : '$'}
                {details.amount.toLocaleString()}
              </p>
              {details.reference && (
                <p className="text-xs text-gray-500 mt-2">Ref: {details.reference}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {details.type === 'booking' && details.id ? (
              <Link
                href={`/booking/${details.id}`}
                className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                View Booking
              </Link>
            ) : details.type === 'order' && details.id ? (
              <Link
                href={`/orders/${details.id}`}
                className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                View Order
              </Link>
            ) : null}
            
            <Link
              href="/"
              className="block w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="block w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Go to Homepage
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Need help? Contact{' '}
          <a href="mailto:Trulicares@gmail.com" className="text-purple-600 hover:underline">
            Support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
