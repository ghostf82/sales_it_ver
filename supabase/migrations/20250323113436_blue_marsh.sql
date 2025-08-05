/*
  🔐 Secure collection_records table with RLS
  - Allow read & insert for authenticated users
  - Allow update & delete for admins only
  - Track updates using trigger
*/

-- 1. Enable RLS
ALTER TABLE collection_records ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON collection_records;
DROP POLICY IF EXISTS "Enable update for admin users only" ON collection_records;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON collection_records;

DROP POLICY IF EXISTS "Enable read access for authenticated users v2" ON collection_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users v2" ON collection_records;
DROP POLICY IF EXISTS "Enable update for admin users only v2" ON collection_records;
DROP POLICY IF EXISTS "Enable delete for admin users only v2" ON collection_records;

-- 3. Create new secure policies

-- ✅ Read: allowed for all authenticated users
CREATE POLICY "Allow read for authenticated users"
  ON collection_records
  FOR SELECT
  TO authenticated
  USING (true);

-- ✅ Insert: allowed for all authenticated users
CREATE POLICY "Allow insert for authenticated users"
  ON collection_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ✅ Update: only allowed for admins (based on JWT claim `is_admin`)
CREATE POLICY "Allow update for admins only"
  ON collection_records
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() ->> 'is_admin')::boolean = true);

-- ✅ Delete: only allowed for admins (based on JWT claim `is_admin`)
CREATE POLICY "Allow delete for admins only"
  ON collection_records
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- 4. Drop existing trigger/function if exists
DROP TRIGGER IF EXISTS collection_record_update ON collection_records;
DROP FUNCTION IF EXISTS handle_collection_record;

-- 5. Create update handler trigger function
CREATE OR REPLACE FUNCTION handle_collection_record()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create BEFORE UPDATE trigger
CREATE TRIGGER collection_record_update
  BEFORE UPDATE ON collection_records
  FOR EACH ROW
  EXECUTE FUNCTION handle_collection_record();
