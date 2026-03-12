'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COST_CATEGORIES, PAYMENT_STATUSES } from '@/lib/utils/constants';
import { formatCZK, formatDate } from '@/lib/utils/format';

interface ActualCost {
  id: string;
  category: string;
  supplier: string | null;
  description: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  amount: number;
  paymentStatus: string;
  paymentDate: string | null;
}

export default function SkutecneNakladyClient({ projectId, initialCosts }: { projectId: string; initialCosts: ActualCost[] }) {
  const router = useRouter();
  const [costs, setCosts] = useState(initialCosts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: 'stavba_hlavni',
    supplier: '',
    description: '',
    invoiceNumber: '',
    invoiceDate: '',
    amount: '',
    paymentStatus: 'neuhrazeno',
  });

  const total = costs.reduce((s, c) => s + c.amount, 0);
  const paid = costs.filter(c => c.paymentStatus === 'uhrazeno').reduce((s, c) => s + c.amount, 0);
  const unpaid = total - paid;

  async function addCost(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/skutecne-naklady`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
    });
    if (res.ok) {
      const item = await res.json();
      setCosts([...costs, item]);
      setForm({ category: 'stavba_hlavni', supplier: '', description: '', invoiceNumber: '', invoiceDate: '', amount: '', paymentStatus: 'neuhrazeno' });
      setShowForm(false);
      router.refresh();
    }
  }

  async function deleteCost(id: string) {
    await fetch(`/api/projekty/${projectId}/skutecne-naklady?id=${id}`, { method: 'DELETE' });
    setCosts(costs.filter(c => c.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celkové skutečné náklady</div>
          <div className="text-2xl font-bold mt-1">{formatCZK(total)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Uhrazeno</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCZK(paid)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">K úhradě</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{formatCZK(unpaid)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Evidence nákladů</h2>
          <button onClick={() => setShowForm(!showForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {showForm ? 'Zrušit' : '+ Přidat náklad'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={addCost} className="px-6 py-4 bg-gray-50 border-b border-gray-200 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(COST_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input placeholder="Dodavatel" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder="Popis" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <input placeholder="Č. faktury" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Částka" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(PAYMENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button type="submit" className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
              Přidat
            </button>
          </form>
        )}

        {costs.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Zatím žádné skutečné náklady</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dodavatel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faktura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {costs.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-2.5 text-sm">{COST_CATEGORIES[c.category as keyof typeof COST_CATEGORIES] || c.category}</td>
                    <td className="px-4 py-2.5 text-sm">{c.supplier || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{c.invoiceNumber || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{c.invoiceDate ? formatDate(c.invoiceDate) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{formatCZK(c.amount)}</td>
                    <td className="px-4 py-2.5">
                      <PaymentBadge status={c.paymentStatus} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => deleteCost(c.id)} className="text-xs text-gray-400 hover:text-red-600">Smazat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles = {
    uhrazeno: 'bg-emerald-100 text-emerald-700',
    castecne_uhrazeno: 'bg-amber-100 text-amber-700',
    neuhrazeno: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-700';
  const label = PAYMENT_STATUSES[status as keyof typeof PAYMENT_STATUSES] || status;
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles}`}>{label}</span>;
}
