-- Add new role columns to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_data_entry boolean DEFAULT false;

-- Create function to check if user is super admin
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

-- Drop existing functions with all possible parameter combinations
-- to avoid the "cannot change name of input parameter" error
DROP FUNCTION IF EXISTS get_users_with_admin_status();
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean);
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean, boolean);
DROP FUNCTION IF EXISTS update_user_roles(uuid, boolean, boolean, boolean, boolean);

-- Update get_users_with_admin_status function to include all roles
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  is_financial_auditor boolean,
  is_super_admin boolean,
  is_data_entry boolean,
  last_sign_in_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if current user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Only super administrators can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    users.id,
    users.email::text,
    COALESCE(admin_users.is_admin, false) as is_admin,
    COALESCE(admin_users.is_financial_auditor, false) as is_financial_auditor,
    COALESCE(admin_users.is_super_admin, false) as is_super_admin,
    COALESCE(admin_users.is_data_entry, false) as is_data_entry,
    users.last_sign_in_at
  FROM auth.users users
  LEFT JOIN admin_users ON users.id = admin_users.id
  ORDER BY users.email;
END;
$$;

-- Create function to update user roles
CREATE OR REPLACE FUNCTION update_user_roles(
  p_user_id uuid,
  p_is_admin boolean,
  p_is_financial_auditor boolean,
  p_is_data_entry boolean,
  p_is_super_admin boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_email text;
  current_user_id uuid;
  v_is_super_admin boolean;
BEGIN
  -- Get current user's ID
  current_user_id := auth.uid();
  
  -- Get target user's email
  SELECT email INTO target_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Check if target user is system admin
  IF target_user_email = 'fucurl@gmail.com' THEN
    RAISE EXCEPTION 'Cannot modify system administrator privileges';
  END IF;

  -- Check if current user is super admin
  SELECT is_super_admin INTO v_is_super_admin
  FROM admin_users
  WHERE id = current_user_id;
  
  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Only super administrators can modify user permissions';
  END IF;

  -- Check if target user exists
  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update admin_users table
  INSERT INTO admin_users (
    id, 
    is_admin, 
    is_financial_auditor, 
    is_data_entry, 
    is_super_admin, 
    updated_by
  )
  VALUES (
    p_user_id, 
    p_is_admin, 
    p_is_financial_auditor, 
    p_is_data_entry, 
    p_is_super_admin, 
    current_user_id
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = EXCLUDED.is_admin,
    is_financial_auditor = EXCLUDED.is_financial_auditor,
    is_data_entry = EXCLUDED.is_data_entry,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

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

  RETURN true;
END;
$$;

-- Set fucurl@gmail.com as super_admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID for fucurl@gmail.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fucurl@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Set super_admin status in admin_users table
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

-- Update financial_audit RLS policies to include super_admin
DROP POLICY IF EXISTS "Enable insert for admin and financial auditors" ON financial_audit;
DROP POLICY IF EXISTS "Enable update for admin and financial auditors" ON financial_audit;

CREATE POLICY "Enable insert for admin and financial auditors"
  ON financial_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_financial_auditor = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Enable update for admin and financial auditors"
  ON financial_audit
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_financial_auditor = true OR is_super_admin = true)
    )
  );

-- Update financial_audit trigger function to include super_admin
DROP TRIGGER IF EXISTS financial_audit_update ON financial_audit;
DROP FUNCTION IF EXISTS handle_financial_audit_update();

CREATE OR REPLACE FUNCTION handle_financial_audit_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_is_authorized boolean;
  v_company_name text;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user is admin, financial auditor, or super admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = v_user_id 
    AND (is_admin = true OR is_financial_auditor = true OR is_super_admin = true)
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Only administrators, financial auditors, and super admins can modify financial audit data';
  END IF;
  
  -- Get company name
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = NEW.company_id;
  
  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
  
  -- Set company name
  NEW.company := v_company_name;
  
  -- Calculate net_total_sales with proper NULL handling
  NEW.net_total_sales := NEW.total_sales - (
    COALESCE(NEW.deduction_operating, 0) + 
    COALESCE(NEW.deduction_transportation, 0) + 
    COALESCE(NEW.deduction_general, 0) + 
    COALESCE(NEW.deduction_custom_amount, 0)
  );
  
  -- Set updated_by
  NEW.updated_by := v_user_id;
  
  -- Only set updated_at if it's not already set by the client
  -- This prevents the recursive trigger call
  IF NEW.updated_at IS NULL THEN
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER financial_audit_update
  BEFORE INSERT OR UPDATE ON financial_audit
  FOR EACH ROW
  EXECUTE FUNCTION handle_financial_audit_update();