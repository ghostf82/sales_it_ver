-- Create exec_sql function with security checks
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

-- Drop and recreate get_representative_total_sales with proper type handling
DROP FUNCTION IF EXISTS public.get_representative_total_sales;

CREATE OR REPLACE FUNCTION public.get_representative_total_sales(
  p_year integer,
  p_month integer
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
  has_financial_audit boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH financial_audits AS (
    SELECT DISTINCT
      fa.representative_id,
      fa.company_id,
      fa.year,
      fa.month::integer as month
    FROM financial_audit fa
    WHERE fa.year = p_year AND fa.month::integer = p_month
  )
  SELECT 
    gen_random_uuid() as id,
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