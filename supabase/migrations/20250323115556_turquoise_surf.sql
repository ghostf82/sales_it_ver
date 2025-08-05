/*
  # Create collection records table with RLS

  1. Changes
    - Create collection_records table with proper structure
    - Enable RLS
    - Add policies for CRUD operations
    - Add trigger for tracking updates

  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Allow insert for all authenticated users
    - Restrict update/delete to admin users only
    - Track all modifications
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
DROP POLICY IF EXISTS "collection_records_read_policy" ON collection_records;
DROP POLICY IF EXISTS "collection_records_insert_policy" ON collection_records;
DROP POLICY IF EXISTS "collection_records_update_policy" ON collection_records;
DROP POLICY IF EXISTS "collection_records_delete_policy" ON collection_records;

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