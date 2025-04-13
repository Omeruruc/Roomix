/*
  # Add room management features
  
  1. Changes
    - Add max_users column to rooms table
    - Add update policies for room owners
*/

-- Add max_users column to rooms table
ALTER TABLE rooms
ADD COLUMN max_users integer NOT NULL DEFAULT 10
CHECK (max_users > 0 AND max_users <= 100);

-- Add room_users table to track users in rooms
CREATE TABLE IF NOT EXISTS room_users (
  room_id uuid REFERENCES rooms NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Enable RLS on room_users
ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;

-- Add policies for room_users
CREATE POLICY "Users can view room members"
  ON room_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join rooms"
  ON room_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add update policy for room owners
CREATE POLICY "Owners can update their rooms"
  ON rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);