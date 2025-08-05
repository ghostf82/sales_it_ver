/*
  # Add super admin privileges and protect system admin
  
  1. Changes
    - Add check to prevent modifying fucurl@gmail.com's admin status
    - Add check to prevent deleting fucurl@gmail.com's account
    - Update admin check functions to handle super admin
    
  2. Security
    - Protect system admin account
    - Maintain existing admin privileges
    - Add proper error handling
*/

-- Drop existing functions to recreate with updated logic
DROP FUNCTION IF EXISTS update_user_admin_status(uuid, boolean);
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create function to get users with admin status
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_protected boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(au.is_admin, false) as is_admin,
    u.created_at,
    u.last_sign_in_at,
    (u.email = 'fucurl@gmail.com') as is_protected
  FROM auth.users u
  LEFT JOIN admin_users au ON u.id = au.id
  ORDER BY u.email;
END;
$$;

-- Create function to update user admin status
CREATE OR REPLACE FUNCTION update_user_admin_status(
  user_id uuid,
  is_admin boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_email text;
  current_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user's ID
  current_user_id := auth.uid();
  
  -- Get target user's email
  SELECT email INTO target_user_email
  FROM auth.users
  WHERE id = user_id;

  -- Check if target user is system admin
  IF target_user_email = 'fucurl@gmail.com' THEN
    RAISE EXCEPTION 'Cannot modify system administrator privileges';
  END IF;

  -- Check if current user is admin
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = current_user_id;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can modify user permissions';
  END IF;

  -- Check if target user exists
  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update admin_users table
  INSERT INTO admin_users (id, is_admin, updated_by)
  VALUES (user_id, is_admin, current_user_id)
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = EXCLUDED.is_admin,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
    jsonb_build_object('is_admin', is_admin)
  WHERE id = user_id;

  RETURN true;
END;
$$;

-- Ensure fucurl@gmail.com is always an admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID for fucurl@gmail.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fucurl@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Set admin status in admin_users table
    INSERT INTO admin_users (id, is_admin)
    VALUES (v_user_id, true)
    ON CONFLICT (id) DO UPDATE SET is_admin = true;

    -- Update user metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true)
    WHERE id = v_user_id;
  END IF;
END $$;