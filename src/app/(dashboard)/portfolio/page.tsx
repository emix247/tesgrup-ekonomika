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
import { grossToNet } from '@/lib/utils/vat';
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

    const taxForm = taxCfg?.taxForm || 'sro';
    const dph = getDphSettings(taxForm);
    const isVP = dph.isVatPayer;

    const finSummary = fin ? calculateFinancingSummary(fin) : null;
    const financingCost = finSummary?.totalFinancingCost || 0;

    // Overhead allocation
    const oh = calculateProjectOverhead(p.id, p.constructionStartDate, p.endDate, ohCosts, ohAllocations);

    // For VAT payers: use bez DPH values
    const revenue = isVP
      ? units.reduce((s, u) => s + Math.round(grossToNet(u.totalPrice || 0, u.vatRate ?? 12)), 0)
        + extras.reduce((s, e) => s + Math.round(grossToNet(e.totalPrice || 0, e.vatRate ?? 12)), 0)
      : units.reduce((s, u) => s + (u.totalPrice || 0), 0) + extras.reduce((s, e) => s + (e.totalPrice || 0), 0);

    const directForecastCost = isVP
      ? costs.reduce((s, c) => s + Math.round(grossToNet(c.amount, c.vatRate ?? 21)), 0)
      : costs.reduce((s, c) => s + c.amount, 0);
    const overheadNet = isVP ? Math.round(grossToNet(oh.totalOverhead, 21)) : oh.totalOverhead;
    const forecastCost = directForecastCost + overheadNet;

    const actualCost = isVP
      ? actuals.reduce((s, c) => s + Math.round(grossToNet(c.amount, c.vatRate ?? 21)), 0)
      : actuals.reduce((s, c) => s + c.amount, 0);

    const taxableRevenue = isVP
      ? units.filter(u => !u.taxExempt).reduce((s, u) => s + Math.round(grossToNet(u.totalPrice || 0, u.vatRate ?? 12)), 0)
        + extras.filter(e => !e.taxExempt).reduce((s, e) => s + Math.round(grossToNet(e.totalPrice || 0, e.vatRate ?? 12)), 0)
      : units.filter(u => !u.taxExempt).reduce((s, u) => s + (u.totalPrice || 0), 0)
        + extras.filter(e => !e.taxExempt).reduce((s, e) => s + (e.totalPrice || 0), 0);

    const grossProfit = revenue - forecastCost - financingCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

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
        <div className="flex gap-2 shrink-0">
          <button onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 9.456l-.003-.062m0 .062a48.536 48.536 0 0 1-.003.062" /></svg>
            Tisk
          </button>
          <Link href="/projekty/novy"
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Nový projekt</span>
            <span className="sm:hidden">Nový</span>
          </Link>
        </div>
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
