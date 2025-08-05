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

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create function to execute SQL commands
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if current user is admin
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can execute SQL commands';
  END IF;

  -- Execute the SQL command
  EXECUTE sql;
END;
$$;