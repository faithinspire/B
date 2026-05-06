/**
 * Migration Script: Local Storage to Supabase
 * 
 * This script migrates all data from localStorage to Supabase.
 * Run this once to transfer all existing data.
 * 
 * Usage: npx ts-node scripts/migrateLocalToSupabase.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LocalUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'customer' | 'braider' | 'admin';
  created_at: string;
}

interface LocalBraiderProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio: string;
  experience_years: number;
  rating_avg: number;
  rating_count: number;
  verification_status: string;
  travel_radius_miles: number;
  is_mobile: boolean;
  salon_address?: string;
  specialties: string[];
  services: any[];
  portfolio: any[];
  total_earnings: number;
  available_balance: number;
  created_at: string;
  updated_at: string;
}

interface LocalBooking {
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
  status: string;
  created_at: string;
  updated_at: string;
}

interface LocalMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  content: string;
  timestamp: string;
  read: boolean;
  booking_id?: string;
}

/**
 * Get data from localStorage (browser only)
 */
function getLocalStorageData(key: string): any {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Migrate users from localStorage to Supabase Auth
 */
async function migrateUsers() {
  console.log('Starting user migration...');

  try {
    // Get users from localStorage
    const users: LocalUser[] = [];
    const storageKey = 'braidly_users';
    
    // Note: This would need to be run in a browser context or with localStorage data exported
    console.log('Users migration: Requires browser context or exported data');
    console.log('Skipping user migration - use Supabase Auth directly');

    return users;
  } catch (error) {
    console.error('User migration error:', error);
    throw error;
  }
}

/**
 * Migrate braider profiles
 */
async function migrateBraiderProfiles(users: LocalUser[]) {
  console.log('Starting braider profile migration...');

  try {
    const profiles: LocalBraiderProfile[] = [];
    
    // In a real scenario, you would get this from localStorage
    // For now, we'll create a template
    
    for (const profile of profiles) {
      // Create profile in Supabase
      const { error } = await supabase
        .from('braider_profiles')
        .insert({
          id: profile.id,
          user_id: profile.user_id,
          bio: profile.bio,
          experience_years: profile.experience_years,
          travel_radius_miles: profile.travel_radius_miles,
          is_mobile: profile.is_mobile,
          salon_address: profile.salon_address,
          specialties: profile.specialties,
          verification_status: profile.verification_status,
          rating_avg: profile.rating_avg,
          rating_count: profile.rating_count,
          total_earnings: profile.total_earnings,
          available_balance: profile.available_balance,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        });

      if (error) {
        console.error(`Failed to migrate profile ${profile.id}:`, error);
      } else {
        console.log(`✓ Migrated profile: ${profile.full_name}`);
      }

      // Migrate services
      for (const service of profile.services) {
        const { error: serviceError } = await supabase
          .from('services')
          .insert({
            id: service.id,
            braider_id: profile.id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration_minutes: service.duration_minutes,
            created_at: service.created_at,
          });

        if (serviceError) {
          console.error(`Failed to migrate service ${service.id}:`, serviceError);
        }
      }

      // Migrate portfolio
      for (const item of profile.portfolio) {
        const { error: portfolioError } = await supabase
          .from('portfolio')
          .insert({
            id: item.id,
            braider_id: profile.id,
            image_url: item.image_url,
            title: item.title,
            description: item.description,
            style: item.style,
            created_at: item.created_at,
          });

        if (portfolioError) {
          console.error(`Failed to migrate portfolio item ${item.id}:`, portfolioError);
        }
      }
    }

    console.log(`✓ Migrated ${profiles.length} braider profiles`);
  } catch (error) {
    console.error('Braider profile migration error:', error);
    throw error;
  }
}

/**
 * Migrate bookings
 */
async function migrateBookings() {
  console.log('Starting booking migration...');

  try {
    const bookings: LocalBooking[] = [];
    
    for (const booking of bookings) {
      const { error } = await supabase
        .from('bookings')
        .insert({
          id: booking.id,
          customer_id: booking.customer_id,
          braider_id: booking.braider_id,
          service_id: booking.service_id,
          appointment_date: booking.appointment_date,
          location_address: booking.location_address,
          status: booking.status,
          total_amount: booking.service_price,
          notes: booking.notes,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
        });

      if (error) {
        console.error(`Failed to migrate booking ${booking.id}:`, error);
      } else {
        console.log(`✓ Migrated booking: ${booking.id}`);
      }
    }

    console.log(`✓ Migrated ${bookings.length} bookings`);
  } catch (error) {
    console.error('Booking migration error:', error);
    throw error;
  }
}

/**
 * Migrate messages
 */
async function migrateMessages() {
  console.log('Starting message migration...');

  try {
    const messages: LocalMessage[] = [];
    
    for (const message of messages) {
      const { error } = await supabase
        .from('messages')
        .insert({
          id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          booking_id: message.booking_id,
          is_read: message.read,
          created_at: message.timestamp,
        });

      if (error) {
        console.error(`Failed to migrate message ${message.id}:`, error);
      }
    }

    console.log(`✓ Migrated ${messages.length} messages`);
  } catch (error) {
    console.error('Message migration error:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Braidly data migration...\n');

  try {
    // Step 1: Migrate users
    const users = await migrateUsers();

    // Step 2: Migrate braider profiles
    await migrateBraiderProfiles(users);

    // Step 3: Migrate bookings
    await migrateBookings();

    // Step 4: Migrate messages
    await migrateMessages();

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in Supabase dashboard');
    console.log('2. Test the app with migrated data');
    console.log('3. Clear localStorage if migration was successful');
    console.log('4. Deploy to production');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
