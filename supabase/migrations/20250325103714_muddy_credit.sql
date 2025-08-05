/*
  # Fix commission rules RLS policies
  
  1. Changes
    - Update policies to use JWT claims for admin check
    - Simplify admin verification logic
    - Remove dependency on admin_users table for policy checks
    
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

-- Create new policies with JWT claim checks
CREATE POLICY read_commission_rules
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY insert_commission_rules
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true);

CREATE POLICY update_commission_rules
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true)
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true);

CREATE POLICY delete_commission_rules
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean = true);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_updated_by ON commission_rules;
DROP FUNCTION IF EXISTS handle_updated_by CASCADE;

-- Create trigger function with JWT claim check
CREATE OR REPLACE FUNCTION handle_updated_by()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check admin status using JWT claim
  IF NOT (current_setting('request.jwt.claims', true)::jsonb->>'is_admin')::boolean THEN
    RAISE EXCEPTION 'Only administrators can modify commission rules';
  END IF;
  
  -- Set updated_by and updated_at
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER set_updated_by
  BEFORE INSERT OR UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_by();