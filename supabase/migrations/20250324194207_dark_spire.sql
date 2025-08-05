/*
  # Fix commission rules admin check
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper admin checks
    - Update trigger function to handle admin verification
    - Add proper error handling
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
*/

-- Drop existing policies
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
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
      AND id IS NOT NULL
    )
  );

CREATE POLICY update_commission_rules
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
      AND id IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
      AND id IS NOT NULL
    )
  );

CREATE POLICY delete_commission_rules
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
      AND id IS NOT NULL
    )
  );

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_updated_by ON commission_rules;
DROP FUNCTION IF EXISTS handle_updated_by;

-- Create trigger function
CREATE OR REPLACE FUNCTION handle_updated_by()
RETURNS TRIGGER AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check admin status first
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_admin = true
    AND id IS NOT NULL
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can modify commission rules';
  END IF;

  -- Set updated_by and updated_at
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER set_updated_by
  BEFORE INSERT OR UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_by();