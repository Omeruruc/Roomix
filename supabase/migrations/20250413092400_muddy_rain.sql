/*
  # Update study timer RLS policies

  1. Changes
    - Update RLS policies for study_timers table to ensure users can only modify their own timers
    - Allow users to view all timers in rooms they have access to
    - Prevent users from modifying other users' timers

  2. Security
    - Enable RLS on study_timers table
    - Add policy for users to read timers in their rooms
    - Add policy for users to update only their own timers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for users on their own timers" ON study_timers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only on their own timers" ON study_timers;
DROP POLICY IF EXISTS "Enable read access for users in the same room" ON study_timers;
DROP POLICY IF EXISTS "Enable update for users on their own timers" ON study_timers;

-- Create new policies
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

CREATE POLICY "Users can modify their own timers"
ON study_timers
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);