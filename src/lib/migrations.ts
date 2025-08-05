import { supabase } from './supabase';

export async function applyMigration() {
  const sql = `
    -- Enable RLS
    ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS read_commission_rules ON commission_rules;
    DROP POLICY IF EXISTS insert_commission_rules ON commission_rules;
    DROP POLICY IF EXISTS update_commission_rules ON commission_rules;
    DROP POLICY IF EXISTS delete_commission_rules ON commission_rules;

    -- Create new policies with proper admin checks
    CREATE POLICY read_commission_rules
      ON commission_rules
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY insert_commission_rules
      ON commission_rules
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE id = auth.uid() 
          AND is_admin = true
        )
      );

    CREATE POLICY update_commission_rules
      ON commission_rules
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE id = auth.uid() 
          AND is_admin = true
        )
      );

    CREATE POLICY delete_commission_rules
      ON commission_rules
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE id = auth.uid() 
          AND is_admin = true
        )
      );

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
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}