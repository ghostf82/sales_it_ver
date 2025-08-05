-- Add financial_auditor role to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_financial_auditor boolean DEFAULT false;

-- Create function to execute SQL commands with financial auditor access
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_authorized boolean;
BEGIN
  -- Check if user is admin or financial auditor
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() 
    AND (is_admin = true OR is_financial_auditor = true)
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Only administrators and financial auditors can execute SQL commands';
  END IF;

  -- Basic SQL injection prevention
  IF position(';' in sql) > 0 THEN
    RAISE EXCEPTION 'Invalid SQL: multiple statements not allowed';
  END IF;

  -- Only allow SELECT statements
  IF NOT starts_with(trim(lower(sql)), 'select') THEN
    RAISE EXCEPTION 'Only SELECT statements are allowed';
  END IF;

  -- Execute the query and return results as JSON
  RETURN QUERY EXECUTE sql;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Update get_representative_total_sales function to handle month as integer
DROP FUNCTION IF EXISTS public.get_representative_total_sales(integer, integer);

CREATE OR REPLACE FUNCTION public.get_representative_total_sales(
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  record_id uuid,
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
AS $$
BEGIN
  -- Check if user is admin or financial auditor
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() 
    AND (is_admin = true OR is_financial_auditor = true)
  ) THEN
    RAISE EXCEPTION 'Only administrators and financial auditors can access this data';
  END IF;

  RETURN QUERY
  WITH financial_audits AS (
    SELECT DISTINCT
      fa.representative_id,
      fa.company_id,
      fa.year,
      fa.month::integer
    FROM financial_audit fa
    WHERE fa.year = p_year AND fa.month::integer = p_month
  )
  SELECT 
    gen_random_uuid() as record_id,
    rd.representative_id,
    r.name as representative_name,
    rd.company_id,
    c.name as company_name,
    rd.month,
    rd.year,
    SUM(rd.sales) as total_sales,
    (fa.representative_id IS NOT NULL) as has_financial_audit
  FROM representative_data rd
  JOIN representatives r ON rd.representative_id = r.id
  JOIN companies c ON rd.company_id = c.id
  LEFT JOIN financial_audits fa ON 
    rd.representative_id = fa.representative_id AND
    rd.company_id = fa.company_id AND
    rd.year = fa.year AND
    rd.month = fa.month
  WHERE rd.year = p_year AND rd.month = p_month
  GROUP BY 
    rd.representative_id,
    r.name,
    rd.company_id,
    c.name,
    rd.month,
    rd.year,
    fa.representative_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_representative_total_sales(integer, integer) TO authenticated;

-- Add updated_by column to financial_audit table if it doesn't exist
ALTER TABLE financial_audit
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Update financial_audit RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON financial_audit;
DROP POLICY IF EXISTS "Enable insert for admin and financial auditors" ON financial_audit;
DROP POLICY IF EXISTS "Enable update for admin and financial auditors" ON financial_audit;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON financial_audit;

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

-- Update function to update user roles
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

-- Create net_sales_per_category_view
CREATE OR REPLACE VIEW net_sales_per_category_view AS
SELECT
  rd.id as record_id,
  rd.representative_id,
  r.name as representative_name,
  rd.company_id,
  c.name as company_name,
  rd.category,
  rd.sales,
  fa.net_total_sales,
  ROUND(
    (rd.sales / NULLIF(total_sales.total_sales_per_rep, 0)) * fa.net_total_sales,
    2
  ) AS net_sales_per_category,
  ROUND(
    (ROUND(
      (rd.sales / NULLIF(total_sales.total_sales_per_rep, 0)) * fa.net_total_sales,
      2
    ) / NULLIF(rd.sales, 0)) * 100,
    2
  ) AS net_sales_percentage,
  rd.month,
  rd.year
FROM representative_data rd
JOIN representatives r ON rd.representative_id = r.id
JOIN companies c ON rd.company_id = c.id
JOIN (
  SELECT representative_id, company_id, month, year, SUM(sales) AS total_sales_per_rep
  FROM representative_data
  GROUP BY representative_id, company_id, month, year
) AS total_sales
  ON rd.representative_id = total_sales.representative_id
  AND rd.company_id = total_sales.company_id
  AND rd.year = total_sales.year 
  AND rd.month = total_sales.month
JOIN financial_audit fa
  ON rd.representative_id = fa.representative_id
  AND rd.company_id = fa.company_id
  AND rd.year = fa.year
  AND rd.month::text = fa.month::text;