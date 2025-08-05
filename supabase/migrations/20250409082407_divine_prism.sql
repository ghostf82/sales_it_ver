/*
  # Fix admin toggle function
  
  1. Changes
    - Drop existing functions
    - Create new function with proper parameters
    - Add proper error handling
    - Add system admin protection
    
  2. Security
    - Ensure only admins can modify user permissions
    - Prevent modification of system admin
    - Track who made the changes
*/

-- Drop existing functions with all parameter combinations
DROP FUNCTION IF EXISTS update_user_admin_status(uuid, boolean);
DROP FUNCTION IF EXISTS update_user_admin_status(text, boolean);

-- Create new function with updated signature and logic
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