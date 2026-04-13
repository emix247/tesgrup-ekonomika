'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['pozemky','projekce','úřady','subdodávky','mzdy+režie','DPH','úroky','investice','prodeje','čerpání banky/investor','ostatní'];

export default function NovaPolozka() {
  const router = useRouter();
  const [projects, setProjects] = useState<{id:number;name:string}[]>([]);
  const [form, setForm] = useState({ type: 'out', name: '', amount: '', paymentDate: '', certainty: 'A', category: 'subdodávky', projectId: '', counterparty: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetch('/api/cashflow/projects').then(r=>r.json()).then(setProjects); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    const res = await fetch('/api/cashflow/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) router.push('/cashflow/polozky');
    else { const d = await res.json(); setError(d.error || 'Chyba'); setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nová cashflow položka</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex gap-4">
          {(['out','in'] as const).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={form.type===t} onChange={()=>setForm({...form,type:t})} className="text-primary-600" />
              <span className="text-sm">{t==='in'?'Příjem':'Výdaj'}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Název *</label>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Částka (Kč) *</label>
            <input type="number" required min="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Datum splatnosti *</label>
            <input type="date" required value={form.paymentDate} onChange={e=>setForm({...form,paymentDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Jistota *</label>
            <select value={form.certainty} onChange={e=>setForm({...form,certainty:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="A">A — jisté</option><option value="B">B — pravděpodobné</option><option value="C">C — možné</option>
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Projekt</label>
            <select value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">— bez projektu —</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Protistrana</label>
            <input value={form.counterparty} onChange={e=>setForm({...form,counterparty:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
          <textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving?'Ukládání...':'Přidat'}</button>
          <button type="button" onClick={()=>router.back()} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Zrušit</button>
        </div>
      </form>
    </div>
  );
}
