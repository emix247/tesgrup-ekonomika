'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCZK } from '@/lib/utils/format';

interface Snapshot {
  id: number;
  weekLabel: string;
  note: string | null;
  createdAt: string;
  summary: {
    startCash: number;
    baseMinCash: number;
    baseSemaphore: 'green' | 'orange' | 'red';
    itemCount: number;
  } | null;
}

const SEM_STYLES = {
  green: 'bg-emerald-100 text-emerald-700',
  orange: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
};

export default function SnapshotyPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/cashflow/snapshots').then(r => r.json()).then(d => { setSnapshots(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(load, []);

  const createSnapshot = async () => {
    setSaving(true);
    await fetch('/api/cashflow/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note || null }),
    });
    setNote('');
    setSaving(false);
    load();
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
  };

  return (
    <div className="space-y-6">

      {/* Create snapshot */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Vytvořit snapshot</h2>
        <p className="text-sm text-gray-500 mb-4">Uloží aktuální stav forecastu (všechny 3 scénáře) pro pozdější porovnání.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Poznámka (volitelné)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={createSnapshot}
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 shrink-0"
          >
            {saving ? 'Ukládání...' : 'Uložit snapshot'}
          </button>
        </div>
      </div>

      {/* Snapshot list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : snapshots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          Žádné snapshoty. Vytvořte první pro uložení aktuálního stavu forecastu.
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{s.weekLabel}</span>
                    {s.summary && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${SEM_STYLES[s.summary.baseSemaphore] || 'bg-gray-100 text-gray-600'}`}>
                        {s.summary.baseSemaphore === 'green' ? 'Zdravé' : s.summary.baseSemaphore === 'orange' ? 'Pozor' : 'Kritické'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{fmtDate(s.createdAt)}</div>
                  {s.note && <div className="text-sm text-gray-600 mt-1">{s.note}</div>}
                </div>
                {s.summary && (
                  <div className="flex gap-6 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">Počáteční</div>
                      <div className="font-medium">{formatCZK(s.summary.startCash)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Min (base)</div>
                      <div className={`font-medium ${s.summary.baseMinCash < 500000 ? 'text-red-600' : ''}`}>{formatCZK(s.summary.baseMinCash)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Položek</div>
                      <div className="font-medium">{s.summary.itemCount}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
