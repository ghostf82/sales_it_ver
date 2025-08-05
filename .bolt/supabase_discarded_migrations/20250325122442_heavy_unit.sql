/*
  # Add month field to representative data
  
  1. Changes
    - Add month column to representative_data table
    - Update unique constraint to include month
    - Add check constraint for valid month values
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

-- Drop existing constraints if they exist
DO $$
BEGIN
  -- Drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_representative_category_year_month'
    AND table_name = 'representative_data'
  ) THEN
    ALTER TABLE representative_data 
    DROP CONSTRAINT unique_representative_category_year_month;
  END IF;

  -- Drop the old unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_representative_category_year'
    AND table_name = 'representative_data'
  ) THEN
    ALTER TABLE representative_data 
    DROP CONSTRAINT unique_representative_category_year;
  END IF;

  -- Drop the check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_month_range'
    AND table_name = 'representative_data'
  ) THEN
    ALTER TABLE representative_data 
    DROP CONSTRAINT valid_month_range;
  END IF;
END $$;

-- Add check constraint for valid months (1-12)
ALTER TABLE representative_data
ADD CONSTRAINT valid_month_range 
CHECK (month BETWEEN 1 AND 12);

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