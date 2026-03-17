import Link from 'next/link';
import { getAllProjects } from '@/lib/queries/projects';
import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getForecastCosts, getActualCosts } from '@/lib/queries/costs';
import { getFinancing } from '@/lib/queries/financing';
import { getSales } from '@/lib/queries/sales';
import { getTaxConfig } from '@/lib/queries/tax';
import { getOverheadCosts, getOverheadAllocations } from '@/lib/queries/overhead';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import { calculateProjectOverhead } from '@/lib/calculations/overhead';
import { calculateTaxFO, calculateTaxSRO, calculateTaxSPV, calculateTaxDruzstvo } from '@/lib/calculations/tax';
import { getProjectTrafficLight } from '@/lib/utils/traffic-light';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/utils/constants';
import { formatCZK, formatPercent } from '@/lib/utils/format';
import MiniProgressBar from '@/components/charts/MiniProgressBar';
import PortfolioCharts from '@/components/charts/PortfolioCharts';

export const dynamic = 'force-dynamic';

// DPH settings auto-determined by entity type
function getDphSettings(taxForm: string) {
  if (taxForm === 'sro') {
    return { isVatPayer: true, vatRateRevenue: 12, vatRateCosts: 21 };
  }
  return { isVatPayer: false, vatRateRevenue: 0, vatRateCosts: 21 };
}

export default async function PortfolioPage() {
  const projects = await getAllProjects();
  const ohCosts = await getOverheadCosts();
  const ohAllocations = await getOverheadAllocations();

  let portfolioRevenue = 0;
  let portfolioCosts = 0;
  let portfolioFinancing = 0;
  let portfolioActualCosts = 0;
  let portfolioNetProfit = 0;
  let portfolioTax = 0;

  const projectCards = await Promise.all(projects.map(async p => {
    const units = await getRevenueUnits(p.id);
    const extras = await getRevenueExtras(p.id);
    const costs = await getForecastCosts(p.id);
    const actuals = await getActualCosts(p.id);
    const fin = await getFinancing(p.id);
    const sales = await getSales(p.id);
    const taxCfg = await getTaxConfig(p.id);

    const revenue = units.reduce((s, u) => s + (u.totalPrice || 0), 0) + extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
    const taxableRevenue = units.filter(u => !u.taxExempt).reduce((s, u) => s + (u.totalPrice || 0), 0)
      + extras.filter(e => !e.taxExempt).reduce((s, e) => s + (e.totalPrice || 0), 0);
    const directForecastCost = costs.reduce((s, c) => s + c.amount, 0);
    const actualCost = actuals.reduce((s, c) => s + c.amount, 0);
    const finSummary = fin ? calculateFinancingSummary(fin) : null;
    const financingCost = finSummary?.totalFinancingCost || 0;

    // Overhead allocation
    const oh = calculateProjectOverhead(p.id, p.constructionStartDate, p.endDate, ohCosts, ohAllocations);
    const forecastCost = directForecastCost + oh.totalOverhead;

    const grossProfit = revenue - forecastCost - financingCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Tax calculation for net profit
    const taxForm = taxCfg?.taxForm || 'sro';
    const dph = getDphSettings(taxForm);

    const revenueItems = [
      ...units.filter(u => !u.taxExempt).map(u => ({ amount: u.totalPrice || 0, vatRate: u.vatRate ?? 12 })),
      ...extras.filter(e => !e.taxExempt).map(e => ({ amount: e.totalPrice || 0, vatRate: e.vatRate ?? 12 })),
    ];
    const costItems = [
      ...costs.map(c => ({ amount: c.amount, vatRate: c.vatRate ?? 21 })),
      ...(oh.totalOverhead > 0 ? [{ amount: oh.totalOverhead, vatRate: 21 }] : []),
    ];

    const taxInput = {
      grossProfit,
      totalRevenue: taxableRevenue,
      totalCosts: forecastCost + financingCost,
      vatRateRevenue: dph.vatRateRevenue,
      vatRateCosts: dph.vatRateCosts,
      isVatPayer: dph.isVatPayer,
      foOtherIncome: taxCfg?.foOtherIncome ?? 0,
      revenueItems,
      costItems,
    };

    const taxCalc = { fo: calculateTaxFO, sro: calculateTaxSRO, sro_spv: calculateTaxSPV, druzstvo: calculateTaxDruzstvo };
    const calcFn = taxCalc[taxForm as keyof typeof taxCalc] || calculateTaxSRO;
    const taxResult = calcFn(taxInput);
    const netProfit = taxResult.netProfit;
    const taxBurden = taxResult.totalTaxBurden;

    portfolioRevenue += revenue;
    portfolioCosts += forecastCost;
    portfolioFinancing += financingCost;
    portfolioActualCosts += actualCost;
    portfolioNetProfit += netProfit;
    portfolioTax += taxBurden;

    const activeSales = sales.filter(s => s.status !== 'stornovano');
    const soldCount = activeSales.length;

    const light = getProjectTrafficLight({
      totalRevenue: revenue,
      totalCosts: forecastCost,
      financingCosts: financingCost,
      actualCostsTotal: actualCost,
      forecastCostsTotal: forecastCost,
      salesCount: soldCount,
      totalUnits: units.length,
    });

    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    return { ...p, revenue, forecastCost, actualCost, financingCost, grossProfit, netProfit, margin, netMargin, light, unitCount: units.length, soldCount };
  }));

  const portfolioGrossProfit = portfolioRevenue - portfolioCosts - portfolioFinancing;
  const portfolioMargin = portfolioRevenue > 0 ? (portfolioGrossProfit / portfolioRevenue) * 100 : 0;
  const portfolioNetMargin = portfolioRevenue > 0 ? (portfolioNetProfit / portfolioRevenue) * 100 : 0;

  if (projects.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
            <p className="text-sm text-gray-500 mt-1">Přehled všech developerských projektů</p>
          </div>
        </div>
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Žádné projekty</h3>
          <p className="mt-2 text-sm text-gray-500">Začněte vytvořením prvního projektu.</p>
          <Link href="/projekty/novy" className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            Vytvořit projekt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">Tesgrup Development — přehled {projects.length} projektů</p>
        </div>
        <Link href="/projekty/novy"
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Nový projekt</span>
          <span className="sm:hidden">Nový</span>
        </Link>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <SummaryCard label="Celkové výnosy" value={formatCZK(portfolioRevenue)} />
        <SummaryCard label="Plánované náklady" value={formatCZK(portfolioCosts)} />
        <SummaryCard label="Skutečné náklady" value={formatCZK(portfolioActualCosts)}
          subtitle={portfolioCosts > 0 ? `${((portfolioActualCosts / portfolioCosts) * 100).toFixed(0)} % čerpáno` : undefined} />
        <SummaryCard label="Hrubý zisk" value={formatCZK(portfolioGrossProfit)}
          color={portfolioGrossProfit >= 0 ? 'emerald' : 'red'}
          subtitle={`Marže: ${formatPercent(portfolioMargin)}`} />
        <SummaryCard label="Čistý zisk" value={formatCZK(portfolioNetProfit)}
          color={portfolioNetProfit >= 0 ? 'emerald' : 'red'}
          subtitle={`Marže: ${formatPercent(portfolioNetMargin)}`} />
        <SummaryCard label="Financování" value={formatCZK(portfolioFinancing)} />
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectCards.map(p => (
          <Link
            key={p.id}
            href={`/projekty/${p.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              <TrafficLightDot color={p.light} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <span>{PROJECT_TYPES[p.type as keyof typeof PROJECT_TYPES] || p.type}</span>
              {p.location && <><span>·</span><span>{p.location}</span></>}
              <span>·</span>
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {PROJECT_STATUSES[p.status as keyof typeof PROJECT_STATUSES] || p.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <div className="text-gray-500 text-xs">Příjmy</div>
                <div className="font-medium">{formatCZK(p.revenue)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Náklady</div>
                <div className="font-medium">{formatCZK(p.forecastCost)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Hrubý zisk</div>
                <div className={`font-medium ${p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCZK(p.grossProfit)}
                </div>
                <div className={`text-[10px] ${p.margin >= 15 ? 'text-emerald-500' : p.margin >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                  Marže: {formatPercent(p.margin)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Čistý zisk</div>
                <div className={`font-medium ${p.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCZK(p.netProfit)}
                </div>
                <div className={`text-[10px] ${p.netMargin >= 15 ? 'text-emerald-500' : p.netMargin >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                  Marže: {formatPercent(p.netMargin)}
                </div>
              </div>
            </div>

            {/* Progress bars */}
            {p.unitCount > 0 && (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">Prodáno {p.soldCount}/{p.unitCount} jednotek</div>
                  <MiniProgressBar value={p.soldCount} max={p.unitCount} color="blue" showLabel={false} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">Čerpání nákladů</div>
                  <MiniProgressBar value={p.actualCost} max={p.forecastCost}
                    color={p.actualCost > p.forecastCost ? 'red' : 'emerald'} showLabel={false} />
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Portfolio Charts */}
      <PortfolioCharts
        projects={projectCards.map(p => ({
          name: p.name,
          revenue: p.revenue,
          forecastCost: p.forecastCost,
          grossProfit: p.grossProfit,
          netProfit: p.netProfit,
          financingCost: p.financingCost,
        }))}
        portfolioRevenue={portfolioRevenue}
        portfolioCosts={portfolioCosts}
        portfolioFinancing={portfolioFinancing}
        portfolioTax={portfolioTax}
        portfolioNetProfit={portfolioNetProfit}
      />
    </div>
  );
}

function SummaryCard({ label, value, color = 'gray', subtitle }: { label: string; value: string; color?: string; subtitle?: string }) {
  const colorClass = color === 'emerald' ? 'text-emerald-600' : color === 'red' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
      <div className="text-[10px] sm:text-xs text-gray-500">{label}</div>
      <div className={`text-sm sm:text-lg font-bold mt-1 ${colorClass} truncate`}>{value}</div>
      {subtitle && <div className="text-[10px] text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function TrafficLightDot({ color }: { color: 'green' | 'orange' | 'red' }) {
  const cls = { green: 'bg-emerald-400', orange: 'bg-amber-400', red: 'bg-red-400' }[color];
  return <div className={`w-3 h-3 rounded-full ${cls}`} />;
}
