/*
  # Fix ambiguous ID reference in get_users_with_admin_status function

  1. Changes
    - Drop and recreate the get_users_with_admin_status function
    - Explicitly specify table names for id columns to resolve ambiguity
    - Maintain existing functionality while fixing the column reference issue

  2. Security
    - Function remains accessible to authenticated users only
    - No changes to existing security policies
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_users_with_admin_status();

-- Recreate the function with explicit column references
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

-- Set proper permissions
REVOKE ALL ON FUNCTION public.get_users_with_admin_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_with_admin_status() TO authenticated;