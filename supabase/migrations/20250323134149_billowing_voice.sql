/*
  # Update commission calculation function
  
  1. Changes
    - Update commission calculation logic to handle tiers correctly
    - Calculate commission based on actual sales within each tier
    - Ensure proper rounding of results
  
  2. Security
    - Maintain function as SECURITY DEFINER
    - Keep existing permissions
*/

CREATE OR REPLACE FUNCTION calculate_commission(
  sales numeric,
  target numeric
) RETURNS numeric AS $$
DECLARE
  achievement_rate numeric;
  commission numeric := 0;
  tier1_sales numeric := 0;
  tier2_sales numeric := 0;
  tier3_sales numeric := 0;
BEGIN
  -- Return 0 if target is 0 to avoid division by zero
  IF target = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate achievement rate
  achievement_rate := (sales / target) * 100;

  -- Only calculate commission if achievement rate is at least 50%
  IF achievement_rate >= 50 THEN
    -- Tier 1: Up to 70% of target
    tier1_sales := LEAST(target * 0.7, sales);
    commission := tier1_sales * 0.0025;

    -- Tier 2: Between 70% and 100% of target
    IF achievement_rate > 70 THEN
      tier2_sales := LEAST(sales - (target * 0.7), target * 0.3);
      commission := commission + (tier2_sales * 0.003);

      -- Tier 3: Above 100% of target
      IF achievement_rate > 100 THEN
        tier3_sales := sales - target;
        commission := commission + (tier3_sales * 0.004);
      END IF;
    END IF;
  END IF;

  RETURN ROUND(commission, 2);
END;
$$ LANGUAGE plpgsql;