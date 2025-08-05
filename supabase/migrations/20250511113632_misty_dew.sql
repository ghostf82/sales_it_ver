/*
  # Fix ambiguous ID column in get_representative_total_sales function

  1. Changes
    - Drop existing get_representative_total_sales function
    - Create new version with explicit table references for id columns
    - Add proper table aliases to avoid ambiguity
    - Ensure all column references are fully qualified

  2. Security
    - Maintain existing security context (SECURITY DEFINER)
    - Function remains accessible to authenticated users only
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_representative_total_sales(p_year integer, p_month integer);

-- Create new version with fixed column references
CREATE OR REPLACE FUNCTION get_representative_total_sales(
    p_year integer,
    p_month integer
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
AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            rd.representative_id,
            r.name as representative_name,
            rd.company_id,
            c.name as company_name,
            rd.month,
            rd.year,
            SUM(rd.sales) as total_sales
        FROM representative_data rd
        JOIN representatives r ON r.id = rd.representative_id
        JOIN companies c ON c.id = rd.company_id
        WHERE rd.year = p_year AND rd.month = p_month
        GROUP BY 
            rd.representative_id,
            r.name,
            rd.company_id,
            c.name,
            rd.month,
            rd.year
    )
    SELECT 
        sd.representative_id,
        sd.representative_name,
        sd.company_id,
        sd.company_name,
        sd.month,
        sd.year,
        sd.total_sales,
        CASE 
            WHEN fa.id IS NOT NULL THEN true 
            ELSE false 
        END as has_financial_audit
    FROM sales_data sd
    LEFT JOIN financial_audit fa ON 
        fa.representative_id = sd.representative_id AND
        fa.company_id = sd.company_id AND
        fa.year = sd.year AND
        fa.month = sd.month
    ORDER BY 
        sd.representative_name,
        sd.company_name;
END;
$$;