/*
  # Add admin management capabilities for representative data

  1. Changes
    - Update RLS policies on representative_data table to:
      - Allow all authenticated users to read data
      - Allow all authenticated users to insert data
      - Only allow admin users to update/delete data
      
  2. Security
    - Maintain RLS enabled
    - Ensure proper admin-only access for modifications
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON representative_data;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON representative_data;
DROP POLICY IF EXISTS "Enable update for admin users only" ON representative_data;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON representative_data;

-- Create new policies
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