/*
  # Add month field to representative data
  
  1. Changes
    - Add month column to representative_data table
    - Add check constraint for valid month values
    - Update unique constraint to include month
    - Update trigger function for uniqueness check
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add month column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'representative_data' 
    AND column_name = 'month'
  ) THEN
    ALTER TABLE representative_data 
    ADD COLUMN month integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Drop existing unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_representative_category_year'
    AND table_name = 'representative_data'
  ) THEN
    ALTER TABLE representative_data 
    DROP CONSTRAINT unique_representative_category_year;
  END IF;
END $$;

-- Create unique index instead of constraint to avoid naming conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_representative_category_year_month 
ON representative_data (representative_id, category, year, month);

-- Update function to check for existing entries
CREATE OR REPLACE FUNCTION check_representative_category()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM representative_data 
    WHERE representative_id = NEW.representative_id 
    AND category = NEW.category
    AND year = NEW.year
    AND month = NEW.month
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Category already exists for this representative in the selected year and month'
      USING HINT = 'Each representative can only have one entry per category per year per month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;