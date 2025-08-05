/*
  # Fix collection total RLS policies

  1. Changes
    - Drop existing policies on collection_total table
    - Create new policies with correct permissions:
      - All authenticated users can read
      - Only admin users can insert/update/delete
      
  2. Security
    - Maintain RLS enabled
    - Ensure proper admin-only access for modifications
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_total;
DROP POLICY IF EXISTS "Enable insert/update for admin users only" ON collection_total;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
  ON collection_total
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users only"
  ON collection_total
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

CREATE POLICY "Enable update for admin users only"
  ON collection_total
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
  WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

CREATE POLICY "Enable delete for admin users only"
  ON collection_total
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);