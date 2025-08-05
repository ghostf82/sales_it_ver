/*
  # Fix collection records and RLS policies
  
  1. Changes
    - Add month column to collection_records
    - Update unique constraint to include month
    - Fix RLS policies for representative_data
    
  2. Security
    - Allow all authenticated users to insert into representative_data
    - Only admins can update/delete representative_data
*/

-- Add month column to collection_records if it doesn't exist
ALTER TABLE collection_records 
ADD COLUMN IF NOT EXISTS month integer NOT NULL DEFAULT 1;

-- Add check constraint for valid months (1-12)
ALTER TABLE collection_records
ADD CONSTRAINT valid_month_range 
CHECK (month BETWEEN 1 AND 12);

-- Drop existing unique constraint if it exists
ALTER TABLE collection_records 
DROP CONSTRAINT IF EXISTS collection_records_representative_id_company_id_year_key;

-- Create new unique constraint including month
ALTER TABLE collection_records
ADD CONSTRAINT collection_records_representative_id_company_id_year_month_key
UNIQUE (representative_id, company_id, year, month);

-- Fix RLS policies for representative_data
ALTER TABLE representative_data ENABLE ROW LEVEL SECURITY;

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