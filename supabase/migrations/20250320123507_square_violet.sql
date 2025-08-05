/*
  # Add admin role and update security policies

  1. Changes
    - Add admin column to auth.users
    - Update RLS policies for companies and representatives tables to only allow admin access
    - Add initial admin user policy

  2. Security
    - Only admins can manage companies and representatives
    - Regular users can only read companies and representatives
    - Admins have full CRUD access
*/

-- Add admin column to auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Update companies policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON companies;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON companies;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON companies;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
  DROP POLICY IF EXISTS "Enable read access for all users" ON companies;
  DROP POLICY IF EXISTS "Enable delete for admin users only" ON companies;
  DROP POLICY IF EXISTS "Enable insert for admin users only" ON companies;
  DROP POLICY IF EXISTS "Enable update for admin users only" ON companies;

  -- Create new policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'companies' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON companies
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'companies' 
    AND policyname = 'Enable insert for admin users only'
  ) THEN
    CREATE POLICY "Enable insert for admin users only"
      ON companies
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'companies' 
    AND policyname = 'Enable update for admin users only'
  ) THEN
    CREATE POLICY "Enable update for admin users only"
      ON companies
      FOR UPDATE
      TO authenticated
      USING (auth.jwt() ->> 'is_admin' = 'true')
      WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'companies' 
    AND policyname = 'Enable delete for admin users only'
  ) THEN
    CREATE POLICY "Enable delete for admin users only"
      ON companies
      FOR DELETE
      TO authenticated
      USING (auth.jwt() ->> 'is_admin' = 'true');
  END IF;
END $$;

-- Update representatives policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON representatives;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON representatives;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON representatives;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON representatives;
  DROP POLICY IF EXISTS "Enable read access for all users" ON representatives;
  DROP POLICY IF EXISTS "Enable delete for admin users only" ON representatives;
  DROP POLICY IF EXISTS "Enable insert for admin users only" ON representatives;
  DROP POLICY IF EXISTS "Enable update for admin users only" ON representatives;

  -- Create new policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'representatives' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON representatives
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'representatives' 
    AND policyname = 'Enable insert for admin users only'
  ) THEN
    CREATE POLICY "Enable insert for admin users only"
      ON representatives
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'representatives' 
    AND policyname = 'Enable update for admin users only'
  ) THEN
    CREATE POLICY "Enable update for admin users only"
      ON representatives
      FOR UPDATE
      TO authenticated
      USING (auth.jwt() ->> 'is_admin' = 'true')
      WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'representatives' 
    AND policyname = 'Enable delete for admin users only'
  ) THEN
    CREATE POLICY "Enable delete for admin users only"
      ON representatives
      FOR DELETE
      TO authenticated
      USING (auth.jwt() ->> 'is_admin' = 'true');
  END IF;
END $$;