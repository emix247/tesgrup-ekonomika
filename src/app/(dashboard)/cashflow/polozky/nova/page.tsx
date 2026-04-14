'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const CATEGORIES = ['pozemky','projekce','úřady','subdodávky','mzdy+režie','DPH','úroky','investice','prodeje','čerpání banky/investor','ostatní'];

function NovaPolozkaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'in' ? 'in' : 'out';
  const [projects, setProjects] = useState<{id:number;name:string}[]>([]);
  const [form, setForm] = useState({ type: initialType, name: '', amount: '', paymentDate: '', certainty: 'A', category: 'subdodávky', projectId: '', counterparty: '', note: '' });
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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <h1 className="text-2xl font-bold">Nová cashflow položka</h1>
      </div>
      <form onSubmit={submit} className={`bg-white rounded-xl border-2 p-6 space-y-5 transition-colors ${form.type === 'in' ? 'border-emerald-300' : 'border-red-300'}`}>
        {/* Type selector — big colored buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setForm({...form, type: 'in'})}
            className={`py-4 rounded-xl text-base font-bold transition-all ${
              form.type === 'in'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-[1.02]'
                : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
            }`}>
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0-6.75-6.75M12 19.5l6.75-6.75" /></svg>
              PŘÍJEM
            </span>
          </button>
          <button type="button" onClick={() => setForm({...form, type: 'out'})}
            className={`py-4 rounded-xl text-base font-bold transition-all ${
              form.type === 'out'
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-[1.02]'
                : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
            }`}>
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75" /></svg>
              VÝDAJ
            </span>
          </button>
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
          <button type="submit" disabled={saving} className={`px-6 py-2.5 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${form.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {saving ? 'Ukládání...' : form.type === 'in' ? 'Přidat příjem' : 'Přidat výdaj'}
          </button>
          <button type="button" onClick={()=>router.back()} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Zrušit</button>
        </div>
      </form>
    </div>
  );
}

export default function NovaPolozka() {
  return <Suspense><NovaPolozkaInner /></Suspense>;
}
