/*
  # Update study timer RLS policies

  1. Changes
    - Drop existing RLS policies for study_timers table
    - Create new, more specific policies for each operation type
    - Ensure users can only manage their own timers
    - Allow users to view timers in rooms they are members of

  2. Security
    - Policies ensure users can only:
      - Create timers for themselves
      - Update their own timers
      - Delete their own timers
      - View timers in rooms they are members of
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own timers" ON study_timers;
DROP POLICY IF EXISTS "Users can view timers in their rooms" ON study_timers;

-- Create new specific policies
CREATE POLICY "Enable insert for authenticated users only on their own timers"
ON study_timers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users on their own timers"
ON study_timers FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users on their own timers"
ON study_timers FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for users in the same room"
ON study_timers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM room_users
    WHERE room_users.room_id = study_timers.room_id
    AND room_users.user_id = auth.uid()
  )
);