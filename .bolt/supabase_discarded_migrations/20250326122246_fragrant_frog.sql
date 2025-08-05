/*
  # Update category names safely
  
  1. Changes
    - Update category names in all relevant tables
    - Handle unique constraint conflicts
    - Maintain data consistency
    
  2. Security
    - Maintain existing RLS policies
    - Use transaction for atomic updates
*/

DO $$ 
BEGIN
  -- First, delete any existing rules for old categories to avoid conflicts
  DELETE FROM commission_rules
  WHERE category IN ('أجهزة كهربائية', 'أدوات منزلية', 'إلكترونيات', 'ملابس');

  -- Then update representative_data
  UPDATE representative_data
  SET category = CASE category
    WHEN 'أجهزة كهربائية' THEN 'اسمنتي'
    WHEN 'أدوات منزلية' THEN 'بلدورة'
    WHEN 'إلكترونيات' THEN 'انترلوك'
    WHEN 'ملابس' THEN 'تبليط داخلي'
    ELSE category
  END
  WHERE category IN ('أجهزة كهربائية', 'أدوات منزلية', 'إلكترونيات', 'ملابس');

  -- Update categories table
  UPDATE categories
  SET name = CASE name
    WHEN 'أجهزة كهربائية' THEN 'اسمنتي'
    WHEN 'أدوات منزلية' THEN 'بلدورة'
    WHEN 'إلكترونيات' THEN 'انترلوك'
    WHEN 'ملابس' THEN 'تبليط داخلي'
    ELSE name
  END
  WHERE name IN ('أجهزة كهربائية', 'أدوات منزلية', 'إلكترونيات', 'ملابس');

END $$;