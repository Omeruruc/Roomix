/*
  # Fix get_user_emails function type mismatch

  1. Changes
    - Drop and recreate get_user_emails function with correct return type
    - Ensure email is cast to text type
    - Add proper security definer and stability settings

  2. Security
    - Function runs with security definer to access user emails
    - Access restricted to authenticated users
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_emails;

-- Recreate function with correct return type
CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text
) 
SECURITY DEFINER
STABLE
LANGUAGE sql
AS $$
  SELECT 
    id,
    email::text
  FROM auth.users
  WHERE id = ANY(user_ids);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails TO authenticated;