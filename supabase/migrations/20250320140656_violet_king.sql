/*
  # Fix collection_total RLS policies

  1. Changes
    - Update RLS policies for collection_total table
    - Add proper handling for updated_by field
    - Ensure admin users can modify collection totals

  2. Security
    - Maintain read access for all authenticated users
    - Restrict write operations to admin users
    - Track who last modified the collection total
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_total;
DROP POLICY IF EXISTS "Enable insert/update for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON collection_total;

-- Create new policies for collection_total
CREATE POLICY "Enable read access for authenticated users"
  ON collection_total
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users only"
  ON collection_total
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'is_admin'::text) = 'true'::text AND
    auth.uid() = updated_by
  );

CREATE POLICY "Enable update for admin users only"
  ON collection_total
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'is_admin'::text) = 'true'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'is_admin'::text) = 'true'::text AND
    auth.uid() = updated_by
  );

CREATE POLICY "Enable delete for admin users only"
  ON collection_total
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

-- Create or replace function to handle collection total updates
CREATE OR REPLACE FUNCTION handle_collection_total()
RETURNS trigger AS $$
BEGIN
  -- Set updated_by to current user if not provided
  IF NEW.updated_by IS NULL THEN
    NEW.updated_by := auth.uid();
  END IF;
  
  -- Set updated_at to current timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for collection_total
DROP TRIGGER IF EXISTS collection_total_admin_check ON collection_total;
CREATE TRIGGER collection_total_admin_check
  BEFORE INSERT OR UPDATE ON collection_total
  FOR EACH ROW
  EXECUTE FUNCTION handle_collection_total();