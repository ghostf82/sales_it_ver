/*
  # Fix RLS policies for commission rules
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper admin checks
    - Ensure policies use correct JWT claim checks
    
  2. Security
    - Only admins can modify rules
    - All authenticated users can read rules
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON commission_rules;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON commission_rules;
DROP POLICY IF EXISTS "Enable update for admin users only" ON commission_rules;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_read_policy" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_policy" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_policy" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_policy" ON commission_rules;

-- Create new policies with proper admin checks
CREATE POLICY "commission_rules_read_policy"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "commission_rules_insert_policy"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "commission_rules_update_policy"
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

CREATE POLICY "commission_rules_delete_policy"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    coalesce(
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_admin')::boolean,
      false
    ) = true
  );