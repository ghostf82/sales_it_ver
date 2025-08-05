/*
  # Add commission calculation function
  
  1. Changes
    - Add function to calculate commission based on target achievement
    - Commission rates:
      - 50-70%: 0.0025 on 70% of sales
      - 71-100%: Additional 0.0030 on remaining sales up to 100%
      - >100%: Additional 0.0040 on sales above 100%
    
  2. Security
    - Function is accessible to authenticated users
*/

CREATE OR REPLACE FUNCTION calculate_commission(
  sales numeric,
  target numeric
) RETURNS numeric AS $$
DECLARE
  achievement_rate numeric;
  commission numeric := 0;
  base_sales numeric;
  mid_sales numeric;
  excess_sales numeric;
BEGIN
  -- Return 0 if target is 0 to avoid division by zero
  IF target = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate achievement rate
  achievement_rate := (sales / target) * 100;

  -- Calculate commission based on achievement rate
  IF achievement_rate >= 50 THEN
    -- Calculate base commission (50-70%)
    base_sales := LEAST(sales, target * 0.7);
    commission := base_sales * 0.0025;

    -- Calculate mid-tier commission (71-100%)
    IF achievement_rate > 70 THEN
      mid_sales := LEAST(sales - (target * 0.7), target * 0.3);
      commission := commission + (mid_sales * 0.0030);

      -- Calculate excess commission (>100%)
      IF achievement_rate > 100 THEN
        excess_sales := sales - target;
        commission := commission + (excess_sales * 0.0040);
      END IF;
    END IF;
  END IF;

  RETURN ROUND(commission, 2);
END;
$$ LANGUAGE plpgsql;