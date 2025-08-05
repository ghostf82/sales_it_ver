/*
  # Fix duplicate categories and add unique constraint

  1. Changes
    - Remove duplicate entries by keeping the latest entry for each representative-category combination
    - Add unique constraint on representative_id and category combination
    - Add trigger to prevent future duplicates
    - Add helpful error messages

  2. Security
    - Maintain existing RLS policies
    - Add server-side validation
*/

-- First, create a temporary table to store the latest entries
CREATE TEMP TABLE latest_entries AS
SELECT DISTINCT ON (representative_id, category) 
  id,
  representative_id,
  category
FROM representative_data
ORDER BY representative_id, category, created_at DESC;

-- Delete duplicate entries, keeping only the latest ones
DELETE FROM representative_data
WHERE id NOT IN (SELECT id FROM latest_entries);

-- Now we can safely add the unique constraint
ALTER TABLE representative_data
ADD CONSTRAINT unique_representative_category UNIQUE (representative_id, category);

-- Create function to check for existing entries
CREATE OR REPLACE FUNCTION check_representative_category()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM representative_data 
    WHERE representative_id = NEW.representative_id 
    AND category = NEW.category
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Category already exists for this representative'
      USING HINT = 'Each representative can only have one entry per category';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check before insert or update
DROP TRIGGER IF EXISTS check_representative_category_trigger ON representative_data;
CREATE TRIGGER check_representative_category_trigger
  BEFORE INSERT OR UPDATE ON representative_data
  FOR EACH ROW
  EXECUTE FUNCTION check_representative_category();