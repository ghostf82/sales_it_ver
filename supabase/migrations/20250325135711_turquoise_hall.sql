/*
  # Drop inputs table and related objects
  
  1. Changes
    - Drop inputs table
    - Drop related triggers and functions
    - Drop related policies
    
  2. Security
    - Clean up all related security objects
*/

-- Drop trigger first
DROP TRIGGER IF EXISTS input_update ON inputs;

-- Drop function
DROP FUNCTION IF EXISTS handle_input_update CASCADE;

-- Drop table and all dependent objects
DROP TABLE IF EXISTS inputs CASCADE;