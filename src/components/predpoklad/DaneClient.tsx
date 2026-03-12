'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEGAL_FORMS } from '@/lib/utils/constants';
import { formatCZK, formatPercent } from '@/lib/utils/format';
import type { TaxResult } from '@/lib/calculations/tax';

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
  totalRevenue: number;
  totalCosts: number;
  financingCost: number;
}

export default function DaneClient({ projectId, initialConfig, taxResults, totalRevenue, totalCosts, financingCost }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    taxForm: initialConfig?.taxForm || 'sro',
    vatPayer: initialConfig?.vatPayer ?? true,
    vatRateRevenue: initialConfig?.vatRateRevenue ?? 21,
    vatRateCosts: initialConfig?.vatRateCosts ?? 21,
    foOtherIncome: initialConfig?.foOtherIncome ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const grossProfit = totalRevenue - totalCosts - financingCost;

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/projekty/${projectId}/dane`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Nastavení daní</h2>
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Právní forma</label>
            <select
              value={form.taxForm}
              onChange={e => setForm({ ...form, taxForm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {Object.entries(LEGAL_FORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plátce DPH</label>
            <select
              value={form.vatPayer ? 'true' : 'false'}
              onChange={e => setForm({ ...form, vatPayer: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="true">Ano</option>
              <option value="false">Ne</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DPH sazba — příjmy (%)</label>
            <input
              type="number"
              value={form.vatRateRevenue}
              onChange={e => setForm({ ...form, vatRateRevenue: parseFloat(e.target.value) || 21 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DPH sazba — náklady (%)</label>
            <input
              type="number"
              value={form.vatRateCosts}
              onChange={e => setForm({ ...form, vatRateCosts: parseFloat(e.target.value) || 21 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? 'Ukládám...' : 'Uložit nastavení'}
        </button>
      </div>

      {/* Tax Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Porovnání daňových forem</h2>
          <p className="text-sm text-gray-500 mt-1">
            Hrubý zisk: {formatCZK(grossProfit)} (příjmy {formatCZK(totalRevenue)} − náklady {formatCZK(totalCosts)} − financování {formatCZK(financingCost)})
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Položka</th>
              {taxResults.map(r => (
                <th key={r.label} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-6 py-2.5 text-sm text-gray-600">DPH na výstupu</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-2.5 text-sm text-right">{formatCZK(r.vatOnRevenue)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-2.5 text-sm text-gray-600">DPH na vstupu</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-2.5 text-sm text-right">{formatCZK(r.vatOnCosts)}</td>)}
            </tr>
            <tr className="bg-gray-50/50">
              <td className="px-6 py-2.5 text-sm font-medium">Odvod DPH</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-2.5 text-sm text-right font-medium">{formatCZK(r.netVat)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-2.5 text-sm text-gray-600">Základ daně</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-2.5 text-sm text-right">{formatCZK(r.taxableBase)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-2.5 text-sm text-gray-600">Daň z příjmů</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-2.5 text-sm text-right">{formatCZK(r.incomeTax)}</td>)}
            </tr>
            {taxResults.some(r => r.socialHealth > 0) && (
              <tr>
                <td className="px-6 py-2.5 text-sm text-gray-600">Soc. a zdrav. pojištění</td>
                {taxResults.map(r => <td key={r.label} className="px-4 py-2.5 text-sm text-right">{formatCZK(r.socialHealth)}</td>)}
              </tr>
            )}
            {taxResults.some(r => r.dividendTax > 0) && (
              <tr>
                <td className="px-6 py-2.5 text-sm text-gray-600">Srážková daň (dividendy)</td>
                {taxResults.map(r => <td key={r.label} className="px-4 py-2.5 text-sm text-right">{formatCZK(r.dividendTax)}</td>)}
              </tr>
            )}
            <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
              <td className="px-6 py-3 text-sm">Celkové daňové zatížení</td>
              {taxResults.map(r => <td key={r.label} className="px-4 py-3 text-sm text-right text-red-600">{formatCZK(r.totalTaxBurden)}</td>)}
            </tr>
            <tr className="font-bold">
              <td className="px-6 py-3 text-sm">Čistý zisk</td>
              {taxResults.map(r => (
                <td key={r.label} className="px-4 py-3 text-sm text-right text-emerald-600">{formatCZK(r.netProfit)}</td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-2.5 text-sm text-gray-600">Efektivní daňová sazba</td>
              {taxResults.map(r => (
                <td key={r.label} className="px-4 py-2.5 text-sm text-right">{formatPercent(r.effectiveTaxRate * 100)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
