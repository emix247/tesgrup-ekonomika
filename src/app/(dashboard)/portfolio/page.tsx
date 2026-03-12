import Link from 'next/link';
import { getAllProjects } from '@/lib/queries/projects';
import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getForecastCosts, getActualCosts } from '@/lib/queries/costs';
import { getFinancing } from '@/lib/queries/financing';
import { getSales } from '@/lib/queries/sales';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import { getProjectTrafficLight } from '@/lib/utils/traffic-light';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/utils/constants';
import { formatCZK, formatPercent } from '@/lib/utils/format';
import MiniProgressBar from '@/components/charts/MiniProgressBar';

export const dynamic = 'force-dynamic';

export default function PortfolioPage() {
  const projects = getAllProjects();

  let portfolioRevenue = 0;
  let portfolioCosts = 0;
  let portfolioFinancing = 0;
  let portfolioActualCosts = 0;

  const projectCards = projects.map(p => {
    const units = getRevenueUnits(p.id);
    const extras = getRevenueExtras(p.id);
    const costs = getForecastCosts(p.id);
    const actuals = getActualCosts(p.id);
    const fin = getFinancing(p.id);
    const sales = getSales(p.id);

    const revenue = units.reduce((s, u) => s + (u.totalPrice || 0), 0) + extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
    const forecastCost = costs.reduce((s, c) => s + c.amount, 0);
    const actualCost = actuals.reduce((s, c) => s + c.amount, 0);
    const finSummary = fin ? calculateFinancingSummary(fin) : null;
    const financingCost = finSummary?.totalFinancingCost || 0;
    const grossProfit = revenue - forecastCost - financingCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    portfolioRevenue += revenue;
    portfolioCosts += forecastCost;
    portfolioFinancing += financingCost;
    portfolioActualCosts += actualCost;

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

    return { ...p, revenue, forecastCost, actualCost, financingCost, grossProfit, margin, light, unitCount: units.length, soldCount };
  });

  const portfolioGrossProfit = portfolioRevenue - portfolioCosts - portfolioFinancing;
  const portfolioMargin = portfolioRevenue > 0 ? (portfolioGrossProfit / portfolioRevenue) * 100 : 0;

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-sm text-gray-500 mt-1">Tesgrup Development — přehled {projects.length} projektů</p>
        </div>
        <Link href="/projekty/novy"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nový projekt
        </Link>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard label="Celkové výnosy" value={formatCZK(portfolioRevenue)} />
        <SummaryCard label="Plánované náklady" value={formatCZK(portfolioCosts)} />
        <SummaryCard label="Skutečné náklady" value={formatCZK(portfolioActualCosts)}
          subtitle={portfolioCosts > 0 ? `${((portfolioActualCosts / portfolioCosts) * 100).toFixed(0)} % čerpáno` : undefined} />
        <SummaryCard label="Hrubý zisk" value={formatCZK(portfolioGrossProfit)}
          color={portfolioGrossProfit >= 0 ? 'emerald' : 'red'}
          subtitle={`Marže: ${formatPercent(portfolioMargin)}`} />
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
              </div>
              <div>
                <div className="text-gray-500 text-xs">Marže</div>
                <div className={`font-medium ${p.margin >= 15 ? 'text-emerald-600' : p.margin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatPercent(p.margin)}
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
    </div>
  );
}

function SummaryCard({ label, value, color = 'gray', subtitle }: { label: string; value: string; color?: string; subtitle?: string }) {
  const colorClass = color === 'emerald' ? 'text-emerald-600' : color === 'red' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold mt-1 ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-[10px] text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function TrafficLightDot({ color }: { color: 'green' | 'orange' | 'red' }) {
  const cls = { green: 'bg-emerald-400', orange: 'bg-amber-400', red: 'bg-red-400' }[color];
  return <div className={`w-3 h-3 rounded-full ${cls}`} />;
}
