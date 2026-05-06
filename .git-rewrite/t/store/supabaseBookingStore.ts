import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Booking {
  id: string;
  customer_id: string;
  customer_name: string;
  braider_id: string;
  braider_name: string;
  service_id: string;
  service_name: string;
  service_price: number;
  appointment_date: string;
  location_address: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  total_amount: number;
  platform_fee: number;
  braider_payout: number;
  escrow_released: boolean;
  created_at: string;
  updated_at: string;
}

interface BookingState {
  bookings: Booking[];
  serviceId: string | null;
  appointmentDate: string | null;
  locationAddress: string | null;
  notes: string | null;
  loading: boolean;
  error: string | null;
  subscriptionUnsubscribe: (() => void) | null;

  // Form actions
  setService: (serviceId: string) => void;
  setAppointmentDate: (date: string) => void;
  setLocation: (address: string) => void;
  setNotes: (notes: string) => void;
  reset: () => void;

  // Booking management
  createBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Promise<Booking>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  getBookingsByCustomer: (customerId: string) => Promise<Booking[]>;
  getBookingsByBraider: (braiderId: string) => Promise<Booking[]>;
  getBookingById: (bookingId: string) => Promise<Booking | null>;
  cancelBooking: (bookingId: string, reason: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;

  // Real-time subscriptions
  subscribeToBookings: (userId: string, userRole: 'customer' | 'braider') => void;
  unsubscribeFromBookings: () => void;
}

export const useSupabaseBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  serviceId: null,
  appointmentDate: null,
  locationAddress: null,
  notes: null,
  loading: false,
  error: null,
  subscriptionUnsubscribe: null,

  setService: (serviceId) => set({ serviceId }),
  setAppointmentDate: (appointmentDate) => set({ appointmentDate }),
  setLocation: (locationAddress) => set({ locationAddress }),
  setNotes: (notes) => set({ notes }),

  reset: () =>
    set({
      serviceId: null,
      appointmentDate: null,
      locationAddress: null,
      notes: null,
    }),

  createBooking: async (booking) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const newBooking: Booking = {
        id: `booking_${Date.now()}`,
        ...booking,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('bookings')
        .insert(newBooking);

      if (error) throw error;

      set((state) => ({
        bookings: [...state.bookings, newBooking],
      }));

      return newBooking;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId
            ? { ...b, status, updated_at: new Date().toISOString() }
            : b
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update booking';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getBookingsByCustomer: async (customerId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      const bookings = (data || []) as Booking[];
      set((state) => ({
        bookings: [
          ...state.bookings.filter((b) => b.customer_id !== customerId),
          ...bookings,
        ],
      }));

      return bookings;
    } catch (error) {
      console.error('Failed to get customer bookings:', error);
      return [];
    }
  },

  getBookingsByBraider: async (braiderId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('braider_id', braiderId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      const bookings = (data || []) as Booking[];
      set((state) => ({
        bookings: [
          ...state.bookings.filter((b) => b.braider_id !== braiderId),
          ...bookings,
        ],
      }));

      return bookings;
    } catch (error) {
      console.error('Failed to get braider bookings:', error);
      return [];
    }
  },

  getBookingById: async (bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return (data || null) as Booking | null;
    } catch (error) {
      console.error('Failed to get booking:', error);
      return null;
    }
  },

  cancelBooking: async (bookingId, reason) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId
            ? { ...b, status: 'cancelled', updated_at: new Date().toISOString() }
            : b
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel booking';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  completeBooking: async (bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          escrow_released: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId
            ? { ...b, status: 'completed', escrow_released: true, updated_at: new Date().toISOString() }
            : b
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete booking';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  subscribeToBookings: (userId, userRole) => {
    if (!supabase) return;

    const filter = userRole === 'customer'
      ? `customer_id=eq.${userId}`
      : `braider_id=eq.${userId}`;

    const unsubscribe = supabase
      .from('bookings')
      .on('*', (payload) => {
        set((state) => {
          const bookings = [...state.bookings];
          const index = bookings.findIndex((b) => b.id === payload.new?.id);

          if (payload.eventType === 'DELETE') {
            return { bookings: bookings.filter((b) => b.id !== payload.old?.id) };
          } else if (index >= 0) {
            bookings[index] = payload.new as Booking;
          } else {
            bookings.push(payload.new as Booking);
          }

          return { bookings };
        });
      })
      .subscribe();

    set({ subscriptionUnsubscribe: () => unsubscribe.unsubscribe() });
  },

  unsubscribeFromBookings: () => {
    const unsubscribe = get().subscriptionUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ subscriptionUnsubscribe: null });
    }
  },
}));
