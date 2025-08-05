/*
  # Fix collection_total RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with proper admin access checks
    - Ensure admin users can insert/update collection totals
    - Maintain read access for all authenticated users

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Restrict modifications to admin users only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_total;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_total;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON collection_total;

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