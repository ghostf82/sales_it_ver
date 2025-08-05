-- First drop all existing policies on financial_audit
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'financial_audit'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON financial_audit', policy_record.policyname);
  END LOOP;
END
$$;

-- Create new policies with proper role checks
CREATE POLICY "financial_audit_select_policy"
ON financial_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND (
      admin_users.is_admin = true OR
      admin_users.is_super_admin = true OR
      admin_users.is_financial_auditor = true
    )
  )
);

CREATE POLICY "financial_audit_insert_policy"
ON financial_audit
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND (
      admin_users.is_admin = true OR
      admin_users.is_super_admin = true OR
      admin_users.is_financial_auditor = true
    )
  )
);

CREATE POLICY "financial_audit_update_policy"
ON financial_audit
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND (
      admin_users.is_admin = true OR
      admin_users.is_super_admin = true OR
      admin_users.is_financial_auditor = true
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND (
      admin_users.is_admin = true OR
      admin_users.is_super_admin = true OR
      admin_users.is_financial_auditor = true
    )
  )
);

CREATE POLICY "financial_audit_delete_policy"
ON financial_audit
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND (
      admin_users.is_admin = true OR
      admin_users.is_super_admin = true
    )
  )
);

-- Update financial_audit trigger function to avoid accessing users table
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
  v_representative_name text;
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
  
  -- Get representative name
  SELECT name INTO v_representative_name
  FROM representatives
  WHERE id = NEW.representative_id;
  
  -- Set company and salesperson names
  NEW.company := COALESCE(NEW.company, v_company_name);
  NEW.salesperson_name := COALESCE(NEW.salesperson_name, v_representative_name);
  
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

-- Handle app_users table policies separately
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Check if app_users table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_users'
  ) THEN
    -- Enable RLS on app_users
    EXECUTE 'ALTER TABLE app_users ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies on app_users table
    FOR policy_record IN 
      SELECT policyname FROM pg_policies 
      WHERE tablename = 'app_users'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON app_users', policy_record.policyname);
    END LOOP;
    
    -- Create new policy for app_users table
    EXECUTE '
    CREATE POLICY "Users can read their own data"
    ON app_users
    FOR SELECT
    TO authenticated
    USING (
      (auth.uid() = id) OR
      (EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
        AND (
          admin_users.is_admin = true OR
          admin_users.is_super_admin = true OR
          admin_users.is_financial_auditor = true
        )
      ))
    )';
  END IF;
END $$;