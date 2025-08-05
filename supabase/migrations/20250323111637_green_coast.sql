/*
  # Fix collection_records policies
  
  1. Changes
    - Add policy existence checks
    - Maintain existing table structure
    - Preserve security settings
  
  2. Security
    - Maintain RLS enabled
    - Ensure proper admin-only access for modifications
*/

-- Create collection_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS collection_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid REFERENCES representatives(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  year integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(representative_id, company_id, year)
);

-- Enable RLS
ALTER TABLE collection_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_records;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON collection_records;

-- Create new policies
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