/*
  # Add message reactions support
  
  1. New Tables
    - `message_reactions`
      - `message_id` (uuid, references messages)
      - `user_id` (uuid, references auth.users)
      - `emoji` (text)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on message_reactions table
    - Add policies for authenticated users to manage their reactions
*/

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id uuid REFERENCES messages ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Allow users to see all reactions
CREATE POLICY "Users can view all reactions"
  ON message_reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to add their own reactions
CREATE POLICY "Users can add reactions"
  ON message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to remove their own reactions
CREATE POLICY "Users can remove their reactions"
  ON message_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);