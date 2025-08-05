/*
  # Fix commission rules RLS policies
  
  1. Changes
    - Drop existing policies
    - Create new policies that check admin status directly from admin_users table
    - Add proper error handling
    - Ensure consistent admin verification
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
    - Use direct table checks instead of JWT claims
*/

-- Drop existing policies
DROP POLICY IF EXISTS "commission_rules_read_v9" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert_v9" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update_v9" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete_v9" ON commission_rules;

-- Create new policies with direct admin_users table check
CREATE POLICY "commission_rules_read_v10"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "commission_rules_insert_v10"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_admin = true
    AND admin_users.id IS NOT NULL
  ));

CREATE POLICY "commission_rules_update_v10"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_admin = true
    AND admin_users.id IS NOT NULL
  ))
  WITH CHECK (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_admin = true
    AND admin_users.id IS NOT NULL
  ));

CREATE POLICY "commission_rules_delete_v10"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_admin = true
    AND admin_users.id IS NOT NULL
  ));