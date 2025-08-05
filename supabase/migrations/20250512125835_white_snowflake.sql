/*
  # Fix Financial Audit RLS Policies

  1. Changes
    - Drop existing RLS policies for financial_audit table
    - Create new policies that properly handle financial auditor permissions
    - Add proper checks for admin, super admin, and financial auditor roles

  2. Security
    - Enable RLS on financial_audit table
    - Add policies for:
      - Insert: Allow financial auditors and admins
      - Update: Allow financial auditors and admins
      - Delete: Allow admins only
      - Select: Allow authenticated users with proper roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert by super admins only" ON financial_audit;
DROP POLICY IF EXISTS "Edit only by financial auditors or super admins" ON financial_audit;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON financial_audit;
DROP POLICY IF EXISTS "Enable insert for admin and financial auditors" ON financial_audit;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON financial_audit;
DROP POLICY IF EXISTS "Enable update for admin and financial auditors" ON financial_audit;
DROP POLICY IF EXISTS "Read for auditors and admins" ON financial_audit;

-- Create new policies with proper role checks
CREATE POLICY "financial_audit_insert_policy"
ON financial_audit
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND (
      is_admin = true OR
      is_super_admin = true OR
      is_financial_auditor = true
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
    WHERE id = auth.uid()
    AND (
      is_admin = true OR
      is_super_admin = true OR
      is_financial_auditor = true
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND (
      is_admin = true OR
      is_super_admin = true OR
      is_financial_auditor = true
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
    WHERE id = auth.uid()
    AND (
      is_admin = true OR
      is_super_admin = true
    )
  )
);

CREATE POLICY "financial_audit_select_policy"
ON financial_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND (
      is_admin = true OR
      is_super_admin = true OR
      is_financial_auditor = true
    )
  )
);