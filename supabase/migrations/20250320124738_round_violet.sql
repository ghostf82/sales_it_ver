/*
  # Fix function return type and policy creation
  
  1. Changes
    - Drop existing function before recreating with new return type
    - Added proper function dropping
    - Maintained existing table structure and policies
    - Added proper error handling for policy creation

  2. Security
    - Maintains existing RLS policies
    - Preserves security definer settings
*/

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_users_with_admin_status();
DROP FUNCTION IF EXISTS update_user_admin_status(text, boolean);

-- Function to get users with admin status
CREATE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  user_id uuid,
  email text,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    COALESCE(admin_users.is_admin, false) as is_admin,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN admin_users ON au.id = admin_users.id
  ORDER BY au.email;
END;
$$;

-- Function to update user admin status
CREATE FUNCTION update_user_admin_status(target_user_email text, admin_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user ID from the email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_user_email;

  -- Insert or update the admin status
  INSERT INTO admin_users (id, is_admin, updated_by)
  VALUES (target_user_id, admin_status, auth.uid())
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = EXCLUDED.is_admin,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
END;
$$;

-- Policies for admin_users table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON admin_users
      FOR SELECT
      TO authenticated
      USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' 
    AND policyname = 'Enable update for admin users only'
  ) THEN
    CREATE POLICY "Enable update for admin users only"
      ON admin_users
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
      WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);
  END IF;
END $$;