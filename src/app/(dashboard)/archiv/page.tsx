import Link from 'next/link';
import { getArchivedProjects } from '@/lib/queries/projects';
import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getForecastCosts, getActualCosts } from '@/lib/queries/costs';
import { getFinancing } from '@/lib/queries/financing';
import { getSales } from '@/lib/queries/sales';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import { PROJECT_TYPES } from '@/lib/utils/constants';
import { formatCZK, formatPercent } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function ArchivPage() {
  const projects = await getArchivedProjects();

  let totalRevenue = 0;
  let totalCosts = 0;
  let totalActualCosts = 0;
  let totalFinancing = 0;

  const projectCards = await Promise.all(projects.map(async p => {
    const units = await getRevenueUnits(p.id);
    const extras = await getRevenueExtras(p.id);
    const costs = await getForecastCosts(p.id);
    const actuals = await getActualCosts(p.id);
    const fin = await getFinancing(p.id);
    const sales = await getSales(p.id);

    const revenue = units.reduce((s, u) => s + (u.totalPrice || 0), 0) + extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
    const forecastCost = costs.reduce((s, c) => s + c.amount, 0);
    const actualCost = actuals.reduce((s, c) => s + c.amount, 0);
    const finSummary = fin ? calculateFinancingSummary(fin) : null;
    const financingCost = finSummary?.totalFinancingCost || 0;
    const grossProfit = revenue - forecastCost - financingCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    totalRevenue += revenue;
    totalCosts += forecastCost;
    totalActualCosts += actualCost;
    totalFinancing += financingCost;

    const activeSales = sales.filter(s => s.status !== 'stornovano');

    return {
      ...p,
      revenue,
      forecastCost,
      actualCost,
      financingCost,
      grossProfit,
      margin,
      unitCount: units.length,
      soldCount: activeSales.length,
      contractedValue: activeSales.reduce((s, sale) => s + (sale.agreedPrice || 0), 0),
    };
  }));

  const totalGrossProfit = totalRevenue - totalCosts - totalFinancing;
  const totalMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Archiv</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {projects.length > 0
              ? `${projects.length} archivovan${projects.length === 1 ? 'ý' : projects.length < 5 ? 'é' : 'ých'} projekt${projects.length === 1 ? '' : projects.length < 5 ? 'y' : 'ů'}`
              : 'Žádné archivované projekty'}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Archiv je prázdný</h3>
          <p className="mt-2 text-sm text-gray-500">Archivované projekty se zobrazí zde.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <SummaryCard label="Celkové výnosy" value={formatCZK(totalRevenue)} />
            <SummaryCard label="Plánované náklady" value={formatCZK(totalCosts)} />
            <SummaryCard label="Skutečné náklady" value={formatCZK(totalActualCosts)} />
            <SummaryCard label="Hrubý zisk" value={formatCZK(totalGrossProfit)}
              color={totalGrossProfit >= 0 ? 'emerald' : 'red'}
              subtitle={`Marže: ${formatPercent(totalMargin)}`} />
            <SummaryCard label="Financování" value={formatCZK(totalFinancing)} />
          </div>

          {/* Project table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Projekt</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Typ</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Příjmy</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Náklady</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Skutečné</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Zisk</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Marže</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Prodeje</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projectCards.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/projekty/${p.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                          {p.name}
                        </Link>
                        {p.location && <div className="text-xs text-gray-400">{p.location}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {PROJECT_TYPES[p.type as keyof typeof PROJECT_TYPES] || p.type}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCZK(p.revenue)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCZK(p.forecastCost)}</td>
                      <td className="px-4 py-3 text-right font-medium hidden md:table-cell">{formatCZK(p.actualCost)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCZK(p.grossProfit)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${p.margin >= 15 ? 'text-emerald-600' : p.margin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {formatPercent(p.margin)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 hidden lg:table-cell">
                        {p.soldCount}/{p.unitCount}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/projekty/${p.id}`}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap">
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {projectCards.length > 1 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
                      <td className="px-4 py-3 text-gray-700">Celkem</td>
                      <td className="hidden sm:table-cell"></td>
                      <td className="px-4 py-3 text-right">{formatCZK(totalRevenue)}</td>
                      <td className="px-4 py-3 text-right">{formatCZK(totalCosts)}</td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">{formatCZK(totalActualCosts)}</td>
                      <td className={`px-4 py-3 text-right ${totalGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCZK(totalGrossProfit)}
                      </td>
                      <td className={`px-4 py-3 text-right hidden sm:table-cell ${totalMargin >= 15 ? 'text-emerald-600' : totalMargin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {formatPercent(totalMargin)}
                      </td>
                      <td className="hidden lg:table-cell"></td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
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
