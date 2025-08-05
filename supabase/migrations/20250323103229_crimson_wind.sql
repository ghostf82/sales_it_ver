/*
  # Update collection handling schema
  
  1. Changes
    - Create collection_records table to track collection amounts per representative/company/year
    - Add constraints to ensure unique collection records
    - Add RLS policies for proper access control
    
  2. Security
    - Only admins can modify collection records
    - All authenticated users can view collection records
*/

-- Create collection_records table
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

-- Policies for collection_records
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

-- Function to handle collection record updates
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