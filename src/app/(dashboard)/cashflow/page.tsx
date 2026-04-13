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

export default function CashflowDashboard() {
  const [scenario, setScenario] = useState<Scenario>('base');
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cashflow/forecast?scenario=${scenario}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
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
      <div className="flex justify-end gap-2">
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs text-gray-500">Runway</div>
              <div className="text-lg font-bold mt-1">{data.runwayWeeks === -1 ? '13+ týdnů' : `${data.runwayWeeks} týdnů`}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs text-gray-500">Buffer / Kritická</div>
              <div className="text-sm font-medium mt-1">{formatCZK(data.minBuffer)}</div>
              <div className="text-xs text-gray-400">{formatCZK(data.criticalCash)}</div>
            </div>
          </div>

          {(data.biggestInflow || data.biggestOutflow) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.biggestInflow && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs text-emerald-600 font-medium">Největší příjem (2T)</div>
                  <div className="text-lg font-bold text-emerald-700 mt-1">{formatCZK(data.biggestInflow.amount)}</div>
                  <div className="text-sm text-emerald-600">{data.biggestInflow.name}</div>
                </div>
              )}
              {data.biggestOutflow && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="text-xs text-red-600 font-medium">Největší výdaj (2T)</div>
                  <div className="text-lg font-bold text-red-700 mt-1">{formatCZK(data.biggestOutflow.amount)}</div>
                  <div className="text-sm text-red-600">{data.biggestOutflow.name}</div>
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
              <table className="w-full min-w-[600px]">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Týden</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Počáteční</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Příjmy</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-red-600 uppercase">Výdaje</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Konečný</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.weeks.map((w, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${w.endCash < data.criticalCash ? 'bg-red-50' : w.endCash < data.minBuffer ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-2.5 text-sm font-medium">{w.label}</td>
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

        </>
      ) : <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Nepodařilo se načíst forecast.</div>}
    </div>
  );
}
