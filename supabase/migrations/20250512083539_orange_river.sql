/*
  # Update get_users_with_admin_status function to require super admin privileges
  
  1. Changes
    - Drop existing function
    - Create new function that checks for super_admin privileges
    - Use explicit table aliases to avoid ambiguous column references
    
  2. Security
    - Only super admins can view user list
    - Maintain SECURITY DEFINER setting
    - Preserve proper search path
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
  -- تأكد من أن المستخدم الحالي يملك صلاحية super_admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Only super administrators can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,  -- ✅ حلّ المشكلة هنا
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