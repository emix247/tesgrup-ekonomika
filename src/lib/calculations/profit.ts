import { calculateIRR } from './irr';
import type { TaxResult } from './tax';

export interface ProfitSummary {
  totalRevenue: number;
  totalCosts: number;
  financingCosts: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  roe: number;
  irr: number | null;
}

export function calculateProfitSummary(
  totalRevenue: number,
  totalCosts: number,
  financingCosts: number,
  equity: number,
  taxResult: TaxResult | null,
  projectDurationMonths: number
): ProfitSummary {
  const grossProfit = totalRevenue - totalCosts - financingCosts;
  const netProfit = taxResult ? taxResult.netProfit : grossProfit;
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;
  const netMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
  const roe = equity > 0 ? netProfit / equity : 0;

  // Simple IRR: initial investment (negative), then net profit at end
  let irr: number | null = null;
  if (projectDurationMonths > 0 && equity > 0) {
    const periods = Math.ceil(projectDurationMonths / 12);
    const cashFlows = new Array(periods + 1).fill(0);
    cashFlows[0] = -equity;
    cashFlows[periods] = equity + netProfit;
    irr = calculateIRR(cashFlows);
  }

  return {
    totalRevenue,
    totalCosts,
    financingCosts,
    grossProfit,
    grossMargin,
    netProfit,
    netMargin,
    roe,
    irr,
  };
}
