'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NovyUver() {
  const router = useRouter();
  const [form, setForm] = useState({ creditor: '', amount: '', startDate: '', dueDate: '', interestRate: '', collateral: '', note: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await fetch('/api/cashflow/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) router.push('/cashflow/uvery');
    else setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <h1 className="text-2xl font-bold">Nový investorský úvěr</h1>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Věřitel *</label>
            <input required value={form.creditor} onChange={e=>setForm({...form,creditor:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Částka (Kč) *</label>
            <input type="number" required min="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Datum čerpání *</label>
            <input type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Splatnost *</label>
            <input type="date" required value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Úrok (%)</label>
            <input type="number" step="0.1" value={form.interestRate} onChange={e=>setForm({...form,interestRate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Zajištění</label>
            <select value={form.collateral} onChange={e=>setForm({...form,collateral:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">— bez zajištění —</option><option value="směnka">Směnka</option><option value="zástavní právo">Zástavní právo</option><option value="ručení">Ručení</option><option value="jiné">Jiné</option>
            </select></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
          <textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving?'Ukládání...':'Přidat'}</button>
          <button type="button" onClick={()=>router.back()} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Zrušit</button>
        </div>
      </form>
    </div>
  );
}
