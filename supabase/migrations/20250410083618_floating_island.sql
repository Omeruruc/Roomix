/*
  # Add cascading deletes for room relationships

  1. Changes
    - Modify foreign key constraints to add ON DELETE CASCADE for:
      - messages.room_id -> rooms.id
      - room_users.room_id -> rooms.id
    
  2. Security
    - No changes to RLS policies
    - Existing table permissions remain unchanged
    
  Note: This migration drops and recreates the foreign key constraints to add
  cascading delete behavior. This ensures that when a room is deleted, all
  associated messages and room_user entries are automatically removed.
*/

-- Drop existing foreign key constraints
ALTER TABLE messages
DROP CONSTRAINT messages_room_id_fkey;

ALTER TABLE room_users
DROP CONSTRAINT room_users_room_id_fkey;

-- Recreate foreign key constraints with ON DELETE CASCADE
ALTER TABLE messages
ADD CONSTRAINT messages_room_id_fkey
FOREIGN KEY (room_id)
REFERENCES rooms(id)
ON DELETE CASCADE;

ALTER TABLE room_users
ADD CONSTRAINT room_users_room_id_fkey
FOREIGN KEY (room_id)
REFERENCES rooms(id)
ON DELETE CASCADE;