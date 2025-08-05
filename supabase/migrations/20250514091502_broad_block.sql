-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow super admin read all users" ON auth.users;
DROP POLICY IF EXISTS "Allow read for audit page" ON financial_audit;
DROP POLICY IF EXISTS "Allow super admin read" ON financial_audit;

-- Add RLS policy for users table to allow financial auditors to read user data
CREATE POLICY "Allow super admin read all users"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- Add RLS policy for financial_audit table
CREATE POLICY "Allow read for audit page"
  ON financial_audit
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Add RLS policy for super admin to read financial_audit
CREATE POLICY "Allow super admin read"
  ON financial_audit
  FOR SELECT
  TO public
  USING (
    auth.uid() IN (
      SELECT admin_users.id
      FROM admin_users
      WHERE admin_users.is_super_admin = true
    )
  );

-- Add salesperson_name column to financial_audit if it doesn't exist
ALTER TABLE financial_audit
ADD COLUMN IF NOT EXISTS salesperson_name text;

-- Create trigger to update salesperson_name
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_updated_at_trigger ON financial_audit;

-- Create trigger
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON financial_audit
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();