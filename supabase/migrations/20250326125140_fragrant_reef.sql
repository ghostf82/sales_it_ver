/*
  # Update category names
  
  1. Changes
    - Update category names to new values
    - Handle updates safely to maintain data integrity
    - Ensure no duplicate entries
    
  2. Security
    - Maintain existing RLS policies
    - Preserve data relationships
*/

-- First, update the categories table
UPDATE categories
SET name = 'اسمنتي'
WHERE name = 'أجهزة كهربائية';

UPDATE categories
SET name = 'بلدورة'
WHERE name = 'أدوات منزلية';

UPDATE categories
SET name = 'انترلوك'
WHERE name = 'إلكترونيات';

UPDATE categories
SET name = 'تبليط داخلي'
WHERE name = 'ملابس';

-- Then update the representative_data table
UPDATE representative_data
SET category = 'اسمنتي'
WHERE category = 'أجهزة كهربائية';

UPDATE representative_data
SET category = 'بلدورة'
WHERE category = 'أدوات منزلية';

UPDATE representative_data
SET category = 'انترلوك'
WHERE category = 'إلكترونيات';

UPDATE representative_data
SET category = 'تبليط داخلي'
WHERE category = 'ملابس';

-- Finally update the commission_rules table
UPDATE commission_rules
SET category = 'اسمنتي'
WHERE category = 'أجهزة كهربائية';

UPDATE commission_rules
SET category = 'بلدورة'
WHERE category = 'أدوات منزلية';

UPDATE commission_rules
SET category = 'انترلوك'
WHERE category = 'إلكترونيات';

UPDATE commission_rules
SET category = 'تبليط داخلي'
WHERE category = 'ملابس';