'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEGAL_FORMS } from '@/lib/utils/constants';
import { formatCZK, formatPercent } from '@/lib/utils/format';
import type { TaxResult } from '@/lib/calculations/tax';
import type { ProfitSummary } from '@/lib/calculations/profit';
import type { SensitivityScenario } from '@/lib/calculations/sensitivity';
import ProfitWaterfallChart from '@/components/charts/ProfitWaterfallChart';
import DonutChart from '@/components/charts/DonutChart';

interface TaxCfg {
  taxForm: string;
  vatPayer: boolean | null;
  vatRateRevenue: number | null;
  vatRateCosts: number | null;
  foOtherIncome: number | null;
}

interface Props {
  projectId: string;
  initialConfig: TaxCfg | undefined;
  taxResults: TaxResult[];
  selectedTaxResult: TaxResult;
  profitSummary: ProfitSummary;
  sensitivity: SensitivityScenario[];
  totalUnits: number;
  breakEvenUnits: number;
  breakEvenPrice: number;
  durationMonths: number;
  totalRevenue: number;
  totalCosts: number;
  financingCost: number;
}

export default function DaneVystupyClient({
  projectId, initialConfig, taxResults, selectedTaxResult, profitSummary,
  sensitivity, totalUnits, breakEvenUnits, breakEvenPrice, durationMonths,
  totalRevenue, totalCosts, financingCost,
}: Props) {
  const router = useRouter();
  const p = profitSummary;
  const [form, setForm] = useState({
    taxForm: initialConfig?.taxForm || 'sro',
    vatPayer: initialConfig?.vatPayer ?? true,
    vatRateRevenue: initialConfig?.vatRateRevenue ?? 21,
    vatRateCosts: initialConfig?.vatRateCosts ?? 21,
    foOtherIncome: initialConfig?.foOtherIncome ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/projekty/${projectId}/dane`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards with donuts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-around flex-wrap gap-6">
          <DonutChart
            data={[
              { name: 'Náklady', value: p.totalCosts, color: '#ef4444' },
              { name: 'Financování', value: p.financingCosts, color: '#f59e0b' },
              { name: 'Daně', value: selectedTaxResult.totalTaxBurden, color: '#f97316' },
              { name: 'Čistý zisk', value: Math.max(0, p.netProfit), color: '#10b981' },
            ]}
            centerValue={formatPercent(p.netMargin * 100)}
            centerLabel="Čistá marže"
            size={160}
            title="Struktura příjmů"
          />
          <div className="grid grid-cols-2 gap-4 flex-1 min-w-[400px]">
            <KpiCard label="Celkové příjmy" value={formatCZK(p.totalRevenue)} />
            <KpiCard label="Celkové náklady" value={formatCZK(p.totalCosts + p.financingCosts)}
              subtitle={`z toho financování: ${formatCZK(p.financingCosts)}`} />
            <KpiCard label="Hrubý zisk" value={formatCZK(p.grossProfit)}
              subtitle={`Marže: ${formatPercent(p.grossMargin * 100)}`}
              color={p.grossProfit >= 0 ? 'emerald' : 'red'} />
            <KpiCard label="Čistý zisk" value={formatCZK(p.netProfit)}
              subtitle={`Marže: ${formatPercent(p.netMargin * 100)}`}
              color={p.netProfit >= 0 ? 'emerald' : 'red'} />
            <KpiCard label="ROE" value={formatPercent(p.roe * 100)}
              color={p.roe > 0.15 ? 'emerald' : p.roe > 0 ? 'amber' : 'red'} />
            <KpiCard label="IRR" value={p.irr !== null ? formatPercent(p.irr * 100) : 'N/A'}
              color={p.irr && p.irr > 0.1 ? 'emerald' : 'gray'} />
            <KpiCard label={`Daně (${selectedTaxResult.label})`} value={formatCZK(selectedTaxResult.totalTaxBurden)}
              subtitle={`Efektivní: ${formatPercent(selectedTaxResult.effectiveTaxRate * 100)}`} />
            <KpiCard label="Doba projektu" value={`${durationMonths} měs.`}
              subtitle={`${(durationMonths / 12).toFixed(1)} let`} />
          </div>
        </div>
      </div>

      {/* Waterfall Chart */}
      {p.totalRevenue > 0 && (
        <ProfitWaterfallChart
          revenue={p.totalRevenue}
          costs={p.totalCosts}
          financingCosts={p.financingCosts}
          taxBurden={selectedTaxResult.totalTaxBurden}
          netProfit={p.netProfit}
        />
      )}

      {/* Tax Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Nastavení daní</h2>
        <div className="grid grid-cols-4 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Právní forma</label>
            <select value={form.taxForm} onChange={e => setForm({ ...form, taxForm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {Object.entries(LEGAL_FORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plátce DPH</label>
            <select value={form.vatPayer ? 'true' : 'false'} onChange={e => setForm({ ...form, vatPayer: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="true">Ano</option>
              <option value="false">Ne</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DPH příjmy (%)</label>
            <input type="number" value={form.vatRateRevenue}
              onChange={e => setForm({ ...form, vatRateRevenue: parseFloat(e.target.value) || 21 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DPH náklady (%)</label>
            <input type="number" value={form.vatRateCosts}
              onChange={e => setForm({ ...form, vatRateCosts: parseFloat(e.target.value) || 21 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-4 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {saving ? 'Ukládám...' : 'Uložit nastavení'}
        </button>
      </div>

      {/* Tax Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Porovnání daňových forem</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Položka</th>
              {taxResults.map(r => (
                <th key={r.label} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <TaxRow label="DPH na výstupu" results={taxResults} field="vatOnRevenue" />
            <TaxRow label="DPH na vstupu" results={taxResults} field="vatOnCosts" />
            <TaxRow label="Odvod DPH" results={taxResults} field="netVat" bold />
            <TaxRow label="Základ daně" results={taxResults} field="taxableBase" />
            <TaxRow label="Daň z příjmů" results={taxResults} field="incomeTax" />
            {taxResults.some(r => r.socialHealth > 0) && <TaxRow label="Soc. a zdrav." results={taxResults} field="socialHealth" />}
            {taxResults.some(r => r.dividendTax > 0) && <TaxRow label="Srážková daň" results={taxResults} field="dividendTax" />}
            <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
              <td className="px-6 py-3 text-sm">Celkové daně</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-3 text-sm text-right text-red-600">{formatCZK(r.totalTaxBurden)}</td>)}
            </tr>
            <tr className="font-bold">
              <td className="px-6 py-3 text-sm">Čistý zisk</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-3 text-sm text-right text-emerald-600">{formatCZK(r.netProfit)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Break-even */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Break-even analýza</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Celkem jednotek</div>
            <div className="text-2xl font-bold mt-1">{totalUnits}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Break-even (počet)</div>
            <div className="text-2xl font-bold mt-1">{breakEvenUnits}</div>
            <div className="text-xs text-gray-400 mt-1">
              {totalUnits > 0 ? `${((breakEvenUnits / totalUnits) * 100).toFixed(0)} % jednotek` : ''}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Min. průměrná cena</div>
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

function TaxRow({ label, results, field, bold }: { label: string; results: TaxResult[]; field: keyof TaxResult; bold?: boolean }) {
  return (
    <tr className={bold ? 'bg-gray-50/50' : ''}>
      <td className={`px-6 py-2.5 text-sm ${bold ? 'font-medium' : 'text-gray-600'}`}>{label}</td>
      {results.map(r => (
        <td key={r.label} className={`px-4 py-2.5 text-sm text-right ${bold ? 'font-medium' : ''}`}>
          {formatCZK(r[field] as number)}
        </td>
      ))}
    </tr>
  );
}

function KpiCard({ label, value, subtitle, color = 'gray' }: { label: string; value: string; subtitle?: string; color?: string }) {
  const colorClass = { emerald: 'text-emerald-600', red: 'text-red-600', amber: 'text-amber-600', gray: 'text-gray-900' }[color] || 'text-gray-900';
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-[10px] text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}
