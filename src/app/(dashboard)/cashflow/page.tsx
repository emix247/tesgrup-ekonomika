'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface AlertData {
  items: { id: number; name: string; amount: number; paymentDate: string; type: string }[];
  loans: { id: number; amount: number; dueDate: string }[];
  threshold: number;
  daysAhead: number;
}

interface CfProject {
  id: number; name: string;
}

interface Snapshot {
  id: number; weekLabel: string; note: string | null; createdAt: string;
  summary: { startCash: number; baseMinCash: number; baseSemaphore: string; itemCount: number } | null;
}

const LABELS: Record<Scenario, string> = { conservative: 'Konzervativni', base: 'Zakladni', optimistic: 'Optimisticky' };
const SEM = {
  green: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'Zdrave' },
  orange: { bg: 'bg-amber-500', text: 'text-amber-600', label: 'Pozor' },
  red: { bg: 'bg-red-500', text: 'text-red-600', label: 'Kriticke' },
};
const SEM_DESC: Record<string, string> = {
  green: 'V PORADKU -- Cashflow je zdrave v celem horizontu',
  orange: 'POZOR -- Cash klesne pod buffer',
  red: 'KRITICKE -- Cash klesne pod kritickou hranici',
};

const fmtShortDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }); } catch { return ''; }
};

export default function CashflowDashboard() {
  const [scenario, setScenario] = useState<Scenario>('base');
  const [data, setData] = useState<ForecastData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [projects, setProjects] = useState<CfProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    const forecastUrl = selectedProject
      ? `/api/cashflow/forecast?scenario=${scenario}&projectId=${selectedProject}`
      : `/api/cashflow/forecast?scenario=${scenario}`;
    Promise.all([
      fetch(forecastUrl).then(r => r.json()),
      fetch('/api/cashflow/snapshots').then(r => r.json()),
      fetch('/api/cashflow/alerts').then(r => r.json()),
      fetch('/api/cashflow/projects').then(r => r.json()),
    ]).then(([d, s, a, p]) => {
      setData(d);
      setSnapshots(Array.isArray(s) ? s.slice(0, 5) : []);
      setAlerts(a && a.items ? a : null);
      setProjects(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [scenario, selectedProject]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      await fetch('/api/cashflow/snapshots', { method: 'POST' });
      loadData();
    } finally {
      setSnapshotLoading(false);
    }
  };

  const fmtAxis = (v: number) => {
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v/1e6).toFixed(1)}M`;
    if (a >= 1e3) return `${(v/1e3).toFixed(0)}k`;
    return `${v}`;
  };

  const sem = data ? SEM[data.semaphore] : null;

  return (
    <div className="space-y-6">
      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link href="/cashflow/polozky/nova?type=in"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Novy prijem
        </Link>
        <Link href="/cashflow/polozky/nova?type=out"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Novy vydaj
        </Link>
        <Link href="/cashflow/zustatky"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 inline-flex items-center gap-1.5">
          Zustatek
        </Link>
        <button onClick={handleSnapshot} disabled={snapshotLoading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5">
          {snapshotLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg>
          )}
          Snapshot
        </button>
        <Link href="/cashflow/report" target="_blank"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
          PDF Report
        </Link>
      </div>

      {/* Alerts section */}
      {alerts && (alerts.items.length > 0 || alerts.loans.length > 0) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <span className="font-semibold text-amber-800">Upozorneni -- polozky nad {formatCZK(alerts.threshold)} v nasledujicich {alerts.daysAhead} dnech</span>
          </div>
          <ul className="space-y-1">
            {alerts.items.map(item => (
              <li key={item.id} className="text-sm text-amber-700 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${item.type === 'in' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-medium">{item.name}</span>
                <span>{formatCZK(item.amount)}</span>
                <span className="text-amber-500">-- {fmtShortDate(item.paymentDate)}</span>
              </li>
            ))}
            {alerts.loans.map(loan => (
              <li key={`loan-${loan.id}`} className="text-sm text-amber-700 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                <span className="font-medium">Splatnost uveru</span>
                <span>{formatCZK(loan.amount)}</span>
                <span className="text-amber-500">-- {fmtShortDate(loan.dueDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project filter + Scenario selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 font-medium uppercase mr-1">Projekt:</span>
        <button onClick={() => setSelectedProject(null)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedProject === null ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          Celkem (firma)
        </button>
        {projects.map(p => (
          <button key={p.id} onClick={() => setSelectedProject(p.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedProject === p.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {p.name}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-gray-500 font-medium uppercase mr-1">Scenar:</span>
        {(Object.keys(LABELS) as Scenario[]).map(s => (
          <button key={s} onClick={() => setScenario(s)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${scenario === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
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
          {/* Semaphore with description */}
          <div className={`rounded-xl border p-4 flex items-center gap-4 ${
            data.semaphore === 'green' ? 'bg-emerald-50 border-emerald-200' :
            data.semaphore === 'orange' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className={`w-6 h-6 rounded-full ${sem?.bg} shrink-0`} />
            <div>
              <span className={`text-lg font-bold ${sem?.text}`}>{sem?.label}</span>
              <span className="text-sm text-gray-600 ml-3">{SEM_DESC[data.semaphore]}</span>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`w-5 h-5 rounded-full ${sem?.bg} shrink-0`} />
              <div><div className="text-xs text-gray-500">Semafor</div><div className={`text-lg font-bold ${sem?.text}`}>{sem?.label}</div></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs text-gray-500">Pocatecni stav</div>
              <div className="text-lg font-bold mt-1">{formatCZK(data.startCash)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs text-gray-500">Minimum v 13T</div>
              <div className={`text-lg font-bold mt-1 ${data.minCash < data.criticalCash ? 'text-red-600' : data.minCash < data.minBuffer ? 'text-amber-600' : 'text-emerald-600'}`}>{formatCZK(data.minCash)}</div>
            </div>
          </div>

          {/* Biggest items */}
          {(data.biggestInflow || data.biggestOutflow) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {data.biggestInflow && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-emerald-600 text-xs">Nejvetsi prijem (2T):</span>
                  <span className="font-bold text-emerald-700">{formatCZK(data.biggestInflow.amount)}</span>
                  <span className="text-emerald-600 text-xs">-- {data.biggestInflow.name}</span>
                </div>
              )}
              {data.biggestOutflow && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-red-600 text-xs">Nejvetsi vydaj (2T):</span>
                  <span className="font-bold text-red-700">{formatCZK(data.biggestOutflow.amount)}</span>
                  <span className="text-red-600 text-xs">-- {data.biggestOutflow.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Line chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Vyvoj cashflow</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.weeks} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCZK(value)} />
                <ReferenceLine y={data.minBuffer} stroke="#f59e0b" strokeDasharray="5 5" />
                <ReferenceLine y={data.criticalCash} stroke="#ef4444" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="endCash" name="Zustatek" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 13-week table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tyden</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obdobi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pocatecni</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Prijmy</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-red-600 uppercase">Vydaje</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Konecny</th>
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
                <h3 className="text-lg font-semibold">Historie snapshotu</h3>
                <Link href="/cashflow/snapshoty" className="text-sm text-primary-600 hover:text-primary-700">Zobrazit vse →</Link>
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
                          {s.summary.baseSemaphore === 'green' ? 'OK' : s.summary.baseSemaphore === 'orange' ? 'Pozor' : 'Kriticke'}
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
      ) : <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Nepodarilo se nacist forecast.</div>}
    </div>
  );
}
