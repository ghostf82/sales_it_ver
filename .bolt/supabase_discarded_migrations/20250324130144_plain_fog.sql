/*
  # Fix commission rules RLS policies
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper admin checks
    - Use EXISTS clause with admin_users table
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "commission_rules_read_v12" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v12" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v12" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v12" ON commission_rules;
DROP POLICY IF EXISTS "read_commission_rules" ON commission_rules;
DROP POLICY IF EXISTS "insert_commission_rules" ON commission_rules;
DROP POLICY IF EXISTS "update_commission_rules" ON commission_rules;
DROP POLICY IF EXISTS "delete_commission_rules" ON commission_rules;

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "commission_rules_read"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "commission_rules_insert"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

CREATE POLICY "commission_rules_update"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );

CREATE POLICY "commission_rules_delete"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_admin = true
    )
  );