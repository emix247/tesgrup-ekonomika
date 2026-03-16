import type { TaxInput, TaxResult, VatItem } from './tax';
import { calculateTaxFO, calculateTaxSRO, calculateTaxSPV, calculateTaxDruzstvo } from './tax';

export interface SensitivityScenario {
  label: string;
  revenueMultiplier: number;
  costMultiplier: number;
  adjustedRevenue: number;
  adjustedCosts: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  roe: number;
}

const SCENARIOS = [
  { label: 'Základní scénář', revMul: 1.0, costMul: 1.0 },
  { label: 'Ceny −5 %', revMul: 0.95, costMul: 1.0 },
  { label: 'Ceny −10 %', revMul: 0.90, costMul: 1.0 },
  { label: 'Náklady +10 %', revMul: 1.0, costMul: 1.10 },
  { label: 'Ceny −5 %, Náklady +10 %', revMul: 0.95, costMul: 1.10 },
  { label: 'Ceny −10 %, Náklady +10 %', revMul: 0.90, costMul: 1.10 },
];

function getTaxCalculator(form: string) {
  switch (form) {
    case 'fo': return calculateTaxFO;
    case 'sro': return calculateTaxSRO;
    case 'sro_spv': return calculateTaxSPV;
    case 'druzstvo': return calculateTaxDruzstvo;
    default: return calculateTaxSRO;
  }
}

export function calculateSensitivity(
  baseRevenue: number,
  baseCosts: number,
  financingCosts: number,
  equity: number,
  taxForm: string,
  taxInput: Omit<TaxInput, 'grossProfit' | 'totalRevenue' | 'totalCosts'>,
  revenueItems?: VatItem[],
  costItems?: VatItem[],
): SensitivityScenario[] {
  const calc = getTaxCalculator(taxForm);

  return SCENARIOS.map(s => {
    const adjRevenue = baseRevenue * s.revMul;
    const adjCosts = baseCosts * s.costMul;
    const grossProfit = adjRevenue - adjCosts - financingCosts;

    // Scale per-item arrays with multipliers
    const adjRevenueItems = revenueItems?.map(item => ({ ...item, amount: item.amount * s.revMul }));
    const adjCostItems = costItems?.map(item => ({ ...item, amount: item.amount * s.costMul }));

    const taxResult = calc({
      ...taxInput,
      totalRevenue: adjRevenue,
      totalCosts: adjCosts + financingCosts,
      grossProfit,
      revenueItems: adjRevenueItems,
      costItems: adjCostItems,
    });

    const netProfit = taxResult.netProfit;

    return {
      label: s.label,
      revenueMultiplier: s.revMul,
      costMultiplier: s.costMul,
      adjustedRevenue: adjRevenue,
      adjustedCosts: adjCosts,
      grossProfit,
      netProfit,
      grossMargin: adjRevenue > 0 ? grossProfit / adjRevenue : 0,
      netMargin: adjRevenue > 0 ? netProfit / adjRevenue : 0,
      roe: equity > 0 ? netProfit / equity : 0,
    };
  });
}
