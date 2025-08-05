/*
  # Fix RLS policies for basic data tables
  
  1. Changes
    - Enable RLS on all tables
    - Drop existing policies to avoid conflicts
    - Create new policies with proper admin checks
    - Add triggers to handle updated_by field
    
  2. Security
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
    - Track who last modified records
*/

-- Categories Table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON categories;
DROP POLICY IF EXISTS "Enable update for admin users only" ON categories;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON categories;

CREATE POLICY "categories_read_policy"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "categories_insert_policy"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "categories_update_policy"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "categories_delete_policy"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Companies Table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON companies;
DROP POLICY IF EXISTS "Enable update for admin users only" ON companies;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON companies;

CREATE POLICY "companies_read_policy"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "companies_insert_policy"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "companies_update_policy"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "companies_delete_policy"
  ON companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Representatives Table
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON representatives;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON representatives;
DROP POLICY IF EXISTS "Enable update for admin users only" ON representatives;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON representatives;

CREATE POLICY "representatives_read_policy"
  ON representatives
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "representatives_insert_policy"
  ON representatives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "representatives_update_policy"
  ON representatives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "representatives_delete_policy"
  ON representatives
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Add updated_by and updated_at columns to all tables if they don't exist
DO $$ 
BEGIN
  -- Categories
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE categories ADD COLUMN updated_by uuid REFERENCES auth.users(id);
    ALTER TABLE categories ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE companies ADD COLUMN updated_by uuid REFERENCES auth.users(id);
    ALTER TABLE companies ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Representatives
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'representatives' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE representatives ADD COLUMN updated_by uuid REFERENCES auth.users(id);
    ALTER TABLE representatives ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create function to handle updated_by/updated_at
CREATE OR REPLACE FUNCTION handle_updated_fields()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set updated_by and updated_at
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  
  -- Check admin status
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can modify this data';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for all tables
DROP TRIGGER IF EXISTS set_categories_fields ON categories;
CREATE TRIGGER set_categories_fields
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_fields();

DROP TRIGGER IF EXISTS set_companies_fields ON companies;
CREATE TRIGGER set_companies_fields
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_fields();

DROP TRIGGER IF EXISTS set_representatives_fields ON representatives;
CREATE TRIGGER set_representatives_fields
  BEFORE INSERT OR UPDATE ON representatives
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_fields();