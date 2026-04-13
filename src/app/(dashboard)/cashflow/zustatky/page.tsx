'use client';

import { useState, useEffect } from 'react';
import { formatCZK } from '@/lib/utils/format';

interface Balance {
  id: number; amount: number; accountAmount: number; cashAmount: number; date: string; note: string | null; createdAt: string;
}

export default function ZustatkyPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ accountAmount: '', cashAmount: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); fetch('/api/cashflow/cash-balance').then(r=>r.json()).then(d => { setBalances(Array.isArray(d)?d:[]); setLoading(false); }); };
  useEffect(load, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await fetch('/api/cashflow/cash-balance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ accountAmount: '', cashAmount: '', date: new Date().toISOString().split('T')[0], note: '' }); load(); }
    setSaving(false);
  };

  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('cs-CZ'); } catch { return d; } };
  const acc = parseFloat(form.accountAmount) || 0;
  const cash = parseFloat(form.cashAmount) || 0;

  return (
    <div className="space-y-6">

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Nový záznam</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Účet (Kč)</label>
            <input type="number" required value={form.accountAmount} onChange={e=>setForm({...form,accountAmount:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Hotovost (Kč)</label>
            <input type="number" required value={form.cashAmount} onChange={e=>setForm({...form,cashAmount:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
            <input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">Celkem: <span className="font-bold text-gray-900">{formatCZK(acc + cash)}</span></div>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving?'Ukládání...':'Uložit zůstatek'}</button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200"><h2 className="font-semibold">Historie zůstatků</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Účet</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hotovost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Celkem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poznámka</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {balances.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-medium">{fmtDate(b.date)}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums">{formatCZK(b.accountAmount)}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums">{formatCZK(b.cashAmount)}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums font-medium">{formatCZK(b.amount)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{b.note || '—'}</td>
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
