'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { formatCZK } from '@/lib/utils/format';

type Scenario = 'conservative' | 'base' | 'optimistic';

interface WeekRow {
  label: string; weekStart: string; weekEnd: string;
  inflows: number; outflows: number; startCash: number; endCash: number;
}

interface ForecastData {
  weeks: WeekRow[]; minCash: number; semaphore: 'green' | 'orange' | 'red';
  runwayWeeks: number; startCash: number; minBuffer: number; criticalCash: number;
  biggestInflow: { name: string; amount: number; date: string } | null;
  biggestOutflow: { name: string; amount: number; date: string } | null;
}

const LABELS: Record<Scenario, string> = { conservative: 'Konzervativní', base: 'Základní', optimistic: 'Optimistický' };
const SEM = {
  green: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'Zdravé' },
  orange: { bg: 'bg-amber-500', text: 'text-amber-600', label: 'Pozor' },
  red: { bg: 'bg-red-500', text: 'text-red-600', label: 'Kritické' },
};

interface Snapshot {
  id: number; weekLabel: string; note: string | null; createdAt: string;
  summary: { startCash: number; baseMinCash: number; baseSemaphore: string; itemCount: number } | null;
}

const fmtShortDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }); } catch { return ''; }
};

export default function CashflowDashboard() {
  const [scenario, setScenario] = useState<Scenario>('base');
  const [data, setData] = useState<ForecastData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/cashflow/forecast?scenario=${scenario}`).then(r => r.json()),
      fetch('/api/cashflow/snapshots').then(r => r.json()),
    ]).then(([d, s]) => {
      setData(d);
      setSnapshots(Array.isArray(s) ? s.slice(0, 5) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [scenario]);

  const fmtAxis = (v: number) => {
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v/1e6).toFixed(1)}M`;
    if (a >= 1e3) return `${(v/1e3).toFixed(0)}k`;
    return `${v}`;
  };

  const sem = data ? SEM[data.semaphore] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/cashflow/report" target="_blank"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
          PDF Report
        </Link>
        {(Object.keys(LABELS) as Scenario[]).map(s => (
          <button key={s} onClick={() => setScenario(s)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${scenario === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`w-5 h-5 rounded-full ${sem?.bg} shrink-0`} />
              <div><div className="text-xs text-gray-500">Semafor</div><div className={`text-lg font-bold ${sem?.text}`}>{sem?.label}</div></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs text-gray-500">Počáteční stav</div>
              <div className="text-lg font-bold mt-1">{formatCZK(data.startCash)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs text-gray-500">Minimum v 13T</div>
              <div className={`text-lg font-bold mt-1 ${data.minCash < data.criticalCash ? 'text-red-600' : data.minCash < data.minBuffer ? 'text-amber-600' : 'text-emerald-600'}`}>{formatCZK(data.minCash)}</div>
            </div>
          </div>

          {/* Biggest items — compact row */}
          {(data.biggestInflow || data.biggestOutflow) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {data.biggestInflow && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-emerald-600 text-xs">Největší příjem (2T):</span>
                  <span className="font-bold text-emerald-700">{formatCZK(data.biggestInflow.amount)}</span>
                  <span className="text-emerald-600 text-xs">— {data.biggestInflow.name}</span>
                </div>
              )}
              {data.biggestOutflow && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-red-600 text-xs">Největší výdaj (2T):</span>
                  <span className="font-bold text-red-700">{formatCZK(data.biggestOutflow.amount)}</span>
                  <span className="text-red-600 text-xs">— {data.biggestOutflow.name}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Vývoj cashflow</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.weeks} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCZK(value)} />
                <ReferenceLine y={data.minBuffer} stroke="#f59e0b" strokeDasharray="5 5" />
                <ReferenceLine y={data.criticalCash} stroke="#ef4444" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="endCash" name="Zůstatek" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Týden</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Období</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Počáteční</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Příjmy</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-red-600 uppercase">Výdaje</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Konečný</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.weeks.map((w, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${w.endCash < data.criticalCash ? 'bg-red-50' : w.endCash < data.minBuffer ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-2.5 text-sm font-medium">{w.label}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">{fmtShortDate(w.weekStart)} – {fmtShortDate(w.weekEnd)}</td>
                      <td className="px-4 py-2.5 text-sm text-right tabular-nums">{formatCZK(w.startCash)}</td>
                      <td className="px-4 py-2.5 text-sm text-right tabular-nums text-emerald-600">{w.inflows > 0 ? `+${formatCZK(w.inflows)}` : '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-right tabular-nums text-red-600">{w.outflows > 0 ? `-${formatCZK(w.outflows)}` : '—'}</td>
                      <td className={`px-4 py-2.5 text-sm text-right tabular-nums font-medium ${w.endCash < data.criticalCash ? 'text-red-600' : w.endCash < data.minBuffer ? 'text-amber-600' : ''}`}>{formatCZK(w.endCash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Snapshot history */}
          {snapshots.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Historie snapshotů</h3>
                <Link href="/cashflow/snapshoty" className="text-sm text-primary-600 hover:text-primary-700">Zobrazit vše →</Link>
              </div>
              <div className="space-y-2">
                {snapshots.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{s.weekLabel}</span>
                      {s.summary && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                          s.summary.baseSemaphore === 'green' ? 'bg-emerald-100 text-emerald-700' :
                          s.summary.baseSemaphore === 'orange' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {s.summary.baseSemaphore === 'green' ? 'OK' : s.summary.baseSemaphore === 'orange' ? 'Pozor' : 'Kritické'}
                        </span>
                      )}
                      {s.note && <span className="text-xs text-gray-400">{s.note}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {s.summary && (
                        <>
                          <span className="text-gray-400 text-xs">Start: {formatCZK(s.summary.startCash)}</span>
                          <span className="text-gray-400 text-xs">Min: {formatCZK(s.summary.baseMinCash)}</span>
                        </>
                      )}
                      <span className="text-xs text-gray-300">{fmtShortDate(s.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      ) : <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Nepodařilo se načíst forecast.</div>}
    </div>
  );
}
