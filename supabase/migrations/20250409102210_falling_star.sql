/*
  # Fix ambiguous ID reference in get_users_with_admin_status function

  1. Changes
    - Drop and recreate the get_users_with_admin_status function with explicit table references
    - Use auth.users.id to avoid ambiguity with admin_users.id
    - Maintain existing functionality while fixing the column reference issue

  2. Security
    - Function remains accessible to authenticated users only
    - No changes to existing security policies
*/

CREATE OR REPLACE FUNCTION public.get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  last_sign_in_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.users.id,
    auth.users.email,
    COALESCE(admin_users.is_admin, false) as is_admin,
    auth.users.last_sign_in_at
  FROM auth.users
  LEFT JOIN admin_users ON auth.users.id = admin_users.id
  ORDER BY auth.users.email;
END;
$$;