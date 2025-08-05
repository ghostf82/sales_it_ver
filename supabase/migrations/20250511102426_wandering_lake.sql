/*
  # Add Financial Audit System
  
  1. New Tables
    - `financial_audit`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `representative_id` (uuid, foreign key to representatives)
      - `company_id` (uuid, foreign key to companies)
      - `month` (integer)
      - `year` (integer)
      - `total_sales` (numeric)
      - `deduction_operating` (numeric)
      - `deduction_transportation` (numeric)
      - `deduction_general` (numeric)
      - `deduction_custom_name` (text)
      - `deduction_custom_amount` (numeric)
      - `net_total_sales` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, foreign key to auth.users)
  
  2. New Functions
    - `calculate_net_sales` - Calculates net sales for each representative data entry
    - `get_financial_audit` - Gets financial audit data for a specific period
    
  3. Security
    - Enable RLS on financial_audit table
    - Add policies for admin and financial_auditor roles
    - Add financial_auditor role to admin_users table
*/

-- Add financial_auditor role to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_financial_auditor boolean DEFAULT false;

-- Create financial_audit table
CREATE TABLE IF NOT EXISTS financial_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  representative_id uuid REFERENCES representatives(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  total_sales numeric NOT NULL DEFAULT 0,
  deduction_operating numeric NOT NULL DEFAULT 0,
  deduction_transportation numeric NOT NULL DEFAULT 0,
  deduction_general numeric NOT NULL DEFAULT 0,
  deduction_custom_name text,
  deduction_custom_amount numeric DEFAULT 0,
  net_total_sales numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_month_range CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT unique_financial_audit UNIQUE (representative_id, company_id, year, month)
);

-- Enable RLS
ALTER TABLE financial_audit ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_audit
CREATE POLICY "Enable read access for authenticated users"
  ON financial_audit
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin and financial auditors"
  ON financial_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_financial_auditor = true)
    )
  );

CREATE POLICY "Enable update for admin and financial auditors"
  ON financial_audit
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_financial_auditor = true)
    )
  );

CREATE POLICY "Enable delete for admin users only"
  ON financial_audit
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Create trigger function for financial_audit
CREATE OR REPLACE FUNCTION handle_financial_audit_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_is_authorized boolean;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user is admin or financial auditor
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = v_user_id 
    AND (is_admin = true OR is_financial_auditor = true)
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Only administrators and financial auditors can modify financial audit data';
  END IF;
  
  -- Calculate net_total_sales
  NEW.net_total_sales := NEW.total_sales - (
    NEW.deduction_operating + 
    NEW.deduction_transportation + 
    NEW.deduction_general + 
    COALESCE(NEW.deduction_custom_amount, 0)
  );
  
  -- Set updated_by and updated_at
  NEW.updated_by := v_user_id;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER financial_audit_update
  BEFORE INSERT OR UPDATE ON financial_audit
  FOR EACH ROW
  EXECUTE FUNCTION handle_financial_audit_update();

