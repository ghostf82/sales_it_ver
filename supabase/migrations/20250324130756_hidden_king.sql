/*
  # Fix commission rules RLS policies and admin checks
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper admin checks
    - Add trigger to handle updated_by field
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
    - Track who last modified the rules
*/

-- Drop existing policies
DROP POLICY IF EXISTS "read_commission_rules" ON commission_rules;
DROP POLICY IF EXISTS "insert_commission_rules" ON commission_rules;
DROP POLICY IF EXISTS "update_commission_rules" ON commission_rules;
DROP POLICY IF EXISTS "delete_commission_rules" ON commission_rules;

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "read_commission_rules"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "insert_commission_rules"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() 
      AND au.is_admin = true
    )
  );

CREATE POLICY "update_commission_rules"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() 
      AND au.is_admin = true
    )
  );

CREATE POLICY "delete_commission_rules"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() 
      AND au.is_admin = true
    )
  );

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS commission_rule_update ON commission_rules;
DROP FUNCTION IF EXISTS handle_commission_rule_update();

-- Create function to handle commission rule updates
CREATE OR REPLACE FUNCTION handle_commission_rule_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission_rules
CREATE TRIGGER commission_rule_update
  BEFORE INSERT OR UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION handle_commission_rule_update();