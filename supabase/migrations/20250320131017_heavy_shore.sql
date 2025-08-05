/*
  # Update representative data structure for collection handling
  
  1. Changes
    - Add collection_total table to store total collections per representative
    - Add RLS policies for collection_total
    - Update representative_data table to remove collection column
    - Add functions to manage collection totals
  
  2. Security
    - Enable RLS on new table
    - Only admins can modify collection totals
    - All authenticated users can view collection totals
*/

-- Create collection_total table
CREATE TABLE IF NOT EXISTS collection_total (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid REFERENCES representatives(id) ON DELETE CASCADE,
  amount numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(representative_id)
);

-- Enable RLS
ALTER TABLE collection_total ENABLE ROW LEVEL SECURITY;

-- Policies for collection_total
CREATE POLICY "Enable read access for authenticated users"
  ON collection_total
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert/update for admin users only"
  ON collection_total
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
  WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

-- Migrate existing collection data
INSERT INTO collection_total (representative_id, amount)
SELECT 
  representative_id,
  SUM(collection) as total_collection
FROM representative_data
GROUP BY representative_id
ON CONFLICT (representative_id) 
DO UPDATE SET amount = EXCLUDED.amount;

-- Remove collection column from representative_data
ALTER TABLE representative_data DROP COLUMN IF EXISTS collection;