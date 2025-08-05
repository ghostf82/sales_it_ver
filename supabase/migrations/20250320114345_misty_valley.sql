/*
  # Create basic tables for representative data management

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `representatives`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `representative_data`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `representative_id` (uuid, foreign key to representatives)
      - `category` (text)
      - `sales` (numeric)
      - `target` (numeric)
      - `collection` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and write their own data
*/

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON companies
  FOR DELETE
  TO authenticated
  USING (true);

-- Representatives table
CREATE TABLE IF NOT EXISTS representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON representatives
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON representatives
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON representatives
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON representatives
  FOR DELETE
  TO authenticated
  USING (true);

-- Representative data table
CREATE TABLE IF NOT EXISTS representative_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  representative_id uuid REFERENCES representatives(id) ON DELETE CASCADE,
  category text NOT NULL,
  sales numeric NOT NULL DEFAULT 0,
  target numeric NOT NULL DEFAULT 0,
  collection numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE representative_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON representative_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON representative_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON representative_data
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON representative_data
  FOR DELETE
  TO authenticated
  USING (true);