export interface CommissionRule {
  category: string;
  tier1_from: number;
  tier1_to: number;
  tier1_rate: number;
  tier2_from: number;
  tier2_to: number;
  tier2_rate: number;
  tier3_from: number;
  tier3_rate: number;
}

export interface CommissionResult {
  tier1_amount: number;
  tier1_commission: number;
  tier2_amount: number;
  tier2_commission: number;
  tier3_amount: number;
  tier3_commission: number;
  total_commission: number;
}

export function calculateCommission(
  sales: number,
  target: number,
  rule: CommissionRule
): CommissionResult {
  let tier1_amount = 0;
  let tier1_commission = 0;
  let tier2_amount = 0;
  let tier2_commission = 0;
  let tier3_amount = 0;
  let tier3_commission = 0;

  if (target === 0) {
    // Special case: if target is 0, treat all sales as Tier 1
    tier1_amount = sales;
    tier1_commission = tier1_amount * rule.tier1_rate;
  } else {
    const achievementPercent = (sales / target) * 100;

    // Tier 1: Always 70% of target
    tier1_amount = target * 0.7;
    tier1_commission = tier1_amount * rule.tier1_rate;

    // Tier 2: Fixed 30% of target if achievement ≥ 71%
    if (achievementPercent >= 71) {
      tier2_amount = target * 0.3;
      tier2_commission = tier2_amount * rule.tier2_rate;
    }

    // Tier 3: If sales > target
    if (sales > target) {
      tier3_amount = sales - target;
      tier3_commission = tier3_amount * rule.tier3_rate;
    }
  }

  const total_commission = tier1_commission + tier2_commission + tier3_commission;

  return {
    tier1_amount: +tier1_amount.toFixed(2),
    tier1_commission: +tier1_commission.toFixed(2),
    tier2_amount: +tier2_amount.toFixed(2),
    tier2_commission: +tier2_commission.toFixed(2),
    tier3_amount: +tier3_amount.toFixed(2),
    tier3_commission: +tier3_commission.toFixed(2),
    total_commission: +total_commission.toFixed(2)
  };
}