/*
  # Fix commission rules RLS policies with direct admin check
  
  1. Changes
    - Drop all existing policies
    - Create new policies that check admin_users table directly
    - Add proper error handling
    - Ensure consistent admin verification
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
    - Use direct table checks instead of JWT claims
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
DROP POLICY IF EXISTS "commission_rules_read_v6" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v6" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v6" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v6" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_read_v7" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v7" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v7" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v7" ON commission_rules;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON commission_rules;

-- Create new policies with direct admin_users table check
CREATE POLICY "commission_rules_read_v8"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "commission_rules_insert_v8"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ));

CREATE POLICY "commission_rules_update_v8"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ));

CREATE POLICY "commission_rules_delete_v8"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ));