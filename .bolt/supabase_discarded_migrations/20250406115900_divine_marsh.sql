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
  v_tier1_base numeric;
  v_tier2_base numeric;
  v_tier3_base numeric;
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
    IF p_sales > 0 THEN
      tier1_commission := ROUND(p_sales * v_rule.tier1_rate, 2);
      total_commission := tier1_commission;
    END IF;
    RETURN;
  END IF;

  -- Calculate achievement rate
  v_achievement_rate := (p_sales / p_target) * 100;

  -- Calculate base amounts for each tier
  v_tier1_base := p_target * 0.7;  -- Always 70% of target
  v_tier2_base := p_target * 0.3;  -- Always 30% of target (the portion between 70% and 100%)
  v_tier3_base := GREATEST(p_sales - p_target, 0);  -- Amount exceeding target

  -- Calculate Tier 1 commission if achievement rate meets minimum
  IF v_achievement_rate >= v_rule.tier1_from THEN
    -- Always calculate on 70% of target
    tier1_commission := ROUND(v_tier1_base * v_rule.tier1_rate, 2);

    -- Calculate Tier 2 commission if achievement ≥ 71%
    IF v_achievement_rate >= v_rule.tier2_from THEN
      -- Always calculate on the fixed 30% portion of target (between 70% and 100%)
      tier2_commission := ROUND(v_tier2_base * v_rule.tier2_rate, 2);

      -- Calculate Tier 3 commission if achievement > 100%
      IF v_achievement_rate >= v_rule.tier3_from THEN
        tier3_commission := ROUND(v_tier3_base * v_rule.tier3_rate, 2);
      END IF;
    END IF;
  END IF;

  -- Calculate total commission
  total_commission := tier1_commission + tier2_commission + tier3_commission;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

/*
Example calculation for the case in the table:
Target = 250,000
Sales = 350,000
Achievement Rate = 140%

1. Tier 1 (0-70% of target):
   Base = 250,000 × 0.7 = 175,000
   Commission = 175,000 × 0.0025 = 437.50

2. Tier 2 (70-100% of target):
   Base = 250,000 × 0.3 = 75,000
   Commission = 75,000 × 0.003 = 225.00

3. Tier 3 (above target):
   Base = 350,000 - 250,000 = 100,000
   Commission = 100,000 × 0.004 = 400.00

Total Commission = 437.50 + 225.00 + 400.00 = 1,062.50

Key points:
1. Tier 2 is ALWAYS calculated on exactly 30% of target (the portion between 70% and 100%)
2. This is fixed regardless of actual sales amount
3. For the example row, Tier 2 should be exactly: 75,000 × 0.003 = 225.00
*/