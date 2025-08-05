/*
  # Delete data entry records while preserving basic data
  
  1. Changes
    - Delete all records from representative_data table
    - Delete all records from collection_records table
    - Preserve basic data in companies, representatives, and categories tables
    
  2. Security
    - Maintain existing RLS policies
    - Only delete target tables
*/

DO $$ 
BEGIN
  -- Delete all collection records first (due to foreign key constraints)
  DELETE FROM collection_records;
  
  -- Delete all representative data
  DELETE FROM representative_data;
END $$;