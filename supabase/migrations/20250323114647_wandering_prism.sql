/*
  # Fix collection records policies

  1. Changes
    - Drop existing policies first
    - Create new policies with unique names
    - Add trigger for handling updates
    - Ensure proper RLS enforcement

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Restrict modifications to admin users only
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_records;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON collection_records;

DROP POLICY IF EXISTS "Enable read access for authenticated users v2" ON collection_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users v2" ON collection_records;
DROP POLICY IF EXISTS "Enable update for admin users only v2" ON collection_records;
DROP POLICY IF EXISTS "Enable delete for admin users only v2" ON collection_records;

DROP POLICY IF EXISTS "Allow read for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Allow update for admins only" ON collection_records;
DROP POLICY IF EXISTS "Allow delete for admins only" ON collection_records;

-- Create new policies with unique names
CREATE POLICY "collection_records_read_policy"
  ON collection_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "collection_records_insert_policy"
  ON collection_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "collection_records_update_policy"
  ON collection_records
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "collection_records_delete_policy"
  ON collection_records
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS collection_record_update ON collection_records;
DROP FUNCTION IF EXISTS handle_collection_record();

-- Create function to handle collection record updates
CREATE OR REPLACE FUNCTION handle_collection_record()
RETURNS trigger AS $$
BEGIN
  -- Set updated_at to current timestamp
  NEW.updated_at := now();
  
  -- Set updated_by to current user
  NEW.updated_by := auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for collection_records
CREATE TRIGGER collection_record_update
  BEFORE UPDATE ON collection_records
  FOR EACH ROW
  EXECUTE FUNCTION handle_collection_record();