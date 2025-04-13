/*
  # Create secure function to access user emails
  
  1. New Functions
    - `get_user_emails` function that safely returns user email addresses
    
  2. Security
    - Function is only accessible to authenticated users
    - Returns only id and email for specified user IDs
*/

-- Create a secure function to get user emails
CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails(uuid[]) TO authenticated;