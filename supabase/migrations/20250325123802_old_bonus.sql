/*
  # Add triggers to update name references
  
  1. Changes
    - Add triggers to update category names in representative_data
    - Add triggers to update company names in representative_data
    - Add triggers to update representative names in representative_data
    
  2. Security
    - Maintain data integrity
    - Ensure consistent naming across tables
*/

-- Function to handle category name updates
CREATE OR REPLACE FUNCTION handle_category_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update category name in representative_data
  UPDATE representative_data
  SET category = NEW.name
  WHERE category = OLD.name;
  
  RETURN NEW;
END;
$$;

-- Create trigger for category updates
DROP TRIGGER IF EXISTS update_category_references ON categories;
CREATE TRIGGER update_category_references
  BEFORE UPDATE OF name ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_category_update();

-- Function to handle company name updates
CREATE OR REPLACE FUNCTION handle_company_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update company name in collection_records
  UPDATE collection_records
  SET company_id = NEW.id
  WHERE company_id = OLD.id;
  
  -- Update company name in representative_data
  UPDATE representative_data
  SET company_id = NEW.id
  WHERE company_id = OLD.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for company updates
DROP TRIGGER IF EXISTS update_company_references ON companies;
CREATE TRIGGER update_company_references
  BEFORE UPDATE OF name ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_company_update();

-- Function to handle representative name updates
CREATE OR REPLACE FUNCTION handle_representative_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update representative name in collection_records
  UPDATE collection_records
  SET representative_id = NEW.id
  WHERE representative_id = OLD.id;
  
  -- Update representative name in representative_data
  UPDATE representative_data
  SET representative_id = NEW.id
  WHERE representative_id = OLD.id;
  
  -- Update representative name in collection_total
  UPDATE collection_total
  SET representative_id = NEW.id
  WHERE representative_id = OLD.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for representative updates
DROP TRIGGER IF EXISTS update_representative_references ON representatives;
CREATE TRIGGER update_representative_references
  BEFORE UPDATE OF name ON representatives
  FOR EACH ROW
  EXECUTE FUNCTION handle_representative_update();