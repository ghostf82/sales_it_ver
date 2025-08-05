/*
  # Add month field to representative data
  
  1. Changes
    - Add month column to representative_data table
    - Update unique constraint to include month
    - Add check constraint for valid month values
    - Add default value for month
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add month column with validation
ALTER TABLE representative_data 
ADD COLUMN IF NOT EXISTS month integer NOT NULL DEFAULT 1;

-- Add check constraint for valid months (1-12)
ALTER TABLE representative_data
ADD CONSTRAINT valid_month_range 
CHECK (month BETWEEN 1 AND 12);

-- Drop existing unique constraint
ALTER TABLE representative_data 
DROP CONSTRAINT IF EXISTS unique_representative_category_year;

-- Create new unique constraint including month
ALTER TABLE representative_data
ADD CONSTRAINT unique_representative_category_year_month 
UNIQUE (representative_id, category, year, month);

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