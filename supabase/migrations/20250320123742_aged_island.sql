/*
  # Add Admin User Management

  1. Changes
    - Create admin_users table to track admin status
    - Add function to update user admin status
    - Grant admin privileges to fucurl@gmail.com
    - Add functions for user management

  2. Security
    - Only admins can manage other users
    - Protected functions with RLS
*/

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users table
CREATE POLICY "Enable read access for authenticated users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Enable update for admin users only"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

-- Function to update user admin status
CREATE OR REPLACE FUNCTION update_user_admin_status(
  target_user_email text,
  admin_status boolean,
  OUT success boolean,
  OUT message text
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  current_user_id uuid;
BEGIN
  -- Get the target user's ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_user_email;

  -- Get current user's ID
  current_user_id := auth.uid();

  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = current_user_id AND is_admin = true
  ) THEN
    success := false;
    message := 'Only administrators can modify user permissions';
    RETURN;
  END IF;

  -- Check if target user exists
  IF target_user_id IS NULL THEN
    success := false;
    message := 'User not found';
    RETURN;
  END IF;

  -- Update or insert admin status
  INSERT INTO admin_users (id, is_admin, updated_by)
  VALUES (target_user_id, admin_status, current_user_id)
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = EXCLUDED.is_admin,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  -- Update user metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
    jsonb_build_object('is_admin', admin_status)
  WHERE id = target_user_id;

  success := true;
  message := 'User admin status updated successfully';
END;
$$;

-- Function to get all users with their admin status
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  user_id uuid,
  email text,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    u.id as user_id,
    u.email,
    COALESCE(au.is_admin, false) as is_admin,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN admin_users au ON u.id = au.id
  ORDER BY u.email;
END;
$$;

-- Grant initial admin privileges to fucurl@gmail.com
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user ID for fucurl@gmail.com
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'fucurl@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Set admin status in admin_users table
    INSERT INTO admin_users (id, is_admin)
    VALUES (target_user_id, true)
    ON CONFLICT (id) DO UPDATE SET is_admin = true;

    -- Update user metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true)
    WHERE id = target_user_id;
  END IF;
END $$;