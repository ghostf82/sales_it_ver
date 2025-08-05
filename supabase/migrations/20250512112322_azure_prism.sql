/*
  # Fix update_user_roles function
  
  1. Changes
    - Drop all existing versions of the function
    - Create new function with explicit parameter names
    - Fix ambiguous column references
    - Add proper error handling
    
  2. Security
    - Maintain SECURITY DEFINER
    - Only super admins can modify user roles
    - Protect system admin account
*/

-- Drop all existing versions of the function with different parameter lists
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean);
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean, boolean);
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean, boolean, boolean);
DROP FUNCTION IF EXISTS update_user_roles(p_user_id uuid, p_is_admin boolean, p_is_financial_auditor boolean, p_is_data_entry boolean, p_is_super_admin boolean);

-- Create new function with explicit parameter names and table references
CREATE OR REPLACE FUNCTION update_user_roles(
  p_user_id uuid,
  p_is_admin boolean,
  p_is_financial_auditor boolean,
  p_is_data_entry boolean,
  p_is_super_admin boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_is_super_admin boolean;
  v_target_email text;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Check if current user is super admin
  SELECT admin_users.is_super_admin INTO v_is_super_admin
  FROM admin_users
  WHERE admin_users.id = v_current_user_id;
  
  IF NOT COALESCE(v_is_super_admin, false) THEN
    RAISE EXCEPTION 'Only super administrators can modify user roles';
  END IF;
  
  -- Get target user email
  SELECT auth.users.email INTO v_target_email
  FROM auth.users
  WHERE auth.users.id = p_user_id;
  
  -- Check if target user exists
  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if target user is system admin (fucurl@gmail.com)
  IF v_target_email = 'fucurl@gmail.com' AND NOT p_is_super_admin THEN
    RAISE EXCEPTION 'Cannot remove super admin privileges from system administrator';
  END IF;

  -- Check if user exists in admin_users
  IF EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = p_user_id) THEN
    -- Update existing user
    UPDATE admin_users
    SET 
      is_admin = p_is_admin,
      is_financial_auditor = p_is_financial_auditor,
      is_data_entry = p_is_data_entry,
      is_super_admin = p_is_super_admin,
      updated_at = now(),
      updated_by = v_current_user_id
    WHERE admin_users.id = p_user_id;
  ELSE
    -- Insert new user
    INSERT INTO admin_users (
      id,
      is_admin,
      is_financial_auditor,
      is_data_entry,
      is_super_admin,
      updated_at,
      updated_by
    ) VALUES (
      p_user_id,
      p_is_admin,
      p_is_financial_auditor,
      p_is_data_entry,
      p_is_super_admin,
      now(),
      v_current_user_id
    );
  END IF;
    
  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
    jsonb_build_object(
      'is_admin', p_is_admin,
      'is_financial_auditor', p_is_financial_auditor,
      'is_data_entry', p_is_data_entry,
      'is_super_admin', p_is_super_admin
    )
  WHERE auth.users.id = p_user_id;
END;
$$;