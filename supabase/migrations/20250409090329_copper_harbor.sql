-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create improved function with explicit table aliases
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
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
    users.id,
    users.email::text,
    COALESCE(admins.is_admin, false) as is_admin,
    users.last_sign_in_at
  FROM auth.users users
  LEFT JOIN admin_users admins ON users.id = admins.id
  ORDER BY users.email;
END;
$$;