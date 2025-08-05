/*
  # Add exec_sql function for migrations
  
  1. Changes
    - Add exec_sql function for running SQL commands
    - Add proper security checks
    - Restrict access to admin users only
    
  2. Security
    - Function is SECURITY DEFINER
    - Only admins can execute SQL
    - Proper error handling
*/

-- Create function to execute SQL commands
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_result json;
  v_row record;
BEGIN
  -- Check if current user is admin
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can execute SQL commands';
  END IF;

  -- Execute the SQL command and return results as JSON
  FOR v_row IN EXECUTE sql
  LOOP
    v_result := row_to_json(v_row);
    RETURN NEXT v_result;
  END LOOP;
  
  RETURN;
END;
$$;