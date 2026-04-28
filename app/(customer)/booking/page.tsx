'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Clock, ArrowLeft, AlertCircle, CheckCircle, Loader, MapPin, Star } from 'lucide-react';

interface Braider {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  rating_avg: number;
  rating_count: number;
  travel_radius_miles: number;
  is_mobile: boolean;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
  }>;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBraiderId = searchParams?.get('braider_id');
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [braiderLoading, setBraiderLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    braider_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    location_type: 'salon' as 'salon' | 'mobile',
    notes: '',
  });

  // Load braiders on mount
  useEffect(() => {
    loadBraiders();
  }, []);

  // Preselect braider from URL param
  useEffect(() => {
    if (preselectedBraiderId && braiders.length > 0 && !formData.braider_id) {
      const braiderExists = braiders.find(b => b.user_id === preselectedBraiderId);
      if (braiderExists) {
        setFormData(prev => ({ ...prev, braider_id: preselectedBraiderId }));
      }
    }
  }, [preselectedBraiderId, braiders]);

  // Check auth
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }

    if (user.role !== 'customer') {
      console.log('User is not a customer, redirecting home');
      router.push('/');
      return;
    }
    
    console.log('Auth check passed for customer:', user.id);
  }, [user, authLoading, router]);

  const loadBraiders = async () => {
    try {
      setBraiderLoading(true);
      console.log('Loading braiders from API...');

      // Use the API route to fetch braiders
      const response = await fetch('/api/braiders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch braiders');
      }

      const braiderData = await response.json();
      console.log('Braiders from API:', braiderData.length);

      if (!Array.isArray(braiderData) || braiderData.length === 0) {
        console.log('No braiders found');
        setBraiders([]);
        setBraiderLoading(false);
        return;
      }

      // Fetch services for each braider
      const braiderIds = braiderData.map((b: any) => b.user_id);
      
      // Fetch services from API or directly
      const servicesResponse = await fetch(`/api/services?braider_ids=${braiderIds.join(',')}`);
      let servicesData: any[] = [];
      
      if (servicesResponse.ok) {
        servicesData = await servicesResponse.json();
      }

      // Combine braiders with their services
      const braiderMap = new Map();
      braiderData.forEach((b: any) => {
        braiderMap.set(b.user_id, {
          ...b,
          services: [],
        });
      });

      servicesData.forEach((s: any) => {
        const braider = braiderMap.get(s.braider_id);
        if (braider) {
          braider.services.push({
            id: s.id,
            name: s.name,
            description: s.description,
            duration_minutes: s.duration_minutes,
            price: s.price,
          });
        }
      });

      const braiderList = Array.from(braiderMap.values());
      console.log('Loaded braiders with services:', braiderList.length);
      setBraiders(braiderList);
    } catch (error) {
      console.error('Error loading braiders:', error);
      setBraiders([]);
    } finally {
      setBraiderLoading(false);
    }
  };

  if (authLoading || braiderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading booking system...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  const selectedBraider = braiders.find((b) => b.user_id === formData.braider_id);
  const selectedService = selectedBraider?.services.find((s) => s.id === formData.service_id);

  // Currency based on braider's country
  const braiderCountry = (selectedBraider as any)?.country || 'NG';
  const currencySymbol = braiderCountry === 'US' ? '$' : '₦';
  const currencyCode = braiderCountry === 'US' ? 'USD' : 'NGN';
  const paymentProvider = braiderCountry === 'US' ? 'Stripe' : 'Paystack';
  const paymentFlag = braiderCountry === 'US' ? '🇺🇸' : '🇳🇬';

  const handleNext = () => {
    if (step === 1 && formData.braider_id) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2 && formData.service_id) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 3 && formData.appointment_date && formData.appointment_time) {
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBraider || !selectedService || !user) return;

    setLoading(true);
    try {
      const bookingData = {
        customer_id: user.id,
        customer_name: user.full_name || 'Customer',
        braider_id: selectedBraider.user_id,
        braider_name: selectedBraider.full_name,
        braider_country: (selectedBraider as any).country || 'NG', // CRITICAL: pass braider's country for payment routing
        currency: (selectedBraider as any).country === 'US' ? 'USD' : 'NGN',
        service_id: selectedService.id,
        service_name: selectedService.name,
        service_price: selectedService.price,
        appointment_date: `${formData.appointment_date}T${formData.appointment_time}`,
        location_address: formData.location_type === 'salon' ? 'Salon' : 'Mobile Service',
        notes: formData.notes,
        status: 'pending',
        total_amount: selectedService.price,
        platform_fee: selectedService.price * 0.1,
        braider_payout: selectedService.price * 0.9,
        escrow_released: false,
      };

      console.log('Submitting booking:', bookingData);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const booking = await response.json();
      console.log('Booking created:', booking);

      setBookingSuccess(true);
      setTimeout(() => {
        router.push(`/booking/${booking.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-20">
      {/* Header - Fixed at top */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-3 transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">Book a Braider</h1>
          <p className="text-gray-600 text-sm mt-1">Step {step} of 4</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Success Alert */}
        {bookingSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-slide-down">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">Booking submitted successfully! Redirecting...</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Select Braider */}
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 animate-fade-in">
              <h2 className="text-2xl font-serif font-bold mb-2">Select a Braider</h2>
              {formData.braider_id && (
                <p className="text-sm text-green-600 font-semibold mb-6">✓ Braider selected - Click Next to continue</p>
              )}
              {braiders.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No braiders available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {braiders.map((braider) => (
                    <button
                      key={braider.user_id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, braider_id: braider.user_id, service_id: '' });
                        console.log('Selected braider:', braider.user_id);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-smooth text-left cursor-pointer ${
                        formData.braider_id === braider.user_id
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{braider.full_name}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{braider.bio}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {braider.rating_avg.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {braider.travel_radius_miles} miles
                            </span>
                            <span>{braider.services.length} services</span>
                            {/* Country + payment badge */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${(braider as any).country === 'US' ? 'bg-blue-500' : 'bg-green-600'}`}>
                              {(braider as any).country === 'US' ? '🇺🇸 Stripe' : '🇳🇬 Paystack'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            formData.braider_id === braider.user_id
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-gray-300'
                          }`}>
                            {formData.braider_id === braider.user_id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Service */}
          {step === 2 && selectedBraider && (
            <div className="bg-white rounded-3xl shadow-lg p-8 animate-fade-in">
              <h2 className="text-2xl font-serif font-bold mb-2">Select a Service</h2>
              <p className="text-sm text-gray-600 mb-6">From <span className="font-semibold text-primary-600">{selectedBraider.full_name}</span></p>
              {formData.service_id && (
                <p className="text-sm text-green-600 font-semibold mb-6">✓ Service selected - Click Next to continue</p>
              )}
              {selectedBraider.services.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">This braider hasn't added services yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBraider.services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, service_id: service.id });
                        console.log('Selected service:', service.id);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-smooth text-left cursor-pointer ${
                        formData.service_id === service.id
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {service.duration_minutes} mins
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-2xl font-bold text-primary-600">{currencySymbol}{service.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{currencyCode}</p>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2 mx-auto ${
                            formData.service_id === service.id
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-gray-300'
                          }`}>
                            {formData.service_id === service.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 animate-fade-in">
              <h2 className="text-2xl font-serif font-bold mb-6">Select Date & Time</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Location Type *</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, location_type: 'salon' })}
                      className={`w-full p-4 rounded-xl border-2 transition-smooth text-left ${
                        formData.location_type === 'salon'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <p className="font-semibold">At Salon</p>
                      <p className="text-sm text-gray-600">Visit the braider's salon</p>
                    </button>
                    {selectedBraider?.is_mobile && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, location_type: 'mobile' })}
                        className={`w-full p-4 rounded-xl border-2 transition-smooth text-left ${
                          formData.location_type === 'mobile'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <p className="font-semibold">Mobile Service</p>
                        <p className="text-sm text-gray-600">Braider comes to you</p>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && selectedBraider && selectedService && (
            <div className="bg-white rounded-3xl shadow-lg p-8 animate-fade-in">
              <h2 className="text-2xl font-serif font-bold mb-6">Review Your Booking</h2>

              <div className="space-y-6 mb-8">
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-600 mb-1">Braider</p>
                  <p className="text-lg font-semibold">{selectedBraider.full_name}</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-600 mb-1">Service</p>
                  <p className="text-lg font-semibold">{selectedService.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedService.duration_minutes} minutes</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                  <p className="text-lg font-semibold">
                    {new Date(formData.appointment_date).toLocaleDateString()} at {formData.appointment_time}
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="text-lg font-semibold">
                    {formData.location_type === 'salon' ? 'At Salon' : 'Mobile Service'}
                  </p>
                </div>

                <div className="bg-primary-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Total Price</span>
                    <span className="text-2xl font-bold text-primary-600">{currencySymbol}{selectedService.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{paymentFlag}</span>
                    <span>Payment via <strong>{paymentProvider}</strong> ({currencyCode})</span>
                  </div>
                </div>
              </div>

              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any special requests or notes..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth mb-6"
                rows={4}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-smooth font-semibold"
              >
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-smooth font-semibold"
              >
                Back
              </button>
            )}

            {step < 4 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  loading ||
                  (step === 1 && !formData.braider_id) ||
                  (step === 2 && !formData.service_id) ||
                  (step === 3 && (!formData.appointment_date || !formData.appointment_time))
                }
                className={`flex-1 px-6 py-3 rounded-lg transition-smooth font-semibold text-white ${
                  (step === 1 && formData.braider_id) ||
                  (step === 2 && formData.service_id) ||
                  (step === 3 && formData.appointment_date && formData.appointment_time)
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-lg'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Loading...' : 'Next'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
