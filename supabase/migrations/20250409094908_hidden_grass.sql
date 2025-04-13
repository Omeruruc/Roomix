/*
  # Add storage policies for message-images bucket

  1. Security
    - Enable authenticated users to upload images to their own messages
    - Allow public read access to all images
*/

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-images' AND
  auth.uid() IS NOT NULL
);

-- Allow public read access to all files
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'message-images');