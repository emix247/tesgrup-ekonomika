'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCZK } from '@/lib/utils/format';

interface PaymentRow {
  id: string; amount: number; paymentDate: string; label: string | null;
  buyerName: string | null; unitLabel: string | null; unitType: string | null;
  projectName: string | null; projectId: string;
}

interface Summary {
  total: number; thisMonthTotal: number; thisQuarterTotal: number; activeContracts: number;
  monthly: Record<string, number>; byProject: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function PrijmyGlobalPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/prijmy').then(r => r.json()),
      fetch('/api/prijmy?type=summary').then(r => r.json()),
      fetch('/api/projekty').then(r => r.json()).then(d => Array.isArray(d) ? d : []),
    ]).then(([p, s, proj]) => {
      setPayments(Array.isArray(p) ? p : []);
      setSummary(s);
      setProjects(proj);
      setLoading(false);
    });
  }, []);

  const filtered = filterProject ? payments.filter(p => p.projectId === filterProject) : payments;

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('cs-CZ'); } catch { return d; }
  };

  // Chart data
  const monthlyData = summary ? Object.entries(summary.monthly).map(([month, amount]) => ({
    name: month.substring(5) + '/' + month.substring(2, 4),
    amount,
  })) : [];

  const projMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
  const projectData = summary ? Object.entries(summary.byProject).map(([id, amount], i) => ({
    name: projMap[id] || id,
    value: amount,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0) : [];

  const fmtAxis = (v: number) => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
    return `${v}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Developerské příjmy</h1>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* KPI cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Celkové přijaté příjmy</div>
                <div className="text-xl font-bold mt-1 text-emerald-600">{formatCZK(summary.total)}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Tento měsíc</div>
                <div className="text-xl font-bold mt-1">{formatCZK(summary.thisMonthTotal)}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Tento kvartál</div>
                <div className="text-xl font-bold mt-1">{formatCZK(summary.thisQuarterTotal)}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Aktivní smlouvy</div>
                <div className="text-xl font-bold mt-1">{summary.activeContracts}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3">
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Všechny projekty</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Payments table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold">Přijaté platby ({filtered.length})</h2>
            </div>
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">Žádné platby</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead><tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projekt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jednotka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kupující</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popis</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-sm">{fmtDate(p.paymentDate)}</td>
                        <td className="px-4 py-2.5 text-sm font-medium">{p.projectName || '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{p.unitLabel || p.unitType || '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{p.buyerName || '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-medium tabular-nums text-emerald-600">{formatCZK(p.amount)}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500">{p.label || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Charts */}
          {(monthlyData.some(d => d.amount > 0) || projectData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {monthlyData.some(d => d.amount > 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-hidden">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Příjmy po měsících</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatCZK(v)} />
                      <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {projectData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-hidden">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Příjmy podle projektů</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={projectData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={false}>
                        {projectData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCZK(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
