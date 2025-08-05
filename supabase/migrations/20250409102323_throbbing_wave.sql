/*
  # Fix get_users_with_admin_status function
  
  1. Changes
    - Fix data type mismatch for email column
    - Add proper type casting
    - Maintain existing security settings
    
  2. Security
    - Keep SECURITY DEFINER
    - Maintain admin-only access check
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create improved function with proper type handling
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  last_sign_in_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    u.id,
    u.email::text,
    COALESCE(au.is_admin, false) as is_admin,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN admin_users au ON u.id = au.id
  ORDER BY u.email;
END;
$$;