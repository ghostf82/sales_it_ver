-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_admin_status();

-- Create function to get users with admin status
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
    auth_users.id,
    auth_users.email::text,
    COALESCE(admin_users.is_admin, false) as is_admin,
    auth_users.last_sign_in_at
  FROM auth.users auth_users
  LEFT JOIN admin_users ON auth_users.id = admin_users.id
  ORDER BY auth_users.email;
END;
$$;