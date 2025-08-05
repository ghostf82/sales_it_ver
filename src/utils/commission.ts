interface CommissionParams {
  sales: number;
  goal: number;
  achievement_percent: number;
  tier1_rate: number;
  tier2_rate: number;
  tier3_rate: number;
}

interface CommissionResult {
  tier1_amount: number;
  tier1_commission: number;
  tier2_amount: number;
  tier2_commission: number;
  tier3_amount: number;
  tier3_commission: number;
  total_commission: number;
}

export function calculateCommission({
  sales,
  goal,
  achievement_percent,
  tier1_rate,
  tier2_rate,
  tier3_rate
}: CommissionParams): CommissionResult {
  let tier1_amount = 0;
  let tier1_commission = 0;
  let tier2_amount = 0;
  let tier2_commission = 0;
  let tier3_amount = 0;
  let tier3_commission = 0;

  if (goal === 0) {
    // Special case: if goal is 0, treat all sales as Tier 1
    tier1_amount = sales;
    tier1_commission = tier1_amount * tier1_rate;
  } else {
    // Tier 1: Always 70% of goal
    tier1_amount = goal * 0.7;
    tier1_commission = tier1_amount * tier1_rate;

    // Tier 2: Fixed 30% of goal if achievement ≥ 71%
    if (achievement_percent >= 71) {
      tier2_amount = goal * 0.3;
      tier2_commission = tier2_amount * tier2_rate;
    }

    // Tier 3: If sales > goal
    if (sales > goal) {
      tier3_amount = sales - goal;
      tier3_commission = tier3_amount * tier3_rate;
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