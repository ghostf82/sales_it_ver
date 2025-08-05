/*
  # Add observer role functionality
  
  1. Changes
    - Add is_observer column to admin_users table
    - Update functions to handle observer role
    - Add observer role policies
    
  2. Security
    - Observers can view admin pages but cannot modify data
    - Only admins can assign observer role
*/

-- Add is_observer column to admin_users table
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS is_observer boolean DEFAULT false;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_users_with_admin_status();
DROP FUNCTION IF EXISTS update_user_admin_status(uuid, boolean);

-- Create function to get users with roles
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  is_observer boolean,
  last_sign_in_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if current user is admin or observer
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND (is_admin = true OR is_observer = true)
  ) THEN
    RAISE EXCEPTION 'Only administrators and observers can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(au.is_admin, false) as is_admin,
    COALESCE(au.is_observer, false) as is_observer,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN admin_users au ON u.id = au.id
  ORDER BY u.email;
END;
$$;

-- Create function to update user roles
CREATE OR REPLACE FUNCTION update_user_admin_status(
  user_id uuid,
  is_admin boolean,
  is_observer boolean DEFAULT false
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

  -- Cannot be both admin and observer
  IF is_admin AND is_observer THEN
    RAISE EXCEPTION 'User cannot be both admin and observer';
  END IF;

  -- Update admin_users table
  INSERT INTO admin_users (id, is_admin, is_observer, updated_by)
  VALUES (user_id, is_admin, is_observer, current_user_id)
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = EXCLUDED.is_admin,
    is_observer = EXCLUDED.is_observer,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
    jsonb_build_object(
      'is_admin', is_admin,
      'is_observer', is_observer
    )
  WHERE id = user_id;

  RETURN true;
END;
$$;