import Link from 'next/link';
import { getProjectById } from '@/lib/queries/projects';
import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getForecastCosts, getActualCosts } from '@/lib/queries/costs';
import { getFinancing } from '@/lib/queries/financing';
import { getSales } from '@/lib/queries/sales';
import { getPaymentsByProject } from '@/lib/queries/payments';
import { getMilestones } from '@/lib/queries/milestones';
import { getTaxConfig } from '@/lib/queries/tax';
import { getOverheadCosts, getOverheadAllocations } from '@/lib/queries/overhead';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import { calculateProjectOverhead } from '@/lib/calculations/overhead';
import { calculateTaxSRO, calculateTaxFO, calculateTaxSPV, calculateTaxDruzstvo } from '@/lib/calculations/tax';
import { calculateProfitSummary } from '@/lib/calculations/profit';
import { notFound } from 'next/navigation';
import { grossToNet } from '@/lib/utils/vat';
import { formatCZK, formatPercent, formatDate } from '@/lib/utils/format';
import { MILESTONE_STATUSES } from '@/lib/utils/constants';
import NakladyPieChart from '@/components/charts/NakladyPieChart';
import MiniProgressBar from '@/components/charts/MiniProgressBar';

export const dynamic = 'force-dynamic';

export default async function ProjectDashboard({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const units = await getRevenueUnits(projectId);
  const extras = await getRevenueExtras(projectId);
  const forecast = await getForecastCosts(projectId);
  const actual = await getActualCosts(projectId);
  const fin = await getFinancing(projectId);
  const sales = await getSales(projectId);
  const projectPayments = await getPaymentsByProject(projectId);
  const milestones = await getMilestones(projectId);
  const taxCfg = await getTaxConfig(projectId);
  const ohCosts = await getOverheadCosts();
  const ohAllocations = await getOverheadAllocations();

  // Gross (vč. DPH) totals
  const totalRevenueGross = units.reduce((s, u) => s + (u.totalPrice || 0), 0) + extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
  const directForecastCostsGross = forecast.reduce((s, c) => s + c.amount, 0);
  const actualCostsGross = actual.reduce((s, c) => s + c.amount, 0);

  const finSummary = fin ? calculateFinancingSummary(fin) : null;
  const financingCost = finSummary?.totalFinancingCost || 0;
  const equity = fin?.equityAmount || 0;

  // Overhead allocation
  const oh = calculateProjectOverhead(project.id, project.constructionStartDate, project.endDate, ohCosts, ohAllocations);

  const taxForm = taxCfg?.taxForm || 'sro';
  const isVatPayer = taxForm === 'sro';

  // For VAT payers: compute everything bez DPH (DPH is neutral — gets returned)
  // For non-VAT payers: use gross amounts as-is
  const totalRevenue = isVatPayer
    ? units.reduce((s, u) => s + Math.round(grossToNet(u.totalPrice || 0, u.vatRate ?? 12)), 0)
      + extras.reduce((s, e) => s + Math.round(grossToNet(e.totalPrice || 0, e.vatRate ?? 12)), 0)
    : totalRevenueGross;

  const directForecastCosts = isVatPayer
    ? forecast.reduce((s, c) => s + Math.round(grossToNet(c.amount, c.vatRate ?? 21)), 0)
    : directForecastCostsGross;

  const overheadBezDph = isVatPayer ? Math.round(grossToNet(oh.totalOverhead, 21)) : oh.totalOverhead;
  const forecastCosts = directForecastCosts + overheadBezDph;

  const actualCosts = isVatPayer
    ? actual.reduce((s, c) => s + Math.round(grossToNet(c.amount, c.vatRate ?? 21)), 0)
    : actualCostsGross;

  // Tax-exempt revenue (bez DPH if VAT payer)
  const taxableRevenue = isVatPayer
    ? units.filter(u => !u.taxExempt).reduce((s, u) => s + Math.round(grossToNet(u.totalPrice || 0, u.vatRate ?? 12)), 0)
      + extras.filter(e => !e.taxExempt).reduce((s, e) => s + Math.round(grossToNet(e.totalPrice || 0, e.vatRate ?? 12)), 0)
    : units.filter(u => !u.taxExempt).reduce((s, u) => s + (u.totalPrice || 0), 0)
      + extras.filter(e => !e.taxExempt).reduce((s, e) => s + (e.totalPrice || 0), 0);

  const grossProfit = totalRevenue - forecastCosts - financingCost;

  const taxCalc = { fo: calculateTaxFO, sro: calculateTaxSRO, sro_spv: calculateTaxSPV, druzstvo: calculateTaxDruzstvo };
  const calcFn = taxCalc[taxForm as keyof typeof taxCalc] || calculateTaxSRO;

  // Build per-item arrays for DPH calculation
  const revenueItems = [
    ...units.filter(u => !u.taxExempt).map(u => ({ amount: u.totalPrice || 0, vatRate: u.vatRate ?? 12 })),
    ...extras.filter(e => !e.taxExempt).map(e => ({ amount: e.totalPrice || 0, vatRate: e.vatRate ?? 12 })),
  ];
  const costItems = [
    ...forecast.map(c => ({ amount: c.amount, vatRate: c.vatRate ?? 21 })),
    ...(oh.totalOverhead > 0 ? [{ amount: oh.totalOverhead, vatRate: 21 }] : []),
  ];

  const taxResult = calcFn({
    grossProfit,
    totalRevenue: taxableRevenue,
    totalCosts: forecastCosts + financingCost,
    vatRateRevenue: isVatPayer ? 12 : 0,
    vatRateCosts: 21,
    isVatPayer,
    foOtherIncome: taxCfg?.foOtherIncome ?? 0,
    revenueItems,
    costItems,
  });

  let durationMonths = 24;
  if (project.startDate && project.endDate) {
    const s = new Date(project.startDate);
    const e = new Date(project.endDate);
    durationMonths = Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
  }

  const profitSummary = calculateProfitSummary(totalRevenue, forecastCosts, financingCost, equity, taxResult, durationMonths);

  const activeSales = sales.filter(s => s.status !== 'stornovano');
  // Fallback to unit totalPrice when agreedPrice is not set
  function saleValue(sale: typeof sales[0]): number {
    if (sale.agreedPrice) return sale.agreedPrice;
    const unit = units.find(u => u.id === sale.unitId);
    return unit?.totalPrice || 0;
  }
  const contractedValue = activeSales.filter(s => ['smlouva', 'zaplaceno', 'predano'].includes(s.status))
    .reduce((s, sale) => s + saleValue(sale), 0);
  // Real paid value = SUM of actual payments (excludes nedanene if VAT payer logic needed)
  const paidValue = projectPayments.reduce((s, p) => s + p.amount, 0);
  const paidDanene = projectPayments.filter(p => p.notes !== 'nedanene').reduce((s, p) => s + p.amount, 0);
  const paidNedanene = projectPayments.filter(p => p.notes === 'nedanene').reduce((s, p) => s + p.amount, 0);

  // Tax-exempt (nedaněno) summary — already in bez DPH for VAT payers
  const taxExemptRevenue = totalRevenue - taxableRevenue;
  const dppoSaving = Math.round(taxExemptRevenue * 0.21);

  const recentMilestones = milestones.slice(0, 5);

  const navItems = [
    { title: 'Příjmy', desc: 'Jednotky, extras, stav prodejů', href: `/projekty/${projectId}/prijmy` },
    { title: 'Náklady', desc: 'Plán vs. skutečnost', href: `/projekty/${projectId}/naklady` },
    { title: 'Financování', desc: 'Kapitál, úvěry, čerpání', href: `/projekty/${projectId}/financovani` },
    { title: 'Daně & Výstupy', desc: 'ROE, IRR, citlivostní analýza', href: `/projekty/${projectId}/dane-vystupy` },
    { title: 'Milníky', desc: 'Harmonogram a plnění', href: `/projekty/${projectId}/milniky` },
    { title: 'Srovnání', desc: 'Variance report', href: `/projekty/${projectId}/srovnani` },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          label={isVatPayer ? 'Příjmy bez DPH' : 'Plánované příjmy'}
          value={formatCZK(totalRevenue)}
          subtitle={isVatPayer ? `Vč. DPH: ${formatCZK(totalRevenueGross)}` : `Smluvní: ${formatCZK(contractedValue)}`}
          progress={totalRevenue > 0 ? contractedValue / totalRevenue : 0}
          progressColor={contractedValue >= totalRevenue ? 'emerald' : 'blue'}
        />
        <KpiCard
          label={isVatPayer ? 'Náklady bez DPH' : 'Náklady'}
          value={formatCZK(forecastCosts + financingCost)}
          subtitle={`Skutečné: ${formatCZK(actualCosts)}`}
          progress={(forecastCosts + financingCost) > 0 ? actualCosts / (forecastCosts + financingCost) : 0}
          progressColor={actualCosts > (forecastCosts + financingCost) ? 'red' : 'emerald'}
        />
        <KpiCard
          label="Hrubý zisk"
          value={formatCZK(grossProfit)}
          subtitle={`Marže: ${formatPercent(profitSummary.grossMargin * 100)}`}
          color={grossProfit >= 0 ? 'emerald' : 'red'}
        />
        <KpiCard
          label={isVatPayer ? 'Čistý zisk (po DPPO)' : 'Čistý zisk'}
          value={formatCZK(profitSummary.netProfit)}
          subtitle={isVatPayer ? `DPPO 21 %: ${formatCZK(grossProfit - profitSummary.netProfit)}` : `Marže: ${formatPercent(profitSummary.netMargin * 100)}`}
          color={profitSummary.netProfit >= 0 ? 'emerald' : 'red'}
        />
        <KpiCard
          label="ROE"
          value={formatPercent(profitSummary.roe * 100)}
          subtitle={`IRR: ${profitSummary.irr !== null ? formatPercent(profitSummary.irr * 100) : 'N/A'}`}
          color={profitSummary.roe > 0.15 ? 'emerald' : profitSummary.roe > 0 ? 'amber' : 'red'}
        />
      </div>

      {/* Row 2: Sales + Cost chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Prodeje</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
            <div>
              <div className="text-[10px] sm:text-xs text-gray-500">Jednotek</div>
              <div className="text-sm sm:text-lg font-bold">{units.length}</div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-gray-500">Aktivních prodejů</div>
              <div className="text-sm sm:text-lg font-bold text-primary-600">{activeSales.length}</div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-gray-500">Smluvní hodnota</div>
              <div className="text-sm sm:text-lg font-bold text-emerald-600 truncate">{formatCZK(contractedValue)}</div>
            </div>
          </div>
          <MiniProgressBar value={activeSales.length} max={units.length} color="blue" className="mt-2" />
          <div className="text-xs text-gray-400 mt-1">
            {units.length > 0 ? `${((activeSales.length / units.length) * 100).toFixed(0)} % jednotek v prodeji` : 'Žádné jednotky'}
          </div>
        </div>
        <NakladyPieChart costs={forecast} />
      </div>

      {/* Row 3: Financování mini-widget */}
      {finSummary && (fin?.bankLoanAmount || fin?.investorLoanAmount) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold">Financování</h3>
            <Link href={`/projekty/${projectId}/financovani`} className="text-xs text-primary-600 hover:text-primary-700">Detail →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] sm:text-xs text-gray-500">Vlastní kapitál</div>
              <div className="text-sm sm:text-lg font-bold">{formatCZK(equity)}</div>
            </div>
            {fin?.bankLoanAmount ? (
              <div>
                <div className="text-[10px] sm:text-xs text-gray-500">Bankovní úvěr</div>
                <div className="text-sm sm:text-lg font-bold">{formatCZK(fin.bankLoanAmount)}</div>
                <div className="text-[10px] text-gray-400">{fin.bankLoanRate} % p.a.</div>
              </div>
            ) : null}
            {fin?.investorLoanAmount ? (
              <div>
                <div className="text-[10px] sm:text-xs text-gray-500">Investorský úvěr</div>
                <div className="text-sm sm:text-lg font-bold">{formatCZK(fin.investorLoanAmount)}</div>
                <div className="text-[10px] text-gray-400">{fin.investorLoanRate} % p.a.</div>
              </div>
            ) : null}
            <div>
              <div className="text-[10px] sm:text-xs text-gray-500">Náklady financování</div>
              <div className="text-sm sm:text-lg font-bold text-amber-600">{formatCZK(financingCost)}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Row 4: Platby & Nedaněno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Přijaté platby */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Přijaté platby</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600">{formatCZK(paidValue)}</span>
            <span className="text-xs text-gray-400">z {formatCZK(totalRevenue)} plánovaných</span>
          </div>
          <MiniProgressBar value={paidValue} max={totalRevenue || 1} color="emerald" showLabel className="mb-2" />
          {paidNedanene > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
              <div>
                <div className="text-[10px] sm:text-xs text-gray-500">Daněné</div>
                <div className="text-sm font-semibold text-blue-600">{formatCZK(paidDanene)}</div>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs text-gray-500">Nedaněné</div>
                <div className="text-sm font-semibold text-orange-600">{formatCZK(paidNedanene)}</div>
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {projectPayments.length} {projectPayments.length === 1 ? 'platba' : projectPayments.length < 5 ? 'platby' : 'plateb'} celkem
          </div>
        </div>

        {/* Nedaněné příjmy & úspora DPPO */}
        <div className={`rounded-xl border p-4 sm:p-6 ${taxExemptRevenue > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            Příjmy bez zdanění
            {taxExemptRevenue > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">Nedaněno</span>
            )}
          </h3>
          {taxExemptRevenue > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Nedaněné příjmy</div>
                  <div className="text-lg sm:text-xl font-bold text-orange-700">{formatCZK(taxExemptRevenue)}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Úspora DPPO (21 %)</div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-600">{formatCZK(dppoSaving)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Nedaněné položky tvoří {totalRevenue > 0 ? formatPercent((taxExemptRevenue / totalRevenue) * 100) : '0 %'} celkových příjmů.
                Úspora představuje 21 % DPPO, které by se jinak odvedlo.
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">Žádné příjmové položky nejsou označeny jako nedaněné.</div>
          )}
        </div>
      </div>

      {/* Row 4: Milestones */}
      {recentMilestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Milníky</h3>
            <Link href={`/projekty/${projectId}/milniky`} className="text-sm text-primary-600 hover:text-primary-700">
              Zobrazit vše →
            </Link>
          </div>
          <div className="space-y-2">
            {recentMilestones.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <MilestoneStatusDot status={m.status} />
                  <span className="text-xs sm:text-sm font-medium truncate">{m.name}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">{m.plannedDate ? formatDate(m.plannedDate) : '—'}</span>
                  <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${getMilestoneStatusStyle(m.status)}`}>
                    {MILESTONE_STATUSES[m.status as keyof typeof MILESTONE_STATUSES] || m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 5: Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all">
            <h4 className="font-semibold text-sm text-gray-900">{item.title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtitle, color = 'gray', progress, progressColor = 'blue' }: {
  label: string; value: string; subtitle?: string; color?: string;
  progress?: number; progressColor?: 'blue' | 'emerald' | 'red';
}) {
  const colorClass = { emerald: 'text-emerald-600', red: 'text-red-600', amber: 'text-amber-600', gray: 'text-gray-900' }[color] || 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
      <div className="text-xs sm:text-sm text-gray-500">{label}</div>
      <div className={`text-sm sm:text-xl font-bold mt-1 ${colorClass} truncate`}>{value}</div>
      {subtitle && <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{subtitle}</div>}
      {progress !== undefined && (
        <div className="mt-2"><MiniProgressBar value={progress * 100} max={100} color={progressColor} showLabel /></div>
      )}
    </div>
  );
}

function MilestoneStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { ceka: 'bg-gray-300', probiha: 'bg-blue-400', splneno: 'bg-emerald-400', zpozdeno: 'bg-red-400' };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-gray-300'}`} />;
}

function getMilestoneStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    ceka: 'bg-gray-100 text-gray-600', probiha: 'bg-blue-100 text-blue-700',
    splneno: 'bg-emerald-100 text-emerald-700', zpozdeno: 'bg-red-100 text-red-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-600';
}
