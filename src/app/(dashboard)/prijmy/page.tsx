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

interface DevProject { id: string; name: string; }
interface Sale { id: string; buyerName: string | null; unitLabel: string | null; contractPrice: number; }

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function PrijmyGlobalPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);

  // Payment form state
  const [showForm, setShowForm] = useState(false);
  const [formProject, setFormProject] = useState('');
  const [formSales, setFormSales] = useState<Sale[]>([]);
  const [formSalesLoading, setFormSalesLoading] = useState(false);
  const [formSale, setFormSale] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/prijmy').then(r => r.json()),
      fetch('/api/prijmy?type=summary').then(r => r.json()),
      fetch('/api/projekty').then(r => r.json()).then(d => Array.isArray(d) ? d : []),
    ]).then(([p, s, proj]) => {
      setPayments(Array.isArray(p) ? p : []);
      setSummary(s);
      setProjects(proj);
      setLoading(false);
    }).catch((err) => {
      setError('Nepodarilo se nacist data. Zkuste to znovu.');
      setLoading(false);
    });
  };

  const handleDeletePayment = async (paymentId: string, projectId: string) => {
    if (!confirm('Opravdu chcete smazat tuto platbu?')) return;
    setDeleting(paymentId);
    try {
      const res = await fetch(`/api/projekty/${projectId}/platby?id=${paymentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      loadData();
    } catch {
      alert('Nepodarilo se smazat platbu.');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Load sales when project changes in form
  useEffect(() => {
    if (!formProject) { setFormSales([]); setFormSale(''); return; }
    setFormSalesLoading(true);
    fetch(`/api/projekty/${formProject}/prodeje`).then(r => r.json()).then(d => {
      setFormSales(Array.isArray(d) ? d : []);
      setFormSale('');
      setFormSalesLoading(false);
    }).catch(() => { setFormSales([]); setFormSalesLoading(false); });
  }, [formProject]);

  const handleFormSubmit = async () => {
    if (!formProject || !formSale || !formAmount || !formDate) {
      setFormError('Vyplnte projekt, prodej, castku a datum.');
      return;
    }
    setFormError('');
    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/projekty/${formProject}/platby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: formSale,
          amount: parseFloat(formAmount),
          paymentDate: formDate,
          label: formLabel || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Chyba pri ukladani.');
        return;
      }
      // Reset form & reload
      setFormProject('');
      setFormSale('');
      setFormAmount('');
      setFormDate('');
      setFormLabel('');
      setShowForm(false);
      loadData();
    } finally {
      setFormSubmitting(false);
    }
  };

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

  const selectCls = "px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white w-full";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Developerske prijmy</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Pridat platbu
        </button>
      </div>

      {/* Add payment form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-sm">Nova platba</h3>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{formError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Projekt</label>
              <select value={formProject} onChange={e => setFormProject(e.target.value)} className={selectCls}>
                <option value="">Vyberte projekt...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prodej (kupujici / jednotka)</label>
              <select value={formSale} onChange={e => setFormSale(e.target.value)} className={selectCls}
                disabled={!formProject || formSalesLoading}>
                <option value="">{formSalesLoading ? 'Nacitam...' : formProject ? 'Vyberte prodej...' : 'Nejprve vyberte projekt'}</option>
                {formSales.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.buyerName || 'Bez jmena'} -- {s.unitLabel || 'jednotka'} ({formatCZK(s.contractPrice)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Castka (Kc)</label>
              <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                placeholder="0" className={selectCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum platby</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className={selectCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Popis / label</label>
              <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)}
                placeholder="Napr. 1. splatka" className={selectCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleFormSubmit} disabled={formSubmitting}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {formSubmitting ? 'Ukladam...' : 'Ulozit platbu'}
            </button>
            <button onClick={() => { setShowForm(false); setFormError(''); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Zrusit</button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          {error}
          <button onClick={loadData} className="ml-auto text-red-700 underline text-sm">Zkusit znovu</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* KPI cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Celkove prijate prijmy</div>
                <div className="text-xl font-bold mt-1 text-emerald-600">{formatCZK(summary.total)}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Tento mesic</div>
                <div className="text-xl font-bold mt-1">{formatCZK(summary.thisMonthTotal)}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Tento kvartal</div>
                <div className="text-xl font-bold mt-1">{formatCZK(summary.thisQuarterTotal)}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500">Aktivni smlouvy</div>
                <div className="text-xl font-bold mt-1">{summary.activeContracts}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3">
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Vsechny projekty</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Payments table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold">Prijate platby ({filtered.length})</h2>
            </div>
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">Zadne platby</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead><tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projekt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jednotka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kupujici</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Castka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popis</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
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
                        <td className="px-4 py-2.5 text-sm text-right">
                          <button
                            onClick={() => handleDeletePayment(p.id, p.projectId)}
                            disabled={deleting === p.id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                          >
                            {deleting === p.id ? '...' : 'Smazat'}
                          </button>
                        </td>
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Prijmy po mesicich</h3>
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Prijmy podle projektu</h3>
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
