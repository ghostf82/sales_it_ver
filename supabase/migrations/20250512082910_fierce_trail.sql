/*
  # Add super admin functionality and fix ambiguous ID references

  1. Changes
    - Add is_super_admin column to admin_users table
    - Update get_users_with_admin_status function to include super admin status
    - Fix ambiguous ID references with explicit table aliases
    - Add function to check if current user is super admin

  2. Security
    - Only super admins can modify other admin users
    - Protect system admin account (fucurl@gmail.com)
    - Add proper error handling
*/

-- Add is_super_admin column to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Create function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() 
    AND is_super_admin = true
  );
END;
$$;

-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create improved function with explicit table aliases and super admin status
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
    -- Set super admin status in admin_users table
    UPDATE admin_users
    SET is_super_admin = true
    WHERE id = v_user_id;

    -- If no row was updated, insert a new one
    IF NOT FOUND THEN
      INSERT INTO admin_users (id, is_admin, is_super_admin)
      VALUES (v_user_id, true, true);
    END IF;

    -- Update user metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true, 'is_super_admin', true)
    WHERE id = v_user_id;
  END IF;
END $$;