/*
  # Create collection total table
  
  1. Changes
    - Create collection_total table if not exists
    - Enable RLS
    - Add policies for access control
  
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

-- Add policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collection_total' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON collection_total
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collection_total' 
    AND policyname = 'Enable insert/update for admin users only'
  ) THEN
    CREATE POLICY "Enable insert/update for admin users only"
      ON collection_total
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
      WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);
  END IF;
END $$;