/*
  # Create rooms table and update messages

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamp)
      - `owner_id` (uuid, references auth.users)
      - `owner_email` (text)

  2. Changes
    - Create default room for existing messages
    - Add room_id to messages table
    - Update existing messages to use default room

  3. Security
    - Enable RLS on rooms table
    - Update policies for rooms and messages
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users NOT NULL,
  owner_email text NOT NULL
);

-- Create a default system user in auth.users if it doesn't exist
DO $$
DECLARE
  system_user_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
  -- Insert system user if it doesn't exist
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    system_user_id,
    'system@chat.local',
    'system',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default room owned by system user
  INSERT INTO rooms (
    id,
    name,
    password_hash,
    owner_id,
    owner_email,
    created_at
  )
  VALUES (
    system_user_id, -- Using same UUID for room id
    'General',
    'default',
    system_user_id,
    'system@chat.local',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Add room_id to messages with a default value
ALTER TABLE messages 
ADD COLUMN room_id uuid REFERENCES rooms;

-- Update existing messages to use the default room
UPDATE messages 
SET room_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE room_id IS NULL;

-- Make room_id NOT NULL after updating existing messages
ALTER TABLE messages 
ALTER COLUMN room_id SET NOT NULL;

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their rooms"
  ON rooms
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Update messages policies for room-based access
DROP POLICY IF EXISTS "Users can read all messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;

CREATE POLICY "Users can read messages in rooms they have access to"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true); -- We'll validate password access in the application layer

CREATE POLICY "Users can insert messages in rooms they have access to"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id); -- We'll validate password access in the application layer