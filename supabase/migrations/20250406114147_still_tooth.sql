/*
  # Fix commission tier calculation
  
  1. Changes
    - Fix Tier 2 calculation to always use fixed range (70%-100% of target)
    - Ensure tiers are calculated based on target portions, not sales
    - Add detailed comments and examples
    
  2. Security
    - Maintain existing security settings
*/

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
  v_tier1_portion numeric;    -- Fixed: 70% of target
  v_tier2_portion numeric;    -- Fixed: 30% of target (100% - 70%)
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

  -- Calculate fixed portions for Tier 1 and 2
  v_tier1_portion := p_target * 0.7;  -- 70% of target
  v_tier2_portion := p_target * 0.3;  -- Remaining 30% of target

  -- Calculate Tier 1 commission (up to 70% of target)
  IF v_achievement_rate >= v_rule.tier1_from THEN
    tier1_commission := ROUND(v_tier1_portion * v_rule.tier1_rate, 2);

    -- Calculate Tier 2 commission (fixed 30% portion)
    IF v_achievement_rate >= v_rule.tier2_from THEN
      -- Always use the fixed portion for Tier 2
      tier2_commission := ROUND(v_tier2_portion * v_rule.tier2_rate, 2);

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
Example calculations:

1. Achievement below target (80%):
   Target = 250,000
   Sales = 200,000
   
   Tier 1: 175,000 (70% of target) × 0.0025 = 437.50
   Tier 2: 75,000 (30% of target) × 0.003 = 225.00
   Tier 3: 0 (no excess) × 0.004 = 0.00
   Total = 662.50

2. Achievement above target (140%):
   Target = 250,000
   Sales = 350,000
   
   Tier 1: 175,000 (70% of target) × 0.0025 = 437.50
   Tier 2: 75,000 (30% of target) × 0.003 = 225.00
   Tier 3: 100,000 (sales - target) × 0.004 = 400.00
   Total = 1,062.50

Key changes:
1. Tier 2 is now ALWAYS calculated on the fixed 30% portion of the target
2. Tier portions are calculated from target only, not from sales
3. Only Tier 3 uses actual sales figures (for excess above target)
*/