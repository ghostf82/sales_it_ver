/*
  # Fix commission rules RLS policies
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper admin checks
    - Add trigger to handle updated_by/updated_at
    - Fix admin verification logic
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
*/

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS read_commission_rules ON commission_rules;
DROP POLICY IF EXISTS insert_commission_rules ON commission_rules;
DROP POLICY IF EXISTS update_commission_rules ON commission_rules;
DROP POLICY IF EXISTS delete_commission_rules ON commission_rules;

-- Create new policies with proper admin checks
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
    )
  );

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_updated_by ON commission_rules;
DROP FUNCTION IF EXISTS handle_updated_by CASCADE;

-- Create trigger function with admin check
CREATE OR REPLACE FUNCTION handle_updated_by()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check admin status
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = v_user_id;
  
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only administrators can modify commission rules';
  END IF;
  
  -- Set updated_by and updated_at
  NEW.updated_by := v_user_id;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER set_updated_by
  BEFORE INSERT OR UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_by();