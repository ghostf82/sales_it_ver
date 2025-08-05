/*
  # Fix collection records structure and constraints
  
  1. Changes
    - Add month column to collection_records
    - Update unique constraint to include month
    - Add proper error handling
    - Add trigger for handling updates
    
  2. Security
    - Maintain existing RLS policies
    - Preserve existing data
*/

-- Add month column to collection_records if it doesn't exist
ALTER TABLE collection_records 
ADD COLUMN IF NOT EXISTS month integer NOT NULL DEFAULT 1;

-- Drop existing unique constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_monthly_collection'
  ) THEN
    ALTER TABLE collection_records DROP CONSTRAINT unique_monthly_collection;
  END IF;
END $$;

-- Create new unique constraint including month
ALTER TABLE collection_records
ADD CONSTRAINT unique_monthly_collection 
UNIQUE (representative_id, year, month);

-- Drop existing trigger and function if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'collection_record_update'
  ) THEN
    DROP TRIGGER collection_record_update ON collection_records;
  END IF;
END $$;

DROP FUNCTION IF EXISTS handle_collection_record CASCADE;

-- Create function to handle collection record updates
CREATE OR REPLACE FUNCTION handle_collection_record()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check admin status for updates
  IF TG_OP = 'UPDATE' THEN
    SELECT is_admin INTO v_is_admin
    FROM admin_users
    WHERE id = auth.uid();
    
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Only administrators can modify existing collection records';
    END IF;
  END IF;

  -- Validate dates
  IF NEW.year > EXTRACT(YEAR FROM CURRENT_DATE) OR 
    (NEW.year = EXTRACT(YEAR FROM CURRENT_DATE) AND 
     NEW.month > EXTRACT(MONTH FROM CURRENT_DATE)) THEN
    RAISE EXCEPTION 'Cannot enter collection records for future dates';
  END IF;

  -- Set updated_by and updated_at
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER collection_record_update
  BEFORE INSERT OR UPDATE ON collection_records
  FOR EACH ROW
  EXECUTE FUNCTION handle_collection_record();

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_collection_amount CASCADE;

-- Create function to get collection amount
CREATE OR REPLACE FUNCTION get_collection_amount(
  p_representative_id uuid,
  p_year integer,
  p_month integer
) 
RETURNS TABLE (
  collection_amount numeric,
  is_editable boolean
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = auth.uid();

  RETURN QUERY
  SELECT 
    cr.amount as collection_amount,
    COALESCE(v_is_admin, false) as is_editable
  FROM collection_records cr
  WHERE cr.representative_id = p_representative_id
    AND cr.year = p_year
    AND cr.month = p_month;
END;
$$;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_collection_records_lookup;
DROP INDEX IF EXISTS idx_collection_records_date;

-- Create indexes for performance
CREATE INDEX idx_collection_records_lookup 
ON collection_records (representative_id, year, month);

CREATE INDEX idx_collection_records_date 
ON collection_records (year, month);