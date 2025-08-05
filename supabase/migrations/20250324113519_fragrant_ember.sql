/*
  # Fix commission rules RLS policies
  
  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create new policies with proper admin checks
    - Use explicit boolean casting and null handling
    
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
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON commission_rules;

-- Create new policies with proper admin checks
CREATE POLICY "commission_rules_read_v5"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "commission_rules_insert_v5"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE 
      WHEN current_setting('request.jwt.claims', true) IS NULL THEN false
      WHEN current_setting('request.jwt.claims', true) = '' THEN false
      ELSE ((current_setting('request.jwt.claims', true)::jsonb)->>'is_admin')::boolean
    END
  );

CREATE POLICY "commission_rules_update_v5"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN current_setting('request.jwt.claims', true) IS NULL THEN false
      WHEN current_setting('request.jwt.claims', true) = '' THEN false
      ELSE ((current_setting('request.jwt.claims', true)::jsonb)->>'is_admin')::boolean
    END
  )
  WITH CHECK (
    CASE 
      WHEN current_setting('request.jwt.claims', true) IS NULL THEN false
      WHEN current_setting('request.jwt.claims', true) = '' THEN false
      ELSE ((current_setting('request.jwt.claims', true)::jsonb)->>'is_admin')::boolean
    END
  );

CREATE POLICY "commission_rules_delete_v5"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    CASE 
      WHEN current_setting('request.jwt.claims', true) IS NULL THEN false
      WHEN current_setting('request.jwt.claims', true) = '' THEN false
      ELSE ((current_setting('request.jwt.claims', true)::jsonb)->>'is_admin')::boolean
    END
  );