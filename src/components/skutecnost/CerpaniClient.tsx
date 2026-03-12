'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCZK, formatDate } from '@/lib/utils/format';

interface Drawdown {
  id: string;
  loanType: string;
  plannedDate: string | null;
  actualDate: string | null;
  plannedAmount: number | null;
  actualAmount: number | null;
  purpose: string | null;
  notes: string | null;
}

interface Props {
  projectId: string;
  initialDrawdowns: Drawdown[];
}

const LOAN_TYPES: Record<string, string> = {
  bank: 'Bankovní úvěr',
  investor: 'Investorská půjčka',
};

export default function CerpaniClient({ projectId, initialDrawdowns }: Props) {
  const router = useRouter();
  const [drawdowns, setDrawdowns] = useState<Drawdown[]>(initialDrawdowns);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    loanType: 'bank',
    plannedDate: '',
    actualDate: '',
    plannedAmount: '',
    actualAmount: '',
    purpose: '',
  });

  const totalPlanned = drawdowns.reduce((s, d) => s + (d.plannedAmount || 0), 0);
  const totalActual = drawdowns.reduce((s, d) => s + (d.actualAmount || 0), 0);
  const totalDiff = totalActual - totalPlanned;

  async function addDrawdown(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/cerpani`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanType: form.loanType,
        plannedDate: form.plannedDate || undefined,
        actualDate: form.actualDate || undefined,
        plannedAmount: parseFloat(form.plannedAmount) || undefined,
        actualAmount: parseFloat(form.actualAmount) || undefined,
        purpose: form.purpose || undefined,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setDrawdowns([...drawdowns, d]);
      setForm({ loanType: 'bank', plannedDate: '', actualDate: '', plannedAmount: '', actualAmount: '', purpose: '' });
      setShowForm(false);
      router.refresh();
    }
  }

  async function deleteDrawdown(id: string) {
    await fetch(`/api/projekty/${projectId}/cerpani?id=${id}`, { method: 'DELETE' });
    setDrawdowns(drawdowns.filter(d => d.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Plánované čerpání</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatCZK(totalPlanned)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Skutečné čerpání</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatCZK(totalActual)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Rozdíl</div>
          <div className={`text-xl font-bold mt-1 ${totalDiff > 0 ? 'text-red-600' : totalDiff < 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
            {formatCZK(totalDiff)}
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
        >
          {showForm ? 'Zrušit' : '+ Přidat čerpání'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addDrawdown} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Nové čerpání</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ úvěru</label>
              <select
                value={form.loanType}
                onChange={e => setForm({ ...form, loanType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(LOAN_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Účel</label>
              <input
                value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })}
                placeholder="např. Stavba 1. etapa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plánované datum</label>
              <input
                type="date"
                value={form.plannedDate}
                onChange={e => setForm({ ...form, plannedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skutečné datum</label>
              <input
                type="date"
                value={form.actualDate}
                onChange={e => setForm({ ...form, actualDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plánovaná částka (Kč)</label>
              <input
                type="number"
                value={form.plannedAmount}
                onChange={e => setForm({ ...form, plannedAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skutečná částka (Kč)</label>
              <input
                type="number"
                value={form.actualAmount}
                onChange={e => setForm({ ...form, actualAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
            Přidat
          </button>
        </form>
      )}

      {/* Table */}
      {drawdowns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          Zatím žádné záznamy o čerpání.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Účel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plán. datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skut. datum</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Plán. částka</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Skut. částka</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rozdíl</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drawdowns.map(d => {
                const diff = (d.actualAmount || 0) - (d.plannedAmount || 0);
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-2.5 text-sm">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        d.loanType === 'bank' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {LOAN_TYPES[d.loanType] || d.loanType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">{d.purpose || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{d.plannedDate ? formatDate(d.plannedDate) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{d.actualDate ? formatDate(d.actualDate) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{d.plannedAmount ? formatCZK(d.plannedAmount) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{d.actualAmount ? formatCZK(d.actualAmount) : '—'}</td>
                    <td className={`px-4 py-2.5 text-sm text-right font-medium ${
                      d.actualAmount && d.plannedAmount
                        ? diff > 0 ? 'text-red-600' : diff < 0 ? 'text-emerald-600' : 'text-gray-500'
                        : 'text-gray-400'
                    }`}>
                      {d.actualAmount && d.plannedAmount ? formatCZK(diff) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => deleteDrawdown(d.id)} className="text-xs text-gray-400 hover:text-red-600">
                        Smazat
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="px-6 py-3 text-sm" colSpan={4}>Celkem</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(totalPlanned)}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(totalActual)}</td>
                <td className={`px-4 py-3 text-sm text-right ${totalDiff > 0 ? 'text-red-600' : totalDiff < 0 ? 'text-emerald-600' : ''}`}>
                  {formatCZK(totalDiff)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
