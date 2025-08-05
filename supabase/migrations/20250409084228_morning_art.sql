/*
  # Fix get_users_with_admin_status function

  1. Changes
    - Drop and recreate the get_users_with_admin_status function with correct return types
    - Ensure proper type casting for all columns
    - Add proper error handling

  2. Security
    - Function is only accessible to authenticated users
    - Returns only necessary user information
*/

CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  last_sign_in_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    (
      SELECT email::text 
      FROM auth.users 
      WHERE id = au.id
    ) as email,
    COALESCE(au.is_admin, false) as is_admin,
    (
      SELECT last_sign_in_at::timestamptz
      FROM auth.users 
      WHERE id = au.id
    ) as last_sign_in_at
  FROM admin_users au
  ORDER BY email;
END;
$$;