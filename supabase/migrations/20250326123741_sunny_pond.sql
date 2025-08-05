/*
  # Delete old commission rules
  
  1. Changes
    - Delete old commission rules for outdated categories
    - Preserve any other commission rules
    
  2. Security
    - Maintain existing RLS policies
    - Only delete specific categories
*/

DO $$ 
BEGIN
  -- Delete old commission rules
  DELETE FROM commission_rules
  WHERE category IN (
    'أجهزة كهربائية',
    'أدوات منزلية',
    'إلكترونيات',
    'مستحضرات تجميل',
    'ملابس',
    'مواد غذائية'
  );
END $$;