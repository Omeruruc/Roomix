/*
  # Create messages table for real-time chat

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `content` (text)
      - `user_id` (uuid, references auth.users)
      - `user_email` (text)

  2. Security
    - Enable RLS on messages table
    - Add policies for authenticated users to read all messages
    - Add policies for authenticated users to insert their own messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  content text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  user_email text NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all messages
CREATE POLICY "Users can read all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;