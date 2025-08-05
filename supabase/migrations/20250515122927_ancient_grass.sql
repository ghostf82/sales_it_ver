-- Drop existing policies on financial_audit table
DROP POLICY IF EXISTS "financial_audit_select_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_insert_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_update_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_delete_policy" ON financial_audit;

-- Create new policies for financial_audit table
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

-- Enable RLS on app_users table if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_users'
  ) THEN
    EXECUTE 'ALTER TABLE app_users ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies on app_users table
    EXECUTE 'DROP POLICY IF EXISTS "Users can read their own data" ON app_users';
    EXECUTE 'DROP POLICY IF EXISTS "Super admin can read all users" ON app_users';
    
    -- Create new policies for app_users table
    EXECUTE '
    CREATE POLICY "Users can read their own data"
    ON app_users
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id OR
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
        AND (
          admin_users.is_admin = true OR
          admin_users.is_super_admin = true OR
          admin_users.is_financial_auditor = true
        )
      )
    )';
  END IF;
END $$;