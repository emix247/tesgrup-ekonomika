'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCZK, formatPercent } from '@/lib/utils/format';
import { calculateFinancingSummary } from '@/lib/calculations/financing';

interface FinancingData {
  equityAmount: number;
  bankLoanAmount: number;
  bankLoanRate: number;
  bankLoanDurationMonths: number;
  bankLoanFee: number;
  investorLoanAmount: number;
  investorLoanRate: number;
  investorLoanDurationMonths: number;
  notes: string;
}

const defaults: FinancingData = {
  equityAmount: 0,
  bankLoanAmount: 0,
  bankLoanRate: 0,
  bankLoanDurationMonths: 0,
  bankLoanFee: 0,
  investorLoanAmount: 0,
  investorLoanRate: 0,
  investorLoanDurationMonths: 0,
  notes: '',
};

export default function FinancovaniClient({ projectId, initialData }: { projectId: string; initialData: FinancingData | undefined }) {
  const router = useRouter();
  const [form, setForm] = useState<FinancingData>(initialData ? { ...defaults, ...initialData } : defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const summary = calculateFinancingSummary(form);

  function handleChange(field: keyof FinancingData, value: string) {
    const num = field === 'notes' ? value : parseFloat(value) || 0;
    setForm({ ...form, [field]: num });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/projekty/${projectId}/financovani`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celkový kapitál</div>
          <div className="text-xl font-bold mt-1">{formatCZK(summary.totalCapital)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Vlastní kapitál</div>
          <div className="text-xl font-bold mt-1">{formatCZK(form.equityAmount)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celkový dluh</div>
          <div className="text-xl font-bold mt-1">{formatCZK(summary.totalDebt)}</div>
          <div className="text-xs text-gray-400 mt-1">LTV: {formatPercent(summary.ltv)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Náklady financování</div>
          <div className="text-xl font-bold text-red-600 mt-1">{formatCZK(summary.totalFinancingCost)}</div>
        </div>
      </div>

      {/* Equity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Vlastní kapitál</h2>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Částka (Kč)</label>
          <input
            type="number"
            value={form.equityAmount || ''}
            onChange={e => handleChange('equityAmount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Bank loan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Bankovní úvěr</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Výše úvěru (Kč)</label>
            <input type="number" value={form.bankLoanAmount || ''} onChange={e => handleChange('bankLoanAmount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Úroková sazba (% p.a.)</label>
            <input type="number" step="0.1" value={form.bankLoanRate || ''} onChange={e => handleChange('bankLoanRate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doba (měsíce)</label>
            <input type="number" value={form.bankLoanDurationMonths || ''} onChange={e => handleChange('bankLoanDurationMonths', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poplatek za zpracování (Kč)</label>
            <input type="number" value={form.bankLoanFee || ''} onChange={e => handleChange('bankLoanFee', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        {summary.bankCarry.totalInterest > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">Carry cost (úroky):</span>{' '}
            <span className="font-semibold">{formatCZK(summary.bankCarry.totalInterest)}</span>
            <span className="text-gray-400 ml-3">({formatCZK(summary.bankCarry.monthlyPayment)}/měs.)</span>
          </div>
        )}
      </div>

      {/* Investor loan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Investorská půjčka</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Výše (Kč)</label>
            <input type="number" value={form.investorLoanAmount || ''} onChange={e => handleChange('investorLoanAmount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Úrok (% p.a.)</label>
            <input type="number" step="0.1" value={form.investorLoanRate || ''} onChange={e => handleChange('investorLoanRate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doba (měsíce)</label>
            <input type="number" value={form.investorLoanDurationMonths || ''} onChange={e => handleChange('investorLoanDurationMonths', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        {summary.investorCarry.totalInterest > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">Carry cost:</span>{' '}
            <span className="font-semibold">{formatCZK(summary.investorCarry.totalInterest)}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? 'Ukládám...' : saved ? 'Uloženo' : 'Uložit financování'}
      </button>
    </div>
  );
}
