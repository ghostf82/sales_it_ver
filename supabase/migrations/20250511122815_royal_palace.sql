/*
  # Fix stack depth limit error in financial_audit trigger
  
  1. Changes
    - Fix the handle_financial_audit_update trigger function
    - Remove the recursive call that's causing the stack depth limit error
    - Ensure proper calculation of net_total_sales
    
  2. Security
    - Maintain existing RLS policies
    - Preserve admin and financial auditor access checks
*/

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS financial_audit_update ON financial_audit;
DROP FUNCTION IF EXISTS handle_financial_audit_update();

-- Create a new version of the function that avoids recursion
CREATE OR REPLACE FUNCTION handle_financial_audit_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_is_authorized boolean;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user is admin or financial auditor
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = v_user_id 
    AND (is_admin = true OR is_financial_auditor = true)
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Only administrators and financial auditors can modify financial audit data';
  END IF;
  
  -- Calculate net_total_sales
  NEW.net_total_sales := NEW.total_sales - (
    COALESCE(NEW.deduction_operating, 0) + 
    COALESCE(NEW.deduction_transportation, 0) + 
    COALESCE(NEW.deduction_general, 0) + 
    COALESCE(NEW.deduction_custom_amount, 0)
  );
  
  -- Set updated_by and updated_at
  NEW.updated_by := v_user_id;
  
  -- Only set updated_at if it's not already set by the client
  -- This prevents the recursive trigger call
  IF NEW.updated_at IS NULL THEN
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER financial_audit_update
  BEFORE INSERT OR UPDATE ON financial_audit
  FOR EACH ROW
  EXECUTE FUNCTION handle_financial_audit_update();