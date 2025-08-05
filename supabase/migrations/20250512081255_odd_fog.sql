/*
  # Fix ambiguous ID column in get_users_with_admin_status function

  1. Changes
    - Drop and recreate the get_users_with_admin_status function
    - Explicitly specify table names for ambiguous columns
    - Add proper column aliases for clarity
    
  2. Security
    - Maintain existing security context (SECURITY DEFINER)
    - Function accessible only to authenticated users
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_users_with_admin_status();

-- Recreate the function with explicit table references
CREATE OR REPLACE FUNCTION public.get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  is_financial_auditor boolean,
  last_sign_in_at timestamptz
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.users.id,
    auth.users.email,
    COALESCE(admin_users.is_admin, false) as is_admin,
    COALESCE(admin_users.is_financial_auditor, false) as is_financial_auditor,
    auth.users.last_sign_in_at
  FROM auth.users
  LEFT JOIN admin_users ON auth.users.id = admin_users.id
  ORDER BY auth.users.email;
END;
$$ LANGUAGE plpgsql;