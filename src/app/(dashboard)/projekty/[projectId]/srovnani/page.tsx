import { getForecastCosts, getActualCosts } from '@/lib/queries/costs';
import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getSales } from '@/lib/queries/sales';
import { getPaymentsByProject } from '@/lib/queries/payments';
import { getFinancing } from '@/lib/queries/financing';
import { getDrawdowns } from '@/lib/queries/drawdowns';
import { getProjectById } from '@/lib/queries/projects';
import { calculateVariance } from '@/lib/calculations/variance';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import { formatCZK, formatPercent } from '@/lib/utils/format';
import { COST_CATEGORIES, SALE_STATUSES } from '@/lib/utils/constants';
import { notFound } from 'next/navigation';
import SCurveChart from '@/components/charts/SCurveChart';
import BarComparisonChart from '@/components/charts/BarComparisonChart';

export const dynamic = 'force-dynamic';

function buildSCurveData(
  forecast: { amount: number }[],
  actual: { amount: number; invoiceDate: string | null }[],
  startDate: string | null,
  endDate: string | null,
) {
  const totalForecast = forecast.reduce((s, c) => s + c.amount, 0);
  if (totalForecast === 0 && actual.length === 0) return [];

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 30 * 24 * 60 * 60 * 1000);
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
  const monthlyPlanned = totalForecast / months;

  const actualByMonth: Record<string, number> = {};
  for (const a of actual) {
    const date = a.invoiceDate || '';
    const key = date.slice(0, 7);
    actualByMonth[key] = (actualByMonth[key] || 0) + a.amount;
  }

  const data: { label: string; plannedCumulative: number; actualCumulative: number }[] = [];
  let plannedCum = 0;
  let actualCum = 0;

  for (let i = 0; i <= months; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getMonth() + 1}/${d.getFullYear()}`;
    plannedCum += monthlyPlanned;
    actualCum += actualByMonth[key] || 0;
    data.push({ label, plannedCumulative: Math.round(plannedCum), actualCumulative: Math.round(actualCum) });
  }

  return data;
}

export default async function SrovnaniPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const forecast = await getForecastCosts(projectId);
  const actual = await getActualCosts(projectId);
  const units = await getRevenueUnits(projectId);
  const extras = await getRevenueExtras(projectId);
  const sales = await getSales(projectId);
  const fin = await getFinancing(projectId);
  const drawdowns = await getDrawdowns(projectId);
  const payments = await getPaymentsByProject(projectId);

  const rows = calculateVariance(forecast, actual);
  const sCurveData = buildSCurveData(forecast, actual, project.startDate, project.endDate);

  const totalForecast = rows.reduce((s, r) => s + r.forecastAmount, 0);
  const totalActual = rows.reduce((s, r) => s + r.actualAmount, 0);
  const totalVariance = totalActual - totalForecast;
  const totalVariancePercent = totalForecast > 0 ? (totalVariance / totalForecast) * 100 : 0;

  // Revenue comparison
  const plannedRevenue = units.reduce((s, u) => s + (u.totalPrice || 0), 0) + extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
  const activeSales = sales.filter(s => s.status !== 'stornovano');
  const contractedRevenue = activeSales.filter(s => ['smlouva', 'zaplaceno', 'predano', 'zaloha'].includes(s.status))
    .reduce((s, sale) => s + (sale.agreedPrice || 0), 0);
  // Paid = sum of actual payments (not based on sale status)
  const paidRevenue = payments.reduce((s, p) => s + p.amount, 0);

  // Financing comparison
  const finSummary = fin ? calculateFinancingSummary(fin) : null;
  const plannedDrawdown = drawdowns.reduce((s, d) => s + (d.plannedAmount || 0), 0);
  const actualDrawdown = drawdowns.reduce((s, d) => s + (d.actualAmount || 0), 0);

  // Bar comparison data
  const comparisonData = Object.entries(COST_CATEGORIES)
    .map(([key, name]) => ({
      category: name,
      plan: forecast.filter(c => c.category === key).reduce((s, c) => s + c.amount, 0),
      actual: actual.filter(c => c.category === key).reduce((s, c) => s + c.amount, 0),
    }))
    .filter(d => d.plan > 0 || d.actual > 0);

  const isComplete = project.status === 'dokonceno';

  return (
    <div className="space-y-6">
      {isComplete && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">✓</div>
          <div>
            <div className="font-semibold text-emerald-800">Projekt dokončen</div>
            <div className="text-sm text-emerald-600">Kompletní srovnání předpokladu a skutečnosti</div>
          </div>
        </div>
      )}

      {/* Cost variance summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <div className="text-xs sm:text-sm text-gray-500">Plánované náklady</div>
          <div className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatCZK(totalForecast)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <div className="text-xs sm:text-sm text-gray-500">Skutečné náklady</div>
          <div className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatCZK(totalActual)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <div className="text-xs sm:text-sm text-gray-500">Odchylka</div>
          <div className={`text-lg sm:text-2xl font-bold mt-1 truncate ${totalVariance > 0 ? 'text-red-600' : totalVariance < 0 ? 'text-emerald-600' : ''}`}>
            {totalVariance > 0 ? '+' : ''}{formatCZK(totalVariance)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <div className="text-xs sm:text-sm text-gray-500">Odchylka %</div>
          <div className={`text-lg sm:text-2xl font-bold mt-1 truncate ${totalVariancePercent > 5 ? 'text-red-600' : totalVariancePercent > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {totalVariancePercent > 0 ? '+' : ''}{formatPercent(totalVariancePercent)}
          </div>
        </div>
      </div>

      {/* Revenue comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Příjmy: Plán vs. Skutečnost</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Plánované příjmy</div>
            <div className="text-xl font-bold mt-1">{formatCZK(plannedRevenue)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Smluvní příjmy</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{formatCZK(contractedRevenue)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {plannedRevenue > 0 ? `${((contractedRevenue / plannedRevenue) * 100).toFixed(0)} % z plánu` : ''}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Přijaté platby</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{formatCZK(paidRevenue)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {plannedRevenue > 0 ? `${((paidRevenue / plannedRevenue) * 100).toFixed(0)} % z plánu` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Financing comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Financování: Plán vs. Skutečnost</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Plánované čerpání</div>
            <div className="text-xl font-bold mt-1">{formatCZK(plannedDrawdown)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Skutečné čerpání</div>
            <div className="text-xl font-bold mt-1">{formatCZK(actualDrawdown)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Rozdíl</div>
            <div className={`text-xl font-bold mt-1 ${actualDrawdown - plannedDrawdown > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {actualDrawdown - plannedDrawdown > 0 ? '+' : ''}{formatCZK(actualDrawdown - plannedDrawdown)}
            </div>
          </div>
        </div>
      </div>

      {/* Variance Table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Variance report: Náklady po kategoriích</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Předpoklad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Skutečnost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Odchylka</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Odchylka %</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.category} className="hover:bg-gray-50">
                  <td className="px-6 py-2.5 text-sm font-medium">{r.categoryName}</td>
                  <td className="px-4 py-2.5 text-sm text-right">{formatCZK(r.forecastAmount)}</td>
                  <td className="px-4 py-2.5 text-sm text-right">{formatCZK(r.actualAmount)}</td>
                  <td className={`px-4 py-2.5 text-sm text-right font-medium ${r.variance > 0 ? 'text-red-600' : r.variance < 0 ? 'text-emerald-600' : ''}`}>
                    {r.variance > 0 ? '+' : ''}{formatCZK(r.variance)}
                  </td>
                  <td className={`px-4 py-2.5 text-sm text-right ${Math.abs(r.variancePercent) > 15 ? 'text-red-600 font-medium' : Math.abs(r.variancePercent) > 5 ? 'text-amber-600' : ''}`}>
                    {r.variancePercent > 0 ? '+' : ''}{formatPercent(r.variancePercent)}
                  </td>
                  <td className="px-4 py-2.5 text-center"><VarianceDot percent={r.variancePercent} /></td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="px-6 py-3 text-sm">Celkem</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(totalForecast)}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(totalActual)}</td>
                <td className={`px-4 py-3 text-sm text-right ${totalVariance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {totalVariance > 0 ? '+' : ''}{formatCZK(totalVariance)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${totalVariancePercent > 5 ? 'text-red-600' : ''}`}>
                  {totalVariancePercent > 0 ? '+' : ''}{formatPercent(totalVariancePercent)}
                </td>
                <td className="px-4 py-3 text-center"><VarianceDot percent={totalVariancePercent} /></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {comparisonData.length > 0 && (
          <BarComparisonChart data={comparisonData} title="Plán vs. Skutečnost per kategorie" layout="horizontal" />
        )}
        <SCurveChart data={sCurveData} />
      </div>
    </div>
  );
}

function VarianceDot({ percent }: { percent: number }) {
  const abs = Math.abs(percent);
  const color = abs > 15 ? 'bg-red-400' : abs > 5 ? 'bg-amber-400' : 'bg-emerald-400';
  return <div className={`w-3 h-3 rounded-full ${color} mx-auto`} />;
}
