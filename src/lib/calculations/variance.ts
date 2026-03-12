import { COST_CATEGORIES } from '@/lib/utils/constants';

export interface VarianceRow {
  category: string;
  categoryName: string;
  forecastAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

export function calculateVariance(
  forecastCosts: { category: string; amount: number }[],
  actualCosts: { category: string; amount: number }[]
): VarianceRow[] {
  return Object.entries(COST_CATEGORIES).map(([key, name]) => {
    const forecastAmount = forecastCosts
      .filter(c => c.category === key)
      .reduce((s, c) => s + c.amount, 0);
    const actualAmount = actualCosts
      .filter(c => c.category === key)
      .reduce((s, c) => s + c.amount, 0);
    const variance = actualAmount - forecastAmount;
    const variancePercent = forecastAmount > 0 ? (variance / forecastAmount) * 100 : 0;

    return {
      category: key,
      categoryName: name,
      forecastAmount,
      actualAmount,
      variance,
      variancePercent,
    };
  }).filter(r => r.forecastAmount > 0 || r.actualAmount > 0);
}
