'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { MarketplaceChat } from '@/app/components/MarketplaceChat';

export default function BraiderOrderChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { user } = useSupabaseAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !user) return;

    const fetchOrder = async () => {
      try {
        const db = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data } = await db
          .from('marketplace_orders')
          .select('*, profiles!marketplace_orders_customer_id_fkey(full_name, avatar_url)')
          .eq('id', orderId)
          .single();

        if (data) setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  const customerName = order.profiles?.full_name || 'Customer';
  const customerAvatar = order.profiles?.avatar_url || null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Chat with Buyer</h1>
          <p className="text-gray-600 text-sm">Order #{order.order_number}</p>
        </div>

        <MarketplaceChat
          orderId={orderId}
          otherUserId={order.customer_id}
          otherUserName={customerName}
          otherUserAvatar={customerAvatar}
          isModal={false}
        />
      </div>
    </div>
  );
}
