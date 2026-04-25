'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SALE_STATUSES } from '@/lib/utils/constants';
import { formatCZK, formatDate } from '@/lib/utils/format';

interface Sale {
  id: string;
  unitId: string | null;
  buyerName: string | null;
  status: string;
  reservationDate: string | null;
  contractDate: string | null;
  paymentDate: string | null;
  agreedPrice: number | null;
}

interface Unit {
  id: string;
  label: string | null;
  unitType: string;
  totalPrice: number | null;
}

export default function ProdejeClient({ projectId, initialSales, units }: { projectId: string; initialSales: Sale[]; units: Unit[] }) {
  const router = useRouter();
  const [salesList, setSalesList] = useState(initialSales);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ unitId: '', buyerName: '', status: 'rezervace', reservationDate: '', agreedPrice: '' });

  const totalAgreed = salesList.reduce((s, sale) => s + (sale.agreedPrice || 0), 0);
  const contracted = salesList.filter(s => ['smlouva', 'zaplaceno', 'predano', 'zaloha'].includes(s.status)).length;
  const paid = salesList.filter(s => ['zaplaceno', 'predano'].includes(s.status)).length;

  async function addSale(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/prodeje`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        agreedPrice: form.agreedPrice ? parseFloat(form.agreedPrice) : undefined,
        unitId: form.unitId || undefined,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setSalesList([...salesList, item]);
      setForm({ unitId: '', buyerName: '', status: 'rezervace', reservationDate: '', agreedPrice: '' });
      setShowForm(false);
      router.refresh();
    }
  }

  async function deleteSale(id: string) {
    await fetch(`/api/projekty/${projectId}/prodeje?id=${id}`, { method: 'DELETE' });
    setSalesList(salesList.filter(s => s.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celkem prodejů</div>
          <div className="text-2xl font-bold mt-1">{salesList.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Se smlouvou</div>
          <div className="text-2xl font-bold text-primary-600 mt-1">{contracted}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Zaplaceno</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{paid}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celková hodnota</div>
          <div className="text-2xl font-bold mt-1">{formatCZK(totalAgreed)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Pipeline prodejů</h2>
          <button onClick={() => setShowForm(!showForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {showForm ? 'Zrušit' : '+ Přidat prodej'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={addSale} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <select value={form.unitId} onChange={e => setForm({ ...form, unitId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Jednotka (volitelné)</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.label || u.unitType}</option>)}
              </select>
              <input placeholder="Kupující" value={form.buyerName} onChange={e => setForm({ ...form, buyerName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(SALE_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder="Dohodnutá cena" value={form.agreedPrice} onChange={e => setForm({ ...form, agreedPrice: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Přidat</button>
            </div>
          </form>
        )}

        {salesList.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Zatím žádné prodeje</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jednotka</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kupující</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rezervace</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Smlouva</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cena</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesList.map(s => {
                const unit = units.find(u => u.id === s.unitId);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-2.5 text-sm">{unit?.label || '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{s.buyerName || '—'}</td>
                    <td className="px-4 py-2.5"><SaleBadge status={s.status} /></td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{s.reservationDate ? formatDate(s.reservationDate) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{s.contractDate ? formatDate(s.contractDate) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{s.agreedPrice ? formatCZK(s.agreedPrice) : '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => deleteSale(s.id)} className="text-xs text-gray-400 hover:text-red-600">Smazat</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SaleBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    rezervace: 'bg-blue-100 text-blue-700',
    smlouva: 'bg-purple-100 text-purple-700',
    zaplaceno: 'bg-emerald-100 text-emerald-700',
    predano: 'bg-green-100 text-green-700',
    stornovano: 'bg-red-100 text-red-700',
  };
  const label = SALE_STATUSES[status as keyof typeof SALE_STATUSES] || status;
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{label}</span>;
}
