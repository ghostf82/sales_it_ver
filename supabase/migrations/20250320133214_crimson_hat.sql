/*
  # Create categories table
  
  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `categories` table
    - Add policies for:
      - All authenticated users can read categories
      - Only admins can create/update/delete categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Enable read access for authenticated users"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users only"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

CREATE POLICY "Enable update for admin users only"
  ON categories
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
  WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

CREATE POLICY "Enable delete for admin users only"
  ON categories
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('أدوات منزلية'),
  ('إلكترونيات'),
  ('مواد غذائية'),
  ('مستحضرات تجميل'),
  ('ملابس'),
  ('أجهزة كهربائية')
ON CONFLICT (name) DO NOTHING;