/*
  # Fix commission tier calculation
  
  1. Changes
    - Fix Tier 2 calculation to always use fixed portion (70%-100% of target)
    - Ensure consistent tier calculations regardless of sales amount
    - Add detailed comments explaining the logic
    
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
  v_tier1_base numeric;    -- Fixed: 70% of target
  v_tier2_base numeric;    -- Fixed: 30% of target (difference between 100% and 70%)
  v_tier1_sales numeric;   -- Actual sales applicable to tier 1
  v_tier2_sales numeric;   -- Actual sales applicable to tier 2
  v_tier3_sales numeric;   -- Sales exceeding 100% of target
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

  -- Calculate fixed base amounts for each tier
  v_tier1_base := p_target * 0.7;  -- 70% of target
  v_tier2_base := p_target * 0.3;  -- 30% of target (100% - 70%)

  -- Calculate actual sales for each tier
  IF v_achievement_rate >= v_rule.tier1_from THEN
    -- Tier 1: Sales up to 70% of target
    v_tier1_sales := LEAST(p_sales, v_tier1_base);
    tier1_commission := ROUND(v_tier1_sales * v_rule.tier1_rate, 2);

    -- Tier 2: Sales between 70% and 100% of target
    IF v_achievement_rate >= v_rule.tier2_from THEN
      v_tier2_sales := LEAST(
        GREATEST(p_sales - v_tier1_base, 0),  -- Sales above 70%
        v_tier2_base                          -- Limited to remaining 30%
      );
      tier2_commission := ROUND(v_tier2_sales * v_rule.tier2_rate, 2);

      -- Tier 3: Sales exceeding 100% of target
      IF v_achievement_rate >= v_rule.tier3_from THEN
        v_tier3_sales := GREATEST(p_sales - p_target, 0);
        tier3_commission := ROUND(v_tier3_sales * v_rule.tier3_rate, 2);
      END IF;
    END IF;
  END IF;

  -- Calculate total commission
  total_commission := tier1_commission + tier2_commission + tier3_commission;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Example calculations:
--
-- Example 1: Sales below target
-- Target: 250,000
-- Sales: 200,000 (80% achievement)
-- Tier 1: 175,000 (70% of target) × 0.0025 = 437.50
-- Tier 2: 25,000 (remaining sales up to 30% portion) × 0.003 = 75.00
-- Tier 3: 0 (no sales above target) × 0.004 = 0.00
-- Total: 512.50
--
-- Example 2: Sales above target
-- Target: 250,000
-- Sales: 300,000 (120% achievement)
-- Tier 1: 175,000 (70% of target) × 0.0025 = 437.50
-- Tier 2: 75,000 (full 30% portion) × 0.003 = 225.00
-- Tier 3: 50,000 (amount over target) × 0.004 = 200.00
-- Total: 862.50