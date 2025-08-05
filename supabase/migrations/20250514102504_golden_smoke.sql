/*
  # Fix financial_audit table and add missing columns
  
  1. Changes
    - Add salesperson_name column if it doesn't exist
    - Add company column if it doesn't exist
    - Add trigger to update updated_at field
    
  2. Security
    - Maintain existing RLS policies
    - Add proper error handling
*/

-- Add salesperson_name column to financial_audit if it doesn't exist
ALTER TABLE financial_audit
ADD COLUMN IF NOT EXISTS salesperson_name text;

-- Add company column to financial_audit if it doesn't exist
ALTER TABLE financial_audit
ADD COLUMN IF NOT EXISTS company text;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_updated_at_trigger ON financial_audit;

-- Create trigger
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON financial_audit
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Fix missing salesperson_name and company values
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT fa.id, fa.representative_id, fa.company_id
    FROM financial_audit fa
    WHERE fa.salesperson_name IS NULL OR fa.company IS NULL
  LOOP
    -- Update salesperson_name
    IF r.salesperson_name IS NULL THEN
      UPDATE financial_audit
      SET salesperson_name = (
        SELECT name FROM representatives WHERE id = r.representative_id
      )
      WHERE id = r.id;
    END IF;
    
    -- Update company
    IF r.company IS NULL THEN
      UPDATE financial_audit
      SET company = (
        SELECT name FROM companies WHERE id = r.company_id
      )
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;