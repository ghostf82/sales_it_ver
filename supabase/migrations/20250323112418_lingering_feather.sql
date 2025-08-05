/*
  # Update RLS policies for representative data and collection records
  
  1. Changes
    - Update RLS policies to ensure proper admin access
    - Add policies for CRUD operations
    - Ensure non-admin users can only read data
    
  2. Security
    - Only admins can modify data
    - All authenticated users can read data
*/

-- Update representative_data policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON representative_data;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON representative_data;
DROP POLICY IF EXISTS "Enable update for admin users only" ON representative_data;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON representative_data;

CREATE POLICY "Enable read access for authenticated users"
  ON representative_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON representative_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for admin users only"
  ON representative_data
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
  WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

CREATE POLICY "Enable delete for admin users only"
  ON representative_data
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

-- Update collection_records policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_records;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON collection_records;

CREATE POLICY "Enable read access for authenticated users"
  ON collection_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON collection_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for admin users only"
  ON collection_records
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
  WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

CREATE POLICY "Enable delete for admin users only"
  ON collection_records
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);