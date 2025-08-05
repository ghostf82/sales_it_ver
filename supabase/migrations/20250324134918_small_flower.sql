/*
  # Update commission rules policies and triggers
  
  1. Changes
    - Enable RLS
    - Drop existing policies
    - Create new policies with proper admin checks
    - Add updated_by column
    - Add trigger to handle updated_by field
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
    - Ensure updated_by matches the authenticated user
*/

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS read_commission_rules ON commission_rules;
DROP POLICY IF EXISTS insert_commission_rules ON commission_rules;
DROP POLICY IF EXISTS update_commission_rules ON commission_rules;
DROP POLICY IF EXISTS delete_commission_rules ON commission_rules;

-- Create new policies
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
    updated_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.is_admin = true
    )
  );

CREATE POLICY update_commission_rules
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.is_admin = true
    )
  );

CREATE POLICY delete_commission_rules
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.is_admin = true
    )
  );

-- Add updated_by column if not exists
ALTER TABLE commission_rules
ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS set_updated_by ON commission_rules;
DROP FUNCTION IF EXISTS handle_updated_by;

-- Create trigger function
CREATE OR REPLACE FUNCTION handle_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_updated_by
BEFORE UPDATE ON commission_rules
FOR EACH ROW
EXECUTE FUNCTION handle_updated_by();