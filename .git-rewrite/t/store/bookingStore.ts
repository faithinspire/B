import { create } from 'zustand';

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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface BookingState {
  bookings: Booking[];
  serviceId: string | null;
  appointmentDate: string | null;
  locationAddress: string | null;
  notes: string | null;
  
  // Actions
  setService: (serviceId: string) => void;
  setAppointmentDate: (date: string) => void;
  setLocation: (address: string) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
  
  // Booking management
  createBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  getBookingsByCustomer: (customerId: string) => Booking[];
  getBookingsByBraider: (braiderId: string) => Booking[];
  getBookingById: (bookingId: string) => Booking | undefined;
}

export const useBookingStore = create<BookingState>((set, get) => ({
      bookings: [],
      serviceId: null,
      appointmentDate: null,
      locationAddress: null,
      notes: null,
      
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

      createBooking: (booking) => {
        const newBooking: Booking = {
          id: `booking_${Date.now()}`,
          ...booking,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }));
        
        return newBooking;
      },

      updateBookingStatus: (bookingId, status) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId
              ? { ...b, status, updated_at: new Date().toISOString() }
              : b
          ),
        }));
      },

      getBookingsByCustomer: (customerId) => {
        return get().bookings.filter((b) => b.customer_id === customerId);
      },

      getBookingsByBraider: (braiderId) => {
        return get().bookings.filter((b) => b.braider_id === braiderId);
      },

      getBookingById: (bookingId) => {
        return get().bookings.find((b) => b.id === bookingId);
      },
    }));
