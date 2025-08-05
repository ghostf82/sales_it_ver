/*
  # Fix categories table RLS policies
  
  1. Changes
    - Enable RLS on categories table
    - Add policies for CRUD operations
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
    
  2. Security
    - Maintain data integrity
    - Proper admin access checks
*/

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON categories;
DROP POLICY IF EXISTS "Enable update for admin users only" ON categories;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON categories;

-- Create new policies with proper admin checks
CREATE POLICY "Enable read access for authenticated users"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users only"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Enable update for admin users only"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Enable delete for admin users only"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );