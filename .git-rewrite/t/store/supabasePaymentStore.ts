import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  braider_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripe_payout_id?: string;
  bank_account?: string;
  requested_at: string;
  completed_at?: string;
}

export interface Rating {
  id: string;
  booking_id: string;
  rater_id: string;
  rater_type: 'braider' | 'customer';
  ratee_id: string;
  rating: number; // 1-5
  review: string;
  created_at: string;
}

interface PaymentStore {
  payments: Record<string, Payment>;
  payouts: Record<string, Payout>;
  ratings: Record<string, Rating>;
  loading: boolean;
  error: string | null;

  // Payment actions
  createPayment: (bookingId: string, customerId: string, braiderId: string, amount: number) => Promise<Payment>;
  getPayment: (paymentId: string) => Promise<Payment | null>;
  getPaymentsByBooking: (bookingId: string) => Promise<Payment[]>;
  getPaymentsByCustomer: (customerId: string) => Promise<Payment[]>;
  updatePaymentStatus: (paymentId: string, status: string) => Promise<void>;
  releasePayment: (paymentId: string) => Promise<void>;
  refundPayment: (paymentId: string) => Promise<void>;

  // Payout actions
  requestPayout: (braiderId: string, amount: number, bankAccount: string) => Promise<Payout>;
  getPayout: (payoutId: string) => Promise<Payout | null>;
  getPayoutsByBraider: (braiderId: string) => Promise<Payout[]>;
  updatePayoutStatus: (payoutId: string, status: string) => Promise<void>;

  // Rating actions
  createRating: (bookingId: string, raterId: string, raterType: 'braider' | 'customer', rateeId: string, rating: number, review: string) => Promise<Rating>;
  getRating: (bookingId: string, raterId: string) => Promise<Rating | null>;
  getRatingsByRatee: (rateeId: string) => Promise<Rating[]>;
  getAverageRating: (rateeId: string) => Promise<number>;

  // Real-time subscriptions
  subscribeToPayments: (bookingId: string, callback: (payment: Payment) => void) => (() => void) | undefined;
  subscribeToPayouts: (braiderId: string, callback: (payout: Payout) => void) => (() => void) | undefined;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: {},
  payouts: {},
  ratings: {},
  loading: false,
  error: null,

  createPayment: async (bookingId, customerId, braiderId, amount) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const payment: Payment = {
        id: `pay_${Date.now()}`,
        booking_id: bookingId,
        customer_id: customerId,
        braider_id: braiderId,
        amount,
        currency: 'USD',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          customer_id: customerId,
          braider_id: braiderId,
          amount,
          currency: 'USD',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      set((state) => ({
        payments: { ...state.payments, [payment.id]: payment },
      }));

      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getPayment: async (paymentId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      return data as Payment;
    } catch (error) {
      console.error('Failed to get payment:', error);
      return null;
    }
  },

  getPaymentsByBooking: async (bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId);

      if (error) throw error;
      return (data || []) as Payment[];
    } catch (error) {
      console.error('Failed to get payments:', error);
      return [];
    }
  },

  getPaymentsByCustomer: async (customerId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Payment[];
    } catch (error) {
      console.error('Failed to get payments:', error);
      return [];
    }
  },

  updatePaymentStatus: async (paymentId, status) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (error) throw error;

      set((state) => {
        const payment = state.payments[paymentId];
        if (!payment) return state;

        return {
          payments: {
            ...state.payments,
            [paymentId]: { ...payment, status, updated_at: new Date().toISOString() },
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update payment';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  releasePayment: async (paymentId) => {
    await get().updatePaymentStatus(paymentId, 'completed');
  },

  refundPayment: async (paymentId) => {
    await get().updatePaymentStatus(paymentId, 'refunded');
  },

  requestPayout: async (braiderId, amount, bankAccount) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const payout: Payout = {
        id: `payout_${Date.now()}`,
        braider_id: braiderId,
        amount,
        currency: 'USD',
        status: 'pending',
        bank_account: bankAccount,
        requested_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('payouts')
        .insert({
          braider_id: braiderId,
          amount,
          currency: 'USD',
          status: 'pending',
          bank_account: bankAccount,
          requested_at: new Date().toISOString(),
        });

      if (error) throw error;

      set((state) => ({
        payouts: { ...state.payouts, [payout.id]: payout },
      }));

      return payout;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request payout';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getPayout: async (payoutId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (error) throw error;
      return data as Payout;
    } catch (error) {
      console.error('Failed to get payout:', error);
      return null;
    }
  },

  getPayoutsByBraider: async (braiderId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('braider_id', braiderId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Payout[];
    } catch (error) {
      console.error('Failed to get payouts:', error);
      return [];
    }
  },

  updatePayoutStatus: async (payoutId, status) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payouts')
        .update(updateData)
        .eq('id', payoutId);

      if (error) throw error;

      set((state) => {
        const payout = state.payouts[payoutId];
        if (!payout) return state;

        return {
          payouts: {
            ...state.payouts,
            [payoutId]: { ...payout, ...updateData },
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update payout';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createRating: async (bookingId, raterId, raterType, rateeId, rating, review) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const ratingRecord: Rating = {
        id: `rating_${Date.now()}`,
        booking_id: bookingId,
        rater_id: raterId,
        rater_type: raterType,
        ratee_id: rateeId,
        rating,
        review,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('ratings')
        .insert({
          booking_id: bookingId,
          rater_id: raterId,
          rater_type: raterType,
          ratee_id: rateeId,
          rating,
          review,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      set((state) => ({
        ratings: { ...state.ratings, [ratingRecord.id]: ratingRecord },
      }));

      return ratingRecord;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create rating';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getRating: async (bookingId, raterId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('rater_id', raterId)
        .single();

      if (error) throw error;
      return data as Rating;
    } catch (error) {
      console.error('Failed to get rating:', error);
      return null;
    }
  },

  getRatingsByRatee: async (rateeId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('ratee_id', rateeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Rating[];
    } catch (error) {
      console.error('Failed to get ratings:', error);
      return [];
    }
  },

  getAverageRating: async (rateeId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('ratee_id', rateeId);

      if (error) throw error;

      const ratings = (data || []) as any[];
      if (ratings.length === 0) return 5.0;

      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      return sum / ratings.length;
    } catch (error) {
      console.error('Failed to get average rating:', error);
      return 5.0;
    }
  },

  subscribeToPayments: (bookingId, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`payments_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          callback(payload.new as Payment);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  subscribeToPayouts: (braiderId, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`payouts_${braiderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payouts',
          filter: `braider_id=eq.${braiderId}`,
        },
        (payload) => {
          callback(payload.new as Payout);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
}));
