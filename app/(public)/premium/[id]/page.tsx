'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Crown, Star, MapPin, Clock, ArrowLeft, BookOpen, Eye } from 'lucide-react';
import Link from 'next/link';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export default function PremiumBraiderProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [braider, setBraider] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'blog'>('profile');

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    const supabase = db();
    const { data: bp } = await supabase
      .from('braider_profiles')
      .select(`
        id, bio, rating_avg, rating_count, travel_radius_miles, is_mobile,
        salon_address, cities, is_premium, premium_since, blog_enabled,
        profiles!inner(full_name, avatar_url, email),
        services(id, name, description, duration_minutes, price),
        reviews(id, rating, comment)
      `)
      .eq('id', id)
      .eq('is_premium', true)
      .single();

    if (!bp) { setLoading(false); return; }
    setBraider(bp);

    if (bp.blog_enabled) {
      const res = await fetch(`/api/premium/blog?braider_id=${id}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
    </div>
  );

  if (!braider) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Premium braider not found</p>
        <Link href="/premium" className="text-yellow-600 hover:underline">Back to Premium Braiders</Link>
      </div>
    </div>
  );

  const profile = (braider.profiles as any) || {};
  const services = braider.services || [];
  const reviews = braider.reviews || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
      <div className="bg-white border-b border-yellow-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/premium" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="text-xl font-serif font-bold text-primary-600">Braidly</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 border border-yellow-100">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-yellow-200 to-amber-200 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">💇</span>
              )}
              <div className="absolute top-2 right-2 bg-yellow-400 text-white p-1 rounded-full">
                <Crown className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{(braider.rating_avg || 5).toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({braider.rating_count || 0} reviews)</span>
              </div>
              <p className="text-gray-600 mb-4">{braider.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{braider.travel_radius_miles} mi radius</span>
                {braider.is_mobile && <span className="text-green-600 font-medium">Mobile Service</span>}
              </div>
              {braider.cities?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {braider.cities.map((c: string) => (
                    <span key={c} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'profile' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            Services & Reviews
          </button>
          {braider.blog_enabled && (
            <button onClick={() => setActiveTab('blog')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'blog' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              <BookOpen className="w-4 h-4" /> Blog {posts.length > 0 && `(${posts.length})`}
            </button>
          )}
        </div>

        {activeTab === 'profile' && (
          <>
            {/* Services */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Services</h2>
              {services.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No services listed</p>
              ) : (
                <div className="space-y-3">
                  {services.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-yellow-200 transition-all">
                      <div>
                        <h3 className="font-semibold">{s.name}</h3>
                        {s.description && <p className="text-gray-500 text-sm">{s.description}</p>}
                        <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />{s.duration_minutes} min
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary-600">${s.price.toFixed(2)}</p>
                        <Link href="/booking" className="mt-1 block text-xs px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all">
                          Book
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 10).map((r: any) => (
                    <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-1 mb-1">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      {r.comment && <p className="text-gray-700 text-sm">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'blog' && (
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No blog posts yet</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views || 0} views</span>
                    </div>
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
