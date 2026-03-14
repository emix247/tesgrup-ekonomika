import { getProjectById } from '@/lib/queries/projects';
import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getForecastCosts } from '@/lib/queries/costs';
import { getFinancing } from '@/lib/queries/financing';
import { getTaxConfig } from '@/lib/queries/tax';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import { calculateAllTaxForms, calculateTaxFO, calculateTaxSRO, calculateTaxSPV, calculateTaxDruzstvo } from '@/lib/calculations/tax';
import { calculateProfitSummary } from '@/lib/calculations/profit';
import { calculateSensitivity } from '@/lib/calculations/sensitivity';
import { notFound } from 'next/navigation';
import DaneVystupyClient from '@/components/unified/DaneVystupyClient';

export const dynamic = 'force-dynamic';

// DPH settings auto-determined by entity type
function getDphSettings(taxForm: string) {
  if (taxForm === 'sro') {
    return { isVatPayer: true, vatRateRevenue: 12, vatRateCosts: 21 };
  }
  return { isVatPayer: false, vatRateRevenue: 0, vatRateCosts: 21 };
}

export default async function DaneVystupyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const units = await getRevenueUnits(projectId);
  const extras = await getRevenueExtras(projectId);
  const costs = await getForecastCosts(projectId);
  const fin = await getFinancing(projectId);
  const taxCfg = await getTaxConfig(projectId);

  const totalRevenue =
    units.reduce((s, u) => s + (u.totalPrice || 0), 0) +
    extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
  const totalCosts = costs.reduce((s, c) => s + c.amount, 0);

  const finSummary = fin ? calculateFinancingSummary(fin) : null;
  const financingCost = finSummary?.totalFinancingCost || 0;
  const equity = fin?.equityAmount || 0;

  const grossProfit = totalRevenue - totalCosts - financingCost;

  const taxForm = taxCfg?.taxForm || 'sro';
  const dph = getDphSettings(taxForm);

  const taxInput = {
    grossProfit,
    totalRevenue,
    totalCosts: totalCosts + financingCost,
    vatRateRevenue: dph.vatRateRevenue,
    vatRateCosts: dph.vatRateCosts,
    isVatPayer: dph.isVatPayer,
    foOtherIncome: taxCfg?.foOtherIncome ?? 0,
  };

  const taxResults = calculateAllTaxForms(taxInput);

  const taxCalc = { fo: calculateTaxFO, sro: calculateTaxSRO, sro_spv: calculateTaxSPV, druzstvo: calculateTaxDruzstvo };
  const calcFn = taxCalc[taxForm as keyof typeof taxCalc] || calculateTaxSRO;
  const selectedTaxResult = calcFn(taxInput);

  let durationMonths = 24;
  if (project.startDate && project.endDate) {
    const s = new Date(project.startDate);
    const e = new Date(project.endDate);
    durationMonths = Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
  }

  const profitSummary = calculateProfitSummary(totalRevenue, totalCosts, financingCost, equity, selectedTaxResult, durationMonths);
  const sensitivity = calculateSensitivity(totalRevenue, totalCosts, financingCost, equity, taxForm, {
    vatRateRevenue: dph.vatRateRevenue, vatRateCosts: dph.vatRateCosts, isVatPayer: dph.isVatPayer, foOtherIncome: taxCfg?.foOtherIncome ?? 0,
  });

  const avgUnitPrice = units.length > 0 ? units.reduce((s, u) => s + (u.totalPrice || 0), 0) / units.length : 0;
  const totalCostsWithFinancing = totalCosts + financingCost + selectedTaxResult.totalTaxBurden;
  const breakEvenUnits = avgUnitPrice > 0 ? Math.ceil(totalCostsWithFinancing / avgUnitPrice) : 0;
  const breakEvenPrice = units.length > 0 ? totalCostsWithFinancing / units.length : 0;

  return (
    <DaneVystupyClient
      projectId={projectId}
      initialConfig={taxCfg}
      taxResults={taxResults}
      selectedTaxResult={selectedTaxResult}
      profitSummary={profitSummary}
      sensitivity={sensitivity}
      totalUnits={units.length}
      breakEvenUnits={breakEvenUnits}
      breakEvenPrice={breakEvenPrice}
      durationMonths={durationMonths}
      totalRevenue={totalRevenue}
      totalCosts={totalCosts}
      financingCost={financingCost}
    />
  );
}
