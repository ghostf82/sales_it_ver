/*
  # Update commission calculation function
  
  1. Changes
    - Update the commission calculation logic to use the new tiered system
    - Fix calculation for each tier
    - Add detailed comments explaining the calculation
    
  2. Security
    - Maintain existing security settings
*/

CREATE OR REPLACE FUNCTION calculate_commission(
  sales numeric,
  target numeric
) RETURNS numeric AS $$
DECLARE
  achievement_rate numeric;
  commission numeric := 0;
  base_sales numeric;
  remaining_sales numeric;
  excess_sales numeric;
BEGIN
  -- Return 0 if target is 0 to avoid division by zero
  IF target = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate achievement rate
  achievement_rate := (sales / target) * 100;

  -- Only calculate commission if achievement rate is at least 50%
  IF achievement_rate >= 50 THEN
    -- Tier 1: First 70% of target gets 0.25%
    base_sales := target * 0.7;
    commission := base_sales * 0.0025;

    -- For achievement rates above 70%
    IF achievement_rate > 70 THEN
      -- Tier 2: Sales between 70% and 100% get 0.3%
      remaining_sales := LEAST(sales - base_sales, target - base_sales);
      commission := commission + (remaining_sales * 0.003);

      -- Tier 3: Sales exceeding target get 0.4%
      IF achievement_rate > 100 THEN
        excess_sales := sales - target;
        commission := commission + (excess_sales * 0.004);
      END IF;
    END IF;
  END IF;

  RETURN ROUND(commission, 2);
END;
$$ LANGUAGE plpgsql;

-- Example calculation:
-- Sales: 1,250,000
-- Target: 1,400,000
-- Achievement Rate: 89.29%
-- 
-- Base (70%): 1,400,000 * 0.7 = 980,000 * 0.0025 = 2,450
-- Remaining: 1,250,000 - 980,000 = 270,000 * 0.003 = 810
-- Total Commission: 2,450 + 810 = 3,260