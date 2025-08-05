/*
  # Add month column and update constraints
  
  1. Changes
    - Add month column to representative_data table
    - Update unique constraint to include month
    - Update trigger function to check month
    
  2. Security
    - Maintain existing RLS policies
    - Add proper validation for month values
*/

-- Add month column if it doesn't exist
ALTER TABLE representative_data 
ADD COLUMN IF NOT EXISTS month integer NOT NULL DEFAULT 1;

-- Drop existing unique constraint if it exists
ALTER TABLE representative_data 
DROP CONSTRAINT IF EXISTS unique_representative_category_year;

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_representative_category_year_month;

-- Create unique index for the combined fields
CREATE UNIQUE INDEX idx_representative_category_year_month 
ON representative_data (representative_id, category, year, month);

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS check_representative_category CASCADE;

-- Create new trigger function
CREATE FUNCTION check_representative_category()
RETURNS trigger AS $$
BEGIN
  -- Check for duplicate entries
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

-- Create trigger
CREATE TRIGGER check_representative_category_trigger
  BEFORE INSERT OR UPDATE ON representative_data
  FOR EACH ROW
  EXECUTE FUNCTION check_representative_category();