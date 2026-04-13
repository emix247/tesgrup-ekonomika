'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditUver() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({ creditor: '', amount: '', startDate: '', dueDate: '', interestRate: '', collateral: '', note: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cashflow/loans/${id}`).then(r=>r.json()).then(loan => {
      setForm({ creditor: loan.creditor, amount: String(loan.amount), startDate: loan.startDate?.split('T')[0]||'', dueDate: loan.dueDate?.split('T')[0]||'', interestRate: loan.interestRate ? String(loan.interestRate) : '', collateral: loan.collateral||'', note: loan.note||'', status: loan.status });
      setLoading(false);
    });
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await fetch(`/api/cashflow/loans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) router.push('/cashflow/uvery');
    else setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upravit úvěr</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Věřitel</label>
            <input required value={form.creditor} onChange={e=>setForm({...form,creditor:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Částka</label>
            <input type="number" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Čerpání</label>
            <input type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Splatnost</label>
            <input type="date" required value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Úrok (%)</label>
            <input type="number" step="0.1" value={form.interestRate} onChange={e=>setForm({...form,interestRate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Zajištění</label>
            <select value={form.collateral} onChange={e=>setForm({...form,collateral:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">—</option><option value="směnka">Směnka</option><option value="zástavní právo">Zástavní právo</option><option value="ručení">Ručení</option><option value="jiné">Jiné</option>
            </select></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
          <textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving?'Ukládání...':'Uložit'}</button>
          <button type="button" onClick={()=>router.back()} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Zrušit</button>
        </div>
      </form>
    </div>
  );
}