-- Function to calculate net sales for representative data
CREATE OR REPLACE FUNCTION calculate_net_sales(
  p_representative_id uuid,
  p_company_id uuid,
  p_year integer,
  p_month integer,
  p_sales numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_sales numeric;
  v_net_total_sales numeric;
  v_proportion numeric;
BEGIN
  -- Get total sales for this representative/company/year/month
  SELECT SUM(sales) INTO v_total_sales
  FROM representative_data
  WHERE representative_id = p_representative_id
  AND company_id = p_company_id
  AND year = p_year
  AND month = p_month;
  
  -- Get net total sales from financial audit
  SELECT net_total_sales INTO v_net_total_sales
  FROM financial_audit
  WHERE representative_id = p_representative_id
  AND company_id = p_company_id
  AND year = p_year
  AND month = p_month;
  
  -- If no financial audit data or total sales is zero, return original sales
  IF v_net_total_sales IS NULL OR v_total_sales = 0 THEN
    RETURN p_sales;
  END IF;
  
  -- Calculate proportion and net sales
  v_proportion := p_sales / v_total_sales;
  RETURN ROUND(v_proportion * v_net_total_sales, 2);
END;
$$;

-- Function to get financial audit data
CREATE OR REPLACE FUNCTION get_financial_audit(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_representative_id uuid DEFAULT NULL,
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  representative_id uuid,
  representative_name text,
  company_id uuid,
  company_name text,
  month integer,
  year integer,
  total_sales numeric,
  deduction_operating numeric,
  deduction_transportation numeric,
  deduction_general numeric,
  deduction_custom_name text,
  deduction_custom_amount numeric,
  net_total_sales numeric,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid,
  updated_by_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin or financial auditor
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() 
    AND (is_admin = true OR is_financial_auditor = true)
  ) THEN
    RAISE EXCEPTION 'Only administrators and financial auditors can view financial audit data';
  END IF;

  RETURN QUERY
  SELECT 
    fa.id,
    fa.representative_id,
    r.name as representative_name,
    fa.company_id,
    c.name as company_name,
    fa.month,
    fa.year,
    fa.total_sales,
    fa.deduction_operating,
    fa.deduction_transportation,
    fa.deduction_general,
    fa.deduction_custom_name,
    fa.deduction_custom_amount,
    fa.net_total_sales,
    fa.created_at,
    fa.updated_at,
    fa.updated_by,
    u.email::text as updated_by_email
  FROM financial_audit fa
  JOIN representatives r ON fa.representative_id = r.id
  JOIN companies c ON fa.company_id = c.id
  LEFT JOIN auth.users u ON fa.updated_by = u.id
  WHERE (p_year IS NULL OR fa.year = p_year)
  AND (p_month IS NULL OR fa.month = p_month)
  AND (p_representative_id IS NULL OR fa.representative_id = p_representative_id)
  AND (p_company_id IS NULL OR fa.company_id = p_company_id)
  ORDER BY fa.year DESC, fa.month DESC, r.name, c.name;
END;
$$;

-- Function to get representative total sales by period
CREATE OR REPLACE FUNCTION get_representative_total_sales(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_representative_id uuid DEFAULT NULL,
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE (
  representative_id uuid,
  representative_name text,
  company_id uuid,
  company_name text,
  month integer,
  year integer,
  total_sales numeric,
  has_financial_audit boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rd.representative_id,
    r.name as representative_name,
    rd.company_id,
    c.name as company_name,
    rd.month,
    rd.year,
    SUM(rd.sales) as total_sales,
    EXISTS (
      SELECT 1 FROM financial_audit fa
      WHERE fa.representative_id = rd.representative_id
      AND fa.company_id = rd.company_id
      AND fa.year = rd.year
      AND fa.month = rd.month
    ) as has_financial_audit
  FROM representative_data rd
  JOIN representatives r ON rd.representative_id = r.id
  JOIN companies c ON rd.company_id = c.id
  WHERE (p_year IS NULL OR rd.year = p_year)
  AND (p_month IS NULL OR rd.month = p_month)
  AND (p_representative_id IS NULL OR rd.representative_id = p_representative_id)
  AND (p_company_id IS NULL OR rd.company_id = p_company_id)
  GROUP BY rd.representative_id, r.name, rd.company_id, c.name, rd.month, rd.year
  ORDER BY rd.year DESC, rd.month DESC, r.name, c.name;
END;
$$;

-- Function to update user roles
CREATE OR REPLACE FUNCTION update_user_roles(
  user_id uuid,
  is_admin boolean,
  is_financial_auditor boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_email text;
  current_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user's ID
  current_user_id := auth.uid();
  
  -- Get target user's email
  SELECT email INTO target_user_email
  FROM auth.users
  WHERE id = user_id;

  -- Check if target user is system admin
  IF target_user_email = 'fucurl@gmail.com' THEN
    RAISE EXCEPTION 'Cannot modify system administrator privileges';
  END IF;

  -- Check if current user is admin
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = current_user_id;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can modify user permissions';
  END IF;

  -- Check if target user exists
  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update admin_users table
  INSERT INTO admin_users (id, is_admin, is_financial_auditor, updated_by)
  VALUES (user_id, is_admin, is_financial_auditor, current_user_id)
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = EXCLUDED.is_admin,
    is_financial_auditor = EXCLUDED.is_financial_auditor,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
    jsonb_build_object(
      'is_admin', is_admin,
      'is_financial_auditor', is_financial_auditor
    )
  WHERE id = user_id;

  RETURN true;
END;
$$;

-- Update get_users_with_admin_status function to include financial_auditor role
DROP FUNCTION IF EXISTS get_users_with_admin_status();

CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  is_financial_auditor boolean,
  last_sign_in_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(au.is_admin, false) as is_admin,
    COALESCE(au.is_financial_auditor, false) as is_financial_auditor,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN admin_users au ON u.id = au.id
  ORDER BY u.email;
END;
$$;