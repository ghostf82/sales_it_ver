/*
  # Fix admin status handling
  
  1. Changes
    - Update user metadata when changing admin status
    - Ensure JWT claims are updated
    - Add proper error handling
    
  2. Security
    - Maintain existing security checks
    - Update user metadata safely
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_user_admin_status;

-- Create improved function to update user admin status
CREATE OR REPLACE FUNCTION update_user_admin_status(
  target_user_email text,
  admin_status boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    RAISE EXCEPTION 'Only administrators can modify user permissions';
  END IF;

  -- Check if target user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update admin_users table
  INSERT INTO admin_users (id, is_admin, updated_by)
  VALUES (target_user_id, admin_status, current_user_id)
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = EXCLUDED.is_admin,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
    jsonb_build_object('is_admin', admin_status)
  WHERE id = target_user_id;

END;
$$;