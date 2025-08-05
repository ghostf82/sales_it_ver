-- Drop existing function
DROP FUNCTION IF EXISTS calculate_tiered_commission CASCADE;

-- Create function to calculate commission based on dynamic rules
CREATE OR REPLACE FUNCTION calculate_tiered_commission(
  p_category text,
  p_sales numeric,
  p_target numeric
) RETURNS TABLE (
  tier1_commission numeric,
  tier2_commission numeric,
  tier3_commission numeric,
  total_commission numeric
) AS $$
DECLARE
  v_rule commission_rules%ROWTYPE;
  v_achievement_rate numeric;
BEGIN
  -- Initialize all commissions to 0
  tier1_commission := 0;
  tier2_commission := 0;
  tier3_commission := 0;
  total_commission := 0;

  -- Get commission rules for the category
  SELECT * INTO v_rule
  FROM commission_rules
  WHERE category = p_category;

  -- If no rules found, return zeros
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Special case: If target is 0, treat all sales as Tier 1
  IF p_target = 0 THEN
    tier1_commission := ROUND(p_sales * v_rule.tier1_rate, 2);
  ELSE
    -- Calculate achievement rate
    v_achievement_rate := (p_sales / p_target) * 100;

    -- Calculate Tier 1 commission (always on 70% of target)
    tier1_commission := ROUND(p_target * 0.7 * v_rule.tier1_rate, 2);

    -- Calculate Tier 2 commission if achievement ≥ 71%
    IF v_achievement_rate >= 71 THEN
      -- Always calculate on 30% of target
      tier2_commission := ROUND(p_target * 0.3 * v_rule.tier2_rate, 2);
    END IF;

    -- Calculate Tier 3 commission if achievement > 100%
    IF v_achievement_rate > 100 THEN
      tier3_commission := ROUND((p_sales - p_target) * v_rule.tier3_rate, 2);
    END IF;
  END IF;

  -- Calculate total commission
  total_commission := ROUND(tier1_commission + tier2_commission + tier3_commission, 2);

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

/*
Example calculation:

Sales = 350,000
Target = 250,000
Achievement Rate = 140%

1. Tier 1:
   Base = 250,000 × 0.7 = 175,000
   Commission = 175,000 × 0.0025 = 437.50

2. Tier 2:
   Base = 250,000 × 0.3 = 75,000
   Commission = 75,000 × 0.003 = 225.00

3. Tier 3:
   Base = 350,000 - 250,000 = 100,000
   Commission = 100,000 × 0.004 = 400.00

Total Commission = 437.50 + 225.00 + 400.00 = 1,062.50
*/