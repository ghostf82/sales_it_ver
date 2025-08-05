/*
  # Update get_users_with_admin_status function to require super admin privileges
  
  1. Changes
    - Update the function to check for super admin privileges instead of just admin
    - Maintain existing column structure and return types
    - Use proper table aliases to avoid ambiguity
    
  2. Security
    - Only super admins can view the user list
    - Maintain existing security settings
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create improved function with super admin check
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  is_financial_auditor boolean,
  is_super_admin boolean,
  last_sign_in_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تأكد أن المستخدم الحالي يملك صلاحية super_admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Only super administrators can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(au.is_admin, false) as is_admin,
    COALESCE(au.is_financial_auditor, false) as is_financial_auditor,
    COALESCE(au.is_super_admin, false) as is_super_admin,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN admin_users au ON u.id = au.id
  ORDER BY u.email;
END;
$$;