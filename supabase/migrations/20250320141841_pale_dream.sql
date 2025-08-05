/*
  # Add year field to representative data

  1. Changes
    - Add year column to representative_data table
    - Update unique constraint to include year
    - Update trigger function to check uniqueness with year
    - Backfill existing data with default year 2023

  2. Security
    - Maintain existing RLS policies
*/

-- Add year column
ALTER TABLE representative_data 
ADD COLUMN IF NOT EXISTS year integer NOT NULL DEFAULT 2023;

-- Drop existing unique constraint and trigger
ALTER TABLE representative_data 
DROP CONSTRAINT IF EXISTS unique_representative_category;

DROP TRIGGER IF EXISTS check_representative_category_trigger ON representative_data;

-- Create new unique constraint including year
ALTER TABLE representative_data
ADD CONSTRAINT unique_representative_category_year 
UNIQUE (representative_id, category, year);

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
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Category already exists for this representative in the selected year'
      USING HINT = 'Each representative can only have one entry per category per year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check before insert or update
CREATE TRIGGER check_representative_category_trigger
  BEFORE INSERT OR UPDATE ON representative_data
  FOR EACH ROW
  EXECUTE FUNCTION check_representative_category();