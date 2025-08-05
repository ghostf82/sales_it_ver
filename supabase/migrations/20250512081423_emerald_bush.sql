/*
  # Fix user management functions
  
  1. Changes
    - Fix ambiguous column references in get_users_with_admin_status
    - Fix type mismatch for email column
    - Add is_super_admin field to admin_users table
    - Update RLS policies
    
  2. Security
    - Maintain existing security checks
    - Keep admin-only restrictions
*/

-- Add is_super_admin column to admin_users table if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create function to get users with admin status
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  is_financial_auditor boolean,
  is_super_admin boolean,
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
    users.id,
    users.email::text,
    COALESCE(admins.is_admin, false) as is_admin,
    COALESCE(admins.is_financial_auditor, false) as is_financial_auditor,
    COALESCE(admins.is_super_admin, false) as is_super_admin,
    users.last_sign_in_at
  FROM auth.users users
  LEFT JOIN admin_users admins ON users.id = admins.id
  ORDER BY users.email;
END;
$$;

-- Create function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean;
BEGIN
  SELECT is_super_admin INTO v_is_super_admin
  FROM admin_users
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_is_super_admin, false);
END;
$$;

-- Set fucurl@gmail.com as super admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID for fucurl@gmail.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fucurl@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Set admin and super_admin status in admin_users table
    INSERT INTO admin_users (id, is_admin, is_super_admin)
    VALUES (v_user_id, true, true)
    ON CONFLICT (id) DO UPDATE SET 
      is_admin = true,
      is_super_admin = true;

    -- Update user metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
      jsonb_build_object(
        'is_admin', true,
        'is_super_admin', true
      )
    WHERE id = v_user_id;
  END IF;
END $$;

-- Update admin_users policies to use is_super_admin function
DROP POLICY IF EXISTS "Allow read only for super admins" ON admin_users;
DROP POLICY IF EXISTS "Allow update by super admins" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for admin users only" ON admin_users;
DROP POLICY IF EXISTS "Super admin only can read admin_users" ON admin_users;

CREATE POLICY "Allow read only for super admins"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Allow update by super admins"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());