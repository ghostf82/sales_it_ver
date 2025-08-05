/*
  # Create inputs table with RLS policies
  
  1. Changes
    - Create inputs table for storing input fields
    - Add RLS policies for admin-only access
    - Add trigger for tracking updates
    
  2. Security
    - Enable RLS
    - Allow read access for all authenticated users
    - Restrict write operations to admin users only
*/

-- Create inputs table
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

-- Create policies
CREATE POLICY "inputs_read_policy"
  ON inputs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "inputs_insert_policy"
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

CREATE POLICY "inputs_update_policy"
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

CREATE POLICY "inputs_delete_policy"
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