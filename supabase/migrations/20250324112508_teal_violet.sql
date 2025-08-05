/*
  # Fix commission rules policies
  
  1. Changes
    - Drop all existing policies
    - Create new policies with unique names
    - Use proper admin checks
    
  2. Security
    - Only admins can modify rules
    - All authenticated users can read rules
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
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON commission_rules;

-- Create new policies with unique names and proper admin checks
CREATE POLICY "commission_rules_read_v2"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "commission_rules_insert_v2"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "commission_rules_update_v2"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_admin')::boolean,
      false
    ) = true
  )
  WITH CHECK (
    coalesce(
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "commission_rules_delete_v2"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    coalesce(
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_admin')::boolean,
      false
    ) = true
  );