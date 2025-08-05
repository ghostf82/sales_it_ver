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

-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create improved function with explicit table aliases
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  is_financial_auditor boolean,
  last_sign_in_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    auth_users.id,
    auth_users.email::text,
    COALESCE(admin_users.is_admin, false) as is_admin,
    COALESCE(admin_users.is_financial_auditor, false) as is_financial_auditor,
    auth_users.last_sign_in_at
  FROM auth.users auth_users
  LEFT JOIN admin_users ON auth_users.id = admin_users.id
  ORDER BY auth_users.email;
END;
$$;