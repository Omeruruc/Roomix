/*
  # Add image support to messages

  1. Changes
    - Add `image_url` column to messages table
    - Add `message_type` column to messages table to distinguish between text and image messages
*/

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text' 
CHECK (message_type IN ('text', 'image'));