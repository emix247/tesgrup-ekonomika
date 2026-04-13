'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCZK } from '@/lib/utils/format';

interface CfItem {
  id: number; type: string; name: string; amount: number; paymentDate: string;
  certainty: string; category: string; isPaid: boolean; counterparty: string | null;
  project: { id: number; name: string } | null;
}

export default function PolozkyPage() {
  const router = useRouter();
  const [items, setItems] = useState<CfItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/cashflow/items').then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const togglePaid = async (id: number, current: boolean) => {
    await fetch(`/api/cashflow/items/${id}/paid`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPaid: !current }) });
    load();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Smazat položku?')) return;
    await fetch(`/api/cashflow/items/${id}`, { method: 'DELETE' });
    load();
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('cs-CZ'); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href="/cashflow/polozky/nova" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nová položka
        </Link>
      </div>

      <div className="flex gap-2">
        {([['all', 'Vše'], ['in', 'Příjmy'], ['out', 'Výdaje']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 text-sm rounded-lg ${filter === v ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Žádné položky</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Název</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projekt</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jistota</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Uhrazeno</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akce</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.type === 'in' ? 'Příjem' : 'Výdaj'}</div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{item.project?.name || '—'}</td>
                    <td className={`px-4 py-2.5 text-sm text-right font-medium tabular-nums ${item.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.type === 'in' ? '+' : '-'}{formatCZK(item.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-sm">{fmtDate(item.paymentDate)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.certainty === 'A' ? 'bg-emerald-100 text-emerald-700' : item.certainty === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{item.certainty}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{item.category}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => togglePaid(item.id, item.isPaid)} className={`w-5 h-5 rounded border-2 inline-flex items-center justify-center ${item.isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                        {item.isPaid && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/cashflow/polozky/${item.id}`} className="text-primary-600 hover:text-primary-700 text-sm mr-3">Upravit</Link>
                      <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-600 text-sm">Smazat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
