/*
  # Create storage bucket for message images

  1. Storage Setup
    - Creates 'message-images' bucket for storing chat images
    - Enables public access for viewing images
    - Restricts uploads to authenticated users only

  Note: Policies are already created in a previous migration
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;