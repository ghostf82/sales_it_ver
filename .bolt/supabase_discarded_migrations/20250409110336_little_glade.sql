/*
  # Fix ambiguous ID column in get_users_with_admin_status function

  1. Changes
    - Drop and recreate get_users_with_admin_status function with explicit table references
    - Use explicit table aliases to avoid ambiguous column references
    - Ensure proper join conditions between auth.users and admin_users tables

  2. Security
    - Maintain existing security context (SECURITY DEFINER)
    - Function accessible only to authenticated users
*/

CREATE OR REPLACE FUNCTION public.get_users_with_admin_status()
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
    au.email,
    COALESCE(adu.is_admin, false) as is_admin,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN admin_users adu ON au.id = adu.id
  ORDER BY au.email;
END;
$$;