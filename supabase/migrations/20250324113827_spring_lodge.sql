/*
  # Fix commission rules RLS policies
  
  1. Changes
    - Drop all existing policies
    - Create new policies with simplified admin checks
    - Use explicit boolean casting
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON commission_rules;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON commission_rules;
DROP POLICY IF EXISTS "Enable update for admin users only" ON commission_rules;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_read_policy" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_policy" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_policy" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_policy" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_read_v2" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v2" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v2" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v2" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_read_v3" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v3" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v3" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v3" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_read_v4" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v4" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v4" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v4" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_read_v5" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v5" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v5" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v5" ON commission_rules;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON commission_rules;

-- Create new policies with simplified admin checks
CREATE POLICY "commission_rules_read_v6"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "commission_rules_insert_v6"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true
  );

CREATE POLICY "commission_rules_update_v6"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true
  );

CREATE POLICY "commission_rules_delete_v6"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true
  );