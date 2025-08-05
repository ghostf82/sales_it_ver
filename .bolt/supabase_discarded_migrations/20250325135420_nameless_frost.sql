/*
  # Create inputs table with proper policy handling
  
  1. Changes
    - Drop existing policies first
    - Create inputs table if not exists
    - Add proper admin checks
    - Enable RLS
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "inputs_read_policy" ON inputs;
DROP POLICY IF EXISTS "inputs_insert_policy" ON inputs;
DROP POLICY IF EXISTS "inputs_update_policy" ON inputs;
DROP POLICY IF EXISTS "inputs_delete_policy" ON inputs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inputs;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON inputs;
DROP POLICY IF EXISTS "Enable update for admin users only" ON inputs;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON inputs;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS input_update ON inputs;
DROP FUNCTION IF EXISTS handle_input_update CASCADE;

-- Create inputs table if not exists
CREATE TABLE IF NOT EXISTS inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  value text,
  type text NOT NULL DEFAULT 'text',
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE inputs ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "inputs_read_policy_v2"
  ON inputs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "inputs_insert_policy_v2"
  ON inputs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "inputs_update_policy_v2"
  ON inputs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "inputs_delete_policy_v2"
  ON inputs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Create trigger function
CREATE OR REPLACE FUNCTION handle_input_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check admin status
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can modify inputs';
  END IF;
  
  -- Set updated_by and updated_at
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER input_update
  BEFORE INSERT OR UPDATE ON inputs
  FOR EACH ROW
  EXECUTE FUNCTION handle_input_update();