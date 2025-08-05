/*
  # Add commission rules table and functions
  
  1. New Tables
    - `commission_rules`
      - `id` (uuid, primary key)
      - `category` (text, unique)
      - `tier1_from` (numeric)
      - `tier1_to` (numeric)
      - `tier1_rate` (numeric)
      - `tier2_from` (numeric)
      - `tier2_to` (numeric)
      - `tier2_rate` (numeric)
      - `tier3_from` (numeric)
      - `tier3_rate` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `updated_by` (uuid)
  
  2. Security
    - Enable RLS
    - Only admins can modify rules
    - All authenticated users can read rules
*/

-- Create commission_rules table
CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text UNIQUE NOT NULL,
  tier1_from numeric NOT NULL DEFAULT 50,
  tier1_to numeric NOT NULL DEFAULT 70,
  tier1_rate numeric NOT NULL DEFAULT 0.0025,
  tier2_from numeric NOT NULL DEFAULT 71,
  tier2_to numeric NOT NULL DEFAULT 100,
  tier2_rate numeric NOT NULL DEFAULT 0.003,
  tier3_from numeric NOT NULL DEFAULT 101,
  tier3_rate numeric NOT NULL DEFAULT 0.004,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_tier1_range CHECK (tier1_from < tier1_to),
  CONSTRAINT valid_tier2_range CHECK (tier2_from < tier2_to),
  CONSTRAINT valid_tier_sequence CHECK (tier1_to < tier2_from AND tier2_to < tier3_from)
);

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- Policies for commission_rules
CREATE POLICY "Enable read access for authenticated users"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users only"
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "Enable update for admin users only"
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "Enable delete for admin users only"
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Function to handle commission rule updates
CREATE OR REPLACE FUNCTION handle_commission_rule_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission_rules
CREATE TRIGGER commission_rule_update
  BEFORE UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION handle_commission_rule_update();

-- Function to calculate commission based on dynamic rules
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

  -- If no rules found or target is 0, return zeros
  IF NOT FOUND OR p_target = 0 THEN
    RETURN;
  END IF;

  -- Calculate achievement rate
  v_achievement_rate := (p_sales / p_target) * 100;

  -- Calculate Tier 1 commission if achievement rate meets minimum
  IF v_achievement_rate >= v_rule.tier1_from THEN
    -- Calculate on the portion up to tier1_to
    tier1_commission := ROUND(
      LEAST(p_target * (v_rule.tier1_to / 100), p_sales) * v_rule.tier1_rate,
      2
    );

    -- Calculate Tier 2 commission if applicable
    IF v_achievement_rate >= v_rule.tier2_from THEN
      tier2_commission := ROUND(
        LEAST(
          p_target * ((v_rule.tier2_to - v_rule.tier2_from) / 100),
          p_sales - (p_target * (v_rule.tier1_to / 100))
        ) * v_rule.tier2_rate,
        2
      );

      -- Calculate Tier 3 commission if applicable
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