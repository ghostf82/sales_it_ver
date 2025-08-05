/*
  # Add month column to collection_records table
  
  1. Changes
    - Add month column to collection_records table
    - Add check constraint for valid months
    - Update unique constraint to include month
    - Add default value for month
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with constraints
*/

-- Add month column if it doesn't exist
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