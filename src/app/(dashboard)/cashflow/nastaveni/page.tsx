'use client';

import { useState, useEffect } from 'react';
import { formatCZK } from '@/lib/utils/format';

const FIELDS = [
  { key: 'minCashBuffer', label: 'Min. hotovostní buffer', unit: 'Kč', type: 'number' },
  { key: 'criticalCash', label: 'Kritická hranice', unit: 'Kč', type: 'number' },
  { key: 'baseBPercent', label: 'Pravděpodobnost B (základní scénář)', unit: '%', type: 'number' },
  { key: 'alertThreshold', label: 'Alert threshold (velké položky)', unit: 'Kč', type: 'number' },
  { key: 'alertDaysAhead', label: 'Alert horizont', unit: 'dní', type: 'number' },
];

export default function NastaveniPage() {
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/cashflow/parameters').then(r=>r.json()).then(d => { setParams(d); setLoading(false); });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setSaved(false);
    await fetch('/api/cashflow/parameters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href="/cashflow" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </a>
        <h1 className="text-2xl font-bold">Nastavení forecastu</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={params[f.key] || ''}
                onChange={e => setParams({ ...params, [f.key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-sm text-gray-500 shrink-0">{f.unit}</span>
            </div>
            {f.type === 'number' && params[f.key] && f.unit === 'Kč' && (
              <div className="text-xs text-gray-400 mt-1">{formatCZK(parseFloat(params[f.key]))}</div>
            )}
          </div>
        ))}

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Ukládání...' : 'Uložit nastavení'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Uloženo</span>}
        </div>
      </form>
    </div>
  );
}
