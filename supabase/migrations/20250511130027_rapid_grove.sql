-- Fix financial_audit table to ensure company field is not null
ALTER TABLE financial_audit
ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '';

-- Fix financial_audit_update trigger to avoid recursion and set company field
DROP TRIGGER IF EXISTS financial_audit_update ON financial_audit;
DROP FUNCTION IF EXISTS handle_financial_audit_update();

CREATE OR REPLACE FUNCTION handle_financial_audit_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_is_authorized boolean;
  v_company_name text;
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
  
  -- Get company name
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = NEW.company_id;
  
  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
  
  -- Set company name
  NEW.company := v_company_name;
  
  -- Calculate net_total_sales with proper NULL handling
  NEW.net_total_sales := NEW.total_sales - (
    COALESCE(NEW.deduction_operating, 0) + 
    COALESCE(NEW.deduction_transportation, 0) + 
    COALESCE(NEW.deduction_general, 0) + 
    COALESCE(NEW.deduction_custom_amount, 0)
  );
  
  -- Set updated_by
  NEW.updated_by := v_user_id;
  
  -- Only set updated_at if it's not already set by the client
  -- This prevents the recursive trigger call
  IF NEW.updated_at IS NULL THEN
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER financial_audit_update
  BEFORE INSERT OR UPDATE ON financial_audit
  FOR EACH ROW
  EXECUTE FUNCTION handle_financial_audit_update();

-- Fix get_users_with_admin_status function to avoid ambiguous id reference
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
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    users.id,
    users.email::text,
    COALESCE(admin_users.is_admin, false) as is_admin,
    COALESCE(admin_users.is_financial_auditor, false) as is_financial_auditor,
    users.last_sign_in_at
  FROM auth.users users
  LEFT JOIN admin_users ON users.id = admin_users.id
  ORDER BY users.email;
END;
$$;

-- Create or replace the net_sales_per_category_view
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
  AND rd.month = total_sales.month
  AND rd.year = total_sales.year
JOIN financial_audit fa
  ON rd.representative_id = fa.representative_id
  AND rd.company_id = fa.company_id
  AND rd.year = fa.year
  AND CAST(rd.month AS TEXT) = CAST(fa.month AS TEXT);

-- Add security to the view
GRANT SELECT ON net_sales_per_category_view TO authenticated;

-- Fix exec_sql function to only allow SELECT statements
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