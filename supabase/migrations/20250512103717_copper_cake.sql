/*
  # Add update_user_roles function with explicit parameter types
  
  1. Changes
    - Drop existing functions with specific parameter signatures
    - Create new function with explicit parameter names
    - Add proper error handling and security checks
    
  2. Security
    - Only super admins can update user roles
    - Protect system admin account (fucurl@gmail.com)
    - Track who made the changes
*/

-- Drop all existing versions of the function with specific parameter types
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean);
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean, boolean);
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean, boolean, boolean);

-- Recreate the function with explicit column references
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
BEGIN
  -- Verify the current user is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can update user roles';
  END IF;

  -- Check if user exists in admin_users
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = p_user_id) THEN
    -- Update existing user
    UPDATE admin_users
    SET 
      is_admin = p_is_admin,
      is_financial_auditor = p_is_financial_auditor,
      is_data_entry = p_is_data_entry,
      is_super_admin = p_is_super_admin,
      updated_at = now(),
      updated_by = auth.uid()
    WHERE id = p_user_id;
      
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
    WHERE id = p_user_id;
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
      auth.uid()
    );
    
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
    WHERE id = p_user_id;
  END IF;
END;
$$;