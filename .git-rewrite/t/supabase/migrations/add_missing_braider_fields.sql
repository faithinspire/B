-- Add missing fields to braider_profiles table
ALTER TABLE braider_profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- Ensure messages table has conversation_id and sender_role
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'customer';

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Ensure conversations table has proper structure
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS braider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_braider_id ON conversations(braider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);
