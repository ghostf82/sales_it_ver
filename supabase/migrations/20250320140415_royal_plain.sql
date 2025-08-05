/*
  # Fix RLS policies and data handling

  1. Changes
    - Update RLS policies for collection_total table
    - Add trigger for updating collection_total
    - Fix policy for representative_data table

  2. Security
    - Ensure proper access control for admin users
    - Maintain data integrity with triggers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_total;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON collection_total;

-- Create new policies for collection_total
CREATE POLICY "Enable read access for authenticated users"
  ON collection_total
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert/update for admin users only"
  ON collection_total
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'is_admin'::text) = 'true'::text OR
    auth.uid() = updated_by
  )
  WITH CHECK (
    (auth.jwt() ->> 'is_admin'::text) = 'true'::text
  );

-- Create or replace function to handle collection total updates
CREATE OR REPLACE FUNCTION handle_collection_total()
RETURNS trigger AS $$
BEGIN
  -- Only allow admin users to modify collection_total
  IF NOT (current_setting('request.jwt.claims', true)::json ->> 'is_admin')::boolean THEN
    RAISE EXCEPTION 'Only admin users can modify collection total';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for collection_total
DROP TRIGGER IF EXISTS collection_total_admin_check ON collection_total;
CREATE TRIGGER collection_total_admin_check
  BEFORE INSERT OR UPDATE ON collection_total
  FOR EACH ROW
  EXECUTE FUNCTION handle_collection_total();

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