/*
  # Fix RLS policies for data entry
  
  1. Changes
    - Update RLS policies for representative_data table
    - Update RLS policies for collection_records table
    - Allow authenticated users to insert data
    - Restrict updates/deletes to admin users only
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Allow insert for all authenticated users
    - Restrict update/delete to admin users only
*/

-- Fix representative_data policies
ALTER TABLE representative_data ENABLE ROW LEVEL SECURITY;

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
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Enable delete for admin users only"
  ON representative_data
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Fix collection_records policies
ALTER TABLE collection_records ENABLE ROW LEVEL SECURITY;

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
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Enable delete for admin users only"
  ON collection_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );