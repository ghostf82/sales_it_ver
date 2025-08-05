/*
  # Redesign collection handling
  
  1. Changes
    - Drop collection column from representative_data
    - Update collection_records table structure
    - Add proper constraints and indexes
    - Update RLS policies
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Allow insert for authenticated users
    - Restrict updates to admin users only
*/

-- Drop collection column from representative_data if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'representative_data' 
    AND column_name = 'collection'
  ) THEN
    ALTER TABLE representative_data DROP COLUMN collection;
  END IF;
END $$;

-- Recreate collection_records table
DROP TABLE IF EXISTS collection_records;
CREATE TABLE collection_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid NOT NULL REFERENCES representatives(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_month_range CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT unique_representative_month UNIQUE (representative_id, year, month)
);

-- Enable RLS
ALTER TABLE collection_records ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger function to handle updates
CREATE OR REPLACE FUNCTION handle_collection_record()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check admin status
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = auth.uid();
  
  -- Only allow admins to update records
  IF TG_OP = 'UPDATE' AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can modify collection records';
  END IF;
  
  -- Set updated_by and updated_at
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER collection_record_update
  BEFORE UPDATE ON collection_records
  FOR EACH ROW
  EXECUTE FUNCTION handle_collection_record();