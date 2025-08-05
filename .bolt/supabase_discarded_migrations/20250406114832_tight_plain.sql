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
  v_tier1_base numeric;    -- Fixed: 70% of target
  v_tier2_base numeric;    -- Fixed: 30% of target (100% - 70%)
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

  -- If no rules found or target is 0, return zeros
  IF NOT FOUND OR p_target = 0 THEN
    RETURN;
  END IF;

  -- Calculate achievement rate
  v_achievement_rate := (p_sales / p_target) * 100;

  -- Calculate fixed bases for each tier
  v_tier1_base := p_target * 0.7;  -- 70% of target
  v_tier2_base := p_target * 0.3;  -- Exactly 30% of target (difference between 100% and 70%)

  -- Calculate Tier 1 commission (up to 70% of target)
  IF v_achievement_rate >= v_rule.tier1_from THEN
    -- Always calculate on 70% of target when achievement rate is met
    tier1_commission := ROUND(v_tier1_base * v_rule.tier1_rate, 2);

    -- Calculate Tier 2 commission (fixed 30% portion)
    IF v_achievement_rate >= v_rule.tier2_from THEN
      -- Always calculate on remaining 30% of target when achievement rate is met
      tier2_commission := ROUND(v_tier2_base * v_rule.tier2_rate, 2);

      -- Calculate Tier 3 commission (anything above target)
      IF v_achievement_rate >= v_rule.tier3_from THEN
        tier3_commission := ROUND(
          (p_sales - p_target) * v_rule.tier3_rate,
          2
        );
      END IF;
    END IF;
  END IF;

  -- Calculate total commission
  total_commission := tier1_commission + tier2_commission + tier3_commission;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

/*
Example calculation for Target = 250,000 and Sales = 350,000:

1. Tier 1 Base = 250,000 × 0.7 = 175,000
   Tier 1 Commission = 175,000 × 0.0025 = 437.50

2. Tier 2 Base = 250,000 × 0.3 = 75,000
   Tier 2 Commission = 75,000 × 0.003 = 225.00

3. Excess for Tier 3 = 350,000 - 250,000 = 100,000
   Tier 3 Commission = 100,000 × 0.004 = 400.00

Total Commission = 437.50 + 225.00 + 400.00 = 1,062.50
*/