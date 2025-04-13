/*
  # Add study timer functionality
  
  1. New Tables
    - `study_timers`
      - `user_id` (uuid, references auth.users)
      - `room_id` (uuid, references rooms)
      - `elapsed_time` (integer)
      - `is_running` (boolean)
      - `subject` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on study_timers table
    - Add policies for users to manage their own timers
    - Allow all authenticated users to view timers in their rooms
*/

CREATE TABLE IF NOT EXISTS study_timers (
  user_id uuid REFERENCES auth.users NOT NULL,
  room_id uuid REFERENCES rooms ON DELETE CASCADE NOT NULL,
  elapsed_time integer NOT NULL DEFAULT 0,
  is_running boolean NOT NULL DEFAULT false,
  subject text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, room_id)
);

ALTER TABLE study_timers ENABLE ROW LEVEL SECURITY;

-- Allow users to view all timers in rooms they're in
CREATE POLICY "Users can view timers in their rooms"
  ON study_timers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_users
      WHERE room_users.room_id = study_timers.room_id
      AND room_users.user_id = auth.uid()
    )
  );

-- Allow users to manage their own timers
CREATE POLICY "Users can manage their own timers"
  ON study_timers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_study_timers_updated_at
    BEFORE UPDATE ON study_timers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();