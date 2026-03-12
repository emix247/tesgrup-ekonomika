'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { COST_CATEGORIES } from '@/lib/utils/constants';
import { formatCZK, formatNumber } from '@/lib/utils/format';

interface Cost {
  id: string;
  category: string;
  label: string | null;
  amount: number;
  area: number | null;
  ratePerM2: number | null;
  notes: string | null;
  sortOrder: number | null;
}

interface Props {
  projectId: string;
  initialCosts: Cost[];
}

export default function NakladyClient({ projectId, initialCosts }: Props) {
  const router = useRouter();
  const [costs, setCosts] = useState<Cost[]>(initialCosts);
  const [showForm, setShowForm] = useState(false);
  const [useAreaCalc, setUseAreaCalc] = useState(false);
  const [form, setForm] = useState({
    category: 'pozemek',
    label: '',
    amount: '',
    area: '',
    ratePerM2: '',
    notes: '',
  });

  // Group by category
  const grouped = Object.entries(COST_CATEGORIES).map(([key, name]) => {
    const items = costs.filter(c => c.category === key);
    const total = items.reduce((s, c) => s + c.amount, 0);
    return { key, name, items, total };
  }).filter(g => g.items.length > 0);

  const grandTotal = costs.reduce((s, c) => s + c.amount, 0);

  async function addCost(e: React.FormEvent) {
    e.preventDefault();
    const amount = useAreaCalc
      ? (parseFloat(form.area) || 0) * (parseFloat(form.ratePerM2) || 0)
      : parseFloat(form.amount) || 0;

    const res = await fetch(`/api/projekty/${projectId}/naklady`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: form.category,
        label: form.label,
        amount,
        area: useAreaCalc ? parseFloat(form.area) || undefined : undefined,
        ratePerM2: useAreaCalc ? parseFloat(form.ratePerM2) || undefined : undefined,
        notes: form.notes,
      }),
    });
    if (res.ok) {
      const cost = await res.json();
      setCosts([...costs, cost]);
      setForm({ category: 'pozemek', label: '', amount: '', area: '', ratePerM2: '', notes: '' });
      setShowForm(false);
      router.refresh();
    }
  }

  async function deleteCost(id: string) {
    await fetch(`/api/projekty/${projectId}/naklady?id=${id}`, { method: 'DELETE' });
    setCosts(costs.filter(c => c.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Celkové plánované náklady</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{formatCZK(grandTotal)}</div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
          >
            {showForm ? 'Zrušit' : '+ Přidat náklad'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addCost} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Nová nákladová položka</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(COST_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Popis položky</label>
              <input
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="např. Přípojka vody"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!useAreaCalc}
                onChange={() => setUseAreaCalc(false)}
                className="text-primary-600"
              />
              Zadat celkovou částku
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={useAreaCalc}
                onChange={() => setUseAreaCalc(true)}
                className="text-primary-600"
              />
              Kalkulace plocha × sazba
            </label>
          </div>

          {useAreaCalc ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plocha (m²)</label>
                <input
                  type="number"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sazba (Kč/m²)</label>
                <input
                  type="number"
                  value={form.ratePerM2}
                  onChange={e => setForm({ ...form, ratePerM2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celkem</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">
                  {formatCZK((parseFloat(form.area) || 0) * (parseFloat(form.ratePerM2) || 0))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Částka (Kč)</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
            <input
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
            Přidat položku
          </button>
        </form>
      )}

      {/* Costs by Category */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          Zatím žádné plánované náklady. Klikněte na &quot;+ Přidat náklad&quot; výše.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie / Položka</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Plocha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sazba</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% z celku</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(group => (
                <Fragment key={group.key}>
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-2.5 text-sm font-semibold text-gray-900" colSpan={3}>
                      {group.name}
                    </td>
                    <td className="px-6 py-2.5 text-sm font-semibold text-right text-gray-900">
                      {formatCZK(group.total)}
                    </td>
                    <td className="px-6 py-2.5 text-sm text-right text-gray-500">
                      {grandTotal > 0 ? `${((group.total / grandTotal) * 100).toFixed(1)} %` : '—'}
                    </td>
                    <td></td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-2 text-sm text-gray-600 pl-10">{item.label || '—'}</td>
                      <td className="px-6 py-2 text-sm text-right text-gray-500">
                        {item.area ? `${formatNumber(item.area, 1)} m²` : '—'}
                      </td>
                      <td className="px-6 py-2 text-sm text-right text-gray-500">
                        {item.ratePerM2 ? formatCZK(item.ratePerM2) : '—'}
                      </td>
                      <td className="px-6 py-2 text-sm text-right font-medium">{formatCZK(item.amount)}</td>
                      <td className="px-6 py-2 text-sm text-right text-gray-400">
                        {grandTotal > 0 ? `${((item.amount / grandTotal) * 100).toFixed(1)} %` : '—'}
                      </td>
                      <td className="px-6 py-2 text-right">
                        <button onClick={() => deleteCost(item.id)} className="text-xs text-gray-400 hover:text-red-600">
                          Smazat
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="px-6 py-3 text-sm" colSpan={3}>Celkové náklady</td>
                <td className="px-6 py-3 text-sm text-right">{formatCZK(grandTotal)}</td>
                <td className="px-6 py-3 text-sm text-right">100 %</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
