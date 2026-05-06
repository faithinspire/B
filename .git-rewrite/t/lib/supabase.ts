import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Helper to check if URL is valid
const isValidUrl = (url: string): boolean => {
  try {
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Create clients only if keys are available and URL is valid
export const supabase = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey && isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'customer' | 'braider' | 'admin';
          full_name: string;
          email: string;
          phone: string | null;
          phone_verified: boolean;
          avatar_url: string | null;
          default_location: unknown | null;
          default_address: string | null;
          preferred_contact: 'email' | 'sms' | 'in_app' | null;
          referral_code: string | null;
          referred_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      braider_profiles: {
        Row: {
          id: string;
          bio: string | null;
          travel_radius_miles: number;
          is_mobile: boolean;
          salon_address: string | null;
          cancellation_policy: string | null;
          working_hours: Record<string, { open: string; close: string }> | null;
          verification_status: 'unverified' | 'tier1_pending' | 'tier1_verified' | 'tier2_pending' | 'tier2_verified' | 'safety_badge_pro';
          persona_inquiry_id: string | null;
          checkr_candidate_id: string | null;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          rating_avg: number;
          rating_count: number;
          is_active: boolean;
          profile_approved: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['braider_profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['braider_profiles']['Row']>;
      };
      services: {
        Row: {
          id: string;
          braider_id: string;
          name: string;
          description: string | null;
          category: 'box_braids' | 'knotless' | 'cornrows' | 'locs' | 'twists' | 'kids' | 'other';
          duration_minutes: number;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['services']['Row']>;
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          braider_id: string;
          service_id: string;
          slot_id: string;
          appointment_date: string;
          location_address: string | null;
          location_coords: unknown | null;
          status: 'pending' | 'confirmed' | 'escrowed' | 'in_progress' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          total_amount: number;
          platform_fee: number;
          braider_payout: number;
          escrow_released: boolean;
          auto_release_at: string | null;
          notes: string | null;
          cancellation_reason: string | null;
          cancelled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Row']>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          braider_id: string;
          rating: number;
          comment: string | null;
          photos: string[] | null;
          is_flagged: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
      };
      disputes: {
        Row: {
          id: string;
          booking_id: string;
          raised_by: string;
          reason: 'service_not_delivered' | 'quality_issue' | 'safety_concern' | 'other';
          description: string;
          evidence_urls: string[] | null;
          status: 'open' | 'under_review' | 'resolved_refund' | 'resolved_partial' | 'resolved_released' | 'closed';
          admin_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['disputes']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['disputes']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: Record<string, unknown> | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
    };
  };
};
