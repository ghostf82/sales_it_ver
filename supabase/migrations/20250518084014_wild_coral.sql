-- Drop existing policies
DROP POLICY IF EXISTS "financial_audit_select_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_insert_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_update_policy" ON financial_audit;
DROP POLICY IF EXISTS "financial_audit_delete_policy" ON financial_audit;
DROP POLICY IF EXISTS "Allow read for audit page" ON financial_audit;
DROP POLICY IF EXISTS "Allow super admin read" ON financial_audit;
DROP POLICY IF EXISTS "read_financial_audit" ON financial_audit;

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

-- Create a general read policy for authenticated users only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_audit' 
    AND policyname = 'read_financial_audit'
  ) THEN
    EXECUTE 'CREATE POLICY "read_financial_audit"
    ON financial_audit
    FOR SELECT
    TO authenticated
    USING ((
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
      )
    ) OR (
      auth.uid() = (
        SELECT users.id
        FROM auth.users
        WHERE (users.email)::text = ''fucurl@gmail.com''::text
      )
    ))';
  END IF;
END
$$;