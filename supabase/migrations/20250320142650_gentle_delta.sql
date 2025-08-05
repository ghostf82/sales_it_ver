/*
  # Fix collection total RLS policies

  1. Security
    - Update RLS policies for collection_total table to allow admin users to insert and update data
*/

-- Update RLS policies for collection_total
DROP POLICY IF EXISTS "Enable insert for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_total;

CREATE POLICY "Enable insert for admin users only"
  ON collection_total
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Enable update for admin users only"
  ON collection_total
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() ->> 'is_admin')::boolean = true
  );