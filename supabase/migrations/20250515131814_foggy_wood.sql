-- Drop existing policies on financial_audit table
DROP POLICY IF EXISTS "financial_audit_select_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_insert_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_update_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_delete_policy" ON financial_audit;
DROP POLICY IF EXISTS "Allow read for audit page" ON financial_audit;
DROP POLICY IF EXISTS "Allow super admin read" ON financial_audit;

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

-- Add salesperson_name column to financial_audit if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'financial_audit'
    AND column_name = 'salesperson_name'
  ) THEN
    ALTER TABLE financial_audit ADD COLUMN salesperson_name text;
  END IF;
END $$;

-- Add company column to financial_audit if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'financial_audit'
    AND column_name = 'company'
  ) THEN
    ALTER TABLE financial_audit ADD COLUMN company text;
  END IF;
END $$;

-- Create or replace the trigger function to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at_trigger'
  ) THEN
    CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON financial_audit
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;