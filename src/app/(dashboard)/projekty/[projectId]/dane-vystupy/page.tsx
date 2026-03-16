import { getProjectById } from '@/lib/queries/projects';
import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getForecastCosts } from '@/lib/queries/costs';
import { getFinancing } from '@/lib/queries/financing';
import { getTaxConfig } from '@/lib/queries/tax';
import { getOverheadCosts, getOverheadAllocations } from '@/lib/queries/overhead';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import { calculateProjectOverhead } from '@/lib/calculations/overhead';
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
  const ohCosts = await getOverheadCosts();
  const ohAllocations = await getOverheadAllocations();

  const totalRevenue =
    units.reduce((s, u) => s + (u.totalPrice || 0), 0) +
    extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
  const directCosts = costs.reduce((s, c) => s + c.amount, 0);

  const finSummary = fin ? calculateFinancingSummary(fin) : null;
  const financingCost = finSummary?.totalFinancingCost || 0;
  const equity = fin?.equityAmount || 0;

  // Overhead allocation
  const oh = calculateProjectOverhead(project.id, project.constructionStartDate, project.endDate, ohCosts, ohAllocations);
  const totalCosts = directCosts + oh.totalOverhead;

  const grossProfit = totalRevenue - totalCosts - financingCost;

  const taxForm = taxCfg?.taxForm || 'sro';
  const dph = getDphSettings(taxForm);

  // Build per-item arrays for precise DPH calculation
  const revenueItems = [
    ...units.map(u => ({ amount: u.totalPrice || 0, vatRate: u.vatRate ?? 12 })),
    ...extras.map(e => ({ amount: e.totalPrice || 0, vatRate: e.vatRate ?? 12 })),
  ];
  const costItems = [
    ...costs.map(c => ({ amount: c.amount, vatRate: c.vatRate ?? 21 })),
    ...(oh.totalOverhead > 0 ? [{ amount: oh.totalOverhead, vatRate: 21 }] : []),
  ];

  const taxInput = {
    grossProfit,
    totalRevenue,
    totalCosts: totalCosts + financingCost,
    vatRateRevenue: dph.vatRateRevenue,
    vatRateCosts: dph.vatRateCosts,
    isVatPayer: dph.isVatPayer,
    foOtherIncome: taxCfg?.foOtherIncome ?? 0,
    revenueItems,
    costItems,
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
  }, revenueItems, costItems);

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
