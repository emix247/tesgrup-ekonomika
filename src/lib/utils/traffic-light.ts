export type TrafficLight = 'green' | 'orange' | 'red';

export function getProjectTrafficLight(data: {
  totalRevenue: number;
  totalCosts: number;
  financingCosts: number;
  actualCostsTotal: number;
  forecastCostsTotal: number;
  salesCount: number;
  totalUnits: number;
}): TrafficLight {
  // If no data yet, show green (new project)
  if (data.forecastCostsTotal === 0 && data.totalRevenue === 0) return 'green';

  const grossProfit = data.totalRevenue - data.totalCosts - data.financingCosts;
  const grossMargin = data.totalRevenue > 0 ? grossProfit / data.totalRevenue : 0;

  // Cost overrun check
  if (data.forecastCostsTotal > 0 && data.actualCostsTotal > 0) {
    const costVariance = (data.actualCostsTotal - data.forecastCostsTotal) / data.forecastCostsTotal;
    if (costVariance > 0.15) return 'red';
    if (costVariance > 0.05) return 'orange';
  }

  // Profit margin check
  if (grossMargin < 0) return 'red';
  if (grossMargin < 0.1) return 'orange';

  return 'green';
}
