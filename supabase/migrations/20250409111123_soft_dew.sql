-- Drop all functions created after deployment
DROP FUNCTION IF EXISTS exec_sql(text);
DROP FUNCTION IF EXISTS get_users_with_admin_status();
DROP FUNCTION IF EXISTS update_user_admin_status(uuid, boolean);
DROP FUNCTION IF EXISTS update_user_admin_status(text, boolean);

-- Drop is_observer column if it exists
ALTER TABLE admin_users DROP COLUMN IF EXISTS is_observer;

-- Recreate the original functions as they were at deployment
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

-- Ensure fucurl@gmail.com is admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID for fucurl@gmail.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fucurl@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Set admin status in admin_users table
    INSERT INTO admin_users (id, is_admin)
    VALUES (v_user_id, true)
    ON CONFLICT (id) DO UPDATE SET is_admin = true;

    -- Update user metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true)
    WHERE id = v_user_id;
  END IF;
END $$;