'use client';

import { formatCZK, formatPercent } from '@/lib/utils/format';
import type { ProfitSummary } from '@/lib/calculations/profit';
import type { TaxResult } from '@/lib/calculations/tax';
import type { SensitivityScenario } from '@/lib/calculations/sensitivity';
import ProfitWaterfallChart from '@/components/charts/ProfitWaterfallChart';

interface Props {
  profitSummary: ProfitSummary;
  taxResult: TaxResult;
  sensitivity: SensitivityScenario[];
  totalUnits: number;
  breakEvenUnits: number;
  breakEvenPrice: number;
  durationMonths: number;
}

export default function VystupyClient({ profitSummary, taxResult, sensitivity, totalUnits, breakEvenUnits, breakEvenPrice, durationMonths }: Props) {
  const p = profitSummary;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Celkové příjmy" value={formatCZK(p.totalRevenue)} />
        <KpiCard label="Celkové náklady" value={formatCZK(p.totalCosts + p.financingCosts)} subtitle={`z toho financování: ${formatCZK(p.financingCosts)}`} />
        <KpiCard label="Hrubý zisk" value={formatCZK(p.grossProfit)} subtitle={`Marže: ${formatPercent(p.grossMargin * 100)}`} color={p.grossProfit >= 0 ? 'emerald' : 'red'} />
        <KpiCard label="Čistý zisk" value={formatCZK(p.netProfit)} subtitle={`Marže: ${formatPercent(p.netMargin * 100)}`} color={p.netProfit >= 0 ? 'emerald' : 'red'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="ROE (výnosnost kapitálu)" value={formatPercent(p.roe * 100)} color={p.roe > 0.15 ? 'emerald' : p.roe > 0 ? 'amber' : 'red'} />
        <KpiCard label="IRR" value={p.irr !== null ? formatPercent(p.irr * 100) : 'N/A'} color={p.irr && p.irr > 0.1 ? 'emerald' : 'gray'} />
        <KpiCard label={`Daňová forma (${taxResult.label})`} value={formatCZK(taxResult.totalTaxBurden)} subtitle={`Efektivní sazba: ${formatPercent(taxResult.effectiveTaxRate * 100)}`} />
        <KpiCard label="Doba projektu" value={`${durationMonths} měs.`} subtitle={`${(durationMonths / 12).toFixed(1)} let`} />
      </div>

      {/* Waterfall Chart */}
      {p.totalRevenue > 0 && (
        <ProfitWaterfallChart
          revenue={p.totalRevenue}
          costs={p.totalCosts}
          financingCosts={p.financingCosts}
          taxBurden={taxResult.totalTaxBurden}
          netProfit={p.netProfit}
        />
      )}

      {/* Break-even */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Break-even analýza</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Celkem jednotek</div>
            <div className="text-2xl font-bold mt-1">{totalUnits}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Break-even (počet prodaných)</div>
            <div className="text-2xl font-bold mt-1">{breakEvenUnits}</div>
            <div className="text-xs text-gray-400 mt-1">
              {totalUnits > 0 ? `${((breakEvenUnits / totalUnits) * 100).toFixed(0)} % jednotek` : ''}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Min. průměrná prodejní cena</div>
            <div className="text-2xl font-bold mt-1">{formatCZK(breakEvenPrice)}</div>
          </div>
        </div>
      </div>

      {/* Sensitivity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Citlivostní analýza</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scénář</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Příjmy</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hrubý zisk</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Čistý zisk</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Marže</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sensitivity.map((s, i) => (
              <tr key={s.label} className={i === 0 ? 'bg-primary-50/30 font-medium' : 'hover:bg-gray-50'}>
                <td className="px-6 py-2.5 text-sm">{s.label}</td>
                <td className="px-4 py-2.5 text-sm text-right">{formatCZK(s.adjustedRevenue)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{formatCZK(s.grossProfit)}</td>
                <td className={`px-4 py-2.5 text-sm text-right font-medium ${s.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCZK(s.netProfit)}
                </td>
                <td className="px-4 py-2.5 text-sm text-right">{formatPercent(s.netMargin * 100)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{formatPercent(s.roe * 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtitle, color = 'gray' }: { label: string; value: string; subtitle?: string; color?: string }) {
  const colorClass = {
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    gray: 'text-gray-900',
  }[color] || 'text-gray-900';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
