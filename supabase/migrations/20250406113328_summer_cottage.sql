/*
  # Fix commission calculation logic
  
  1. Changes
    - Fix Tier 2 calculation to only apply to the range between 70% and 100% of target
    - Maintain existing commission rules structure
    - Update calculation function
    
  2. Security
    - Maintain existing security settings
    - Preserve RLS policies
*/

-- Drop existing function if exists
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
  v_tier1_amount numeric;
  v_tier2_amount numeric;
  v_tier3_amount numeric;
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

  -- Calculate base amounts for each tier
  v_tier1_amount := p_target * (v_rule.tier1_to / 100); -- 70% of target
  v_tier2_amount := p_target - v_tier1_amount; -- Remaining 30% up to 100%
  v_tier3_amount := GREATEST(p_sales - p_target, 0); -- Amount exceeding 100%

  -- Calculate Tier 1 commission if achievement rate meets minimum
  IF v_achievement_rate >= v_rule.tier1_from THEN
    -- Calculate on the portion up to tier1_to (70%)
    tier1_commission := ROUND(
      LEAST(v_tier1_amount, p_sales) * v_rule.tier1_rate,
      2
    );

    -- Calculate Tier 2 commission if applicable
    IF v_achievement_rate >= v_rule.tier2_from THEN
      -- Calculate on the portion between 70% and 100%
      tier2_commission := ROUND(
        LEAST(
          v_tier2_amount,
          GREATEST(p_sales - v_tier1_amount, 0)
        ) * v_rule.tier2_rate,
        2
      );

      -- Calculate Tier 3 commission if applicable
      IF v_achievement_rate >= v_rule.tier3_from THEN
        tier3_commission := ROUND(
          v_tier3_amount * v_rule.tier3_rate,
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

-- Example calculation:
-- Target: 250,000
-- Sales: 300,000
-- Achievement: 120%
-- 
-- Tier 1: 175,000 (70% of target) × 0.0025 = 437.50
-- Tier 2: 75,000 (30% of target) × 0.003 = 225.00
-- Tier 3: 50,000 (amount over target) × 0.004 = 200.00
-- Total Commission: 862.50