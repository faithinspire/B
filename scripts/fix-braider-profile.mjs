import { writeFileSync } from 'fs';
import { resolve } from 'path';

const root = process.cwd();

const braiderProfilePage = `'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, MapPin, Clock, Shield, ChevronRight, AlertCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_id: string;
}

interface BraiderProfile {
  id: string;
  user_id: string;
  bio: string | null;
  rating_avg: number;
  rating_count: number;
  verification_status: string;
  travel_radius_miles: number;
  is_mobile: boolean;
  salon_address: string | null;
  cities: string[];
  full_name: string;
  avatar_url: string | null;
  services: Service[];
  reviews: Review[];
}

export default function BraiderProfilePage() {
  const params = useParams();
  const [braider, setBraider] = useState<BraiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) fetchBraider(params.id as string);
  }, [params?.id]);

  const fetchBraider = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      // Use API route with service role — bypasses RLS
      const res = await fetch('/api/braiders/' + id);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Braider not found');
        return;
      }
      const data = await res.json();
      setBraider({
        id: data.id,
        user_id: data.user_id,
        bio: data.bio,
        rating_avg: data.rating_avg || 5.0,
        rating_count: data.rating_count || 0,
        verification_status: data.verification_status || 'unverified',
        travel_radius_miles: data.travel_radius_miles || 10,
        is_mobile: data.is_mobile || false,
        salon_address: data.salon_address,
        cities: data.cities || [],
        full_name: data.full_name || 'Braider',
        avatar_url: data.avatar_url,
        services: data.services || [],
        reviews: data.reviews || [],
      });
    } catch (err) {
      console.error('Error fetching braider:', err);
      setError('Failed to load braider profile');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'tier1_verified':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">ID Verified</span>;
      case 'tier2_verified':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Background Checked</span>;
      case 'safety_badge_pro':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Safety Pro</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading braider profile...</p>
        </div>
      </div>
    );
  }

  if (!braider || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600 mb-4 text-lg font-semibold">{error || 'Braider not found'}</p>
          <p className="text-gray-500 mb-6">The braider profile you are looking for does not exist or has been removed.</p>
          <Link href="/search" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/search" className="text-primary-600 font-medium flex items-center gap-1 mb-4 hover:text-primary-700 transition-smooth">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Search
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-200 to-accent-200 rounded-2xl flex-shrink-0 flex items-center justify-center text-4xl sm:text-5xl overflow-hidden">
              {braider.avatar_url ? (
                <img src={braider.avatar_url} alt={braider.full_name} className="w-full h-full object-cover" />
              ) : (
                <span>💇</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-2">{braider.full_name}</h1>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">{braider.rating_avg.toFixed(1)}</span>
                    <span className="text-gray-600">({braider.rating_count} reviews)</span>
                  </div>
                </div>
                {getVerificationBadge(braider.verification_status)}
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">{braider.bio}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 text-sm sm:text-base text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{braider.travel_radius_miles} miles radius</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span>{braider.is_mobile ? 'Mobile Service' : 'Salon Based'}</span>
                </div>
              </div>
              {braider.cities && braider.cities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Service Coverage Cities</p>
                  <div className="flex flex-wrap gap-2">
                    {braider.cities.map((city) => (
                      <span key={city} className="px-3 py-1 bg-primary-100 text-primary-700 text-xs sm:text-sm rounded-full font-medium">{city}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-serif font-bold mb-6">Services</h2>
          {braider.services && braider.services.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {braider.services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary-300 hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3 sm:mb-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg">{service.name}</h3>
                      {service.description && <p className="text-gray-600 text-sm mt-1">{service.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl font-bold text-primary-600">\${service.price.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 justify-end mt-1">
                        <Clock className="w-4 h-4" />{service.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <Link href="/booking" className="block w-full mt-4 px-4 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold text-center text-sm sm:text-base">
                    Book Service
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No services available</p>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-serif font-bold mb-6">Reviews</h2>
          {braider.reviews && braider.reviews.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {braider.reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className={\`w-4 h-4 \${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}\`} />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">Verified Customer</span>
                  </div>
                  {review.comment && <p className="text-gray-700 text-sm sm:text-base">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const filePath = resolve(root, 'app/(public)/braider/[id]/page.tsx');
writeFileSync(filePath, braiderProfilePage, 'utf8');
console.log('Written:', filePath);
console.log('Done.');
