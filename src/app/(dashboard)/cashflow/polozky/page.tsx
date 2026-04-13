'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatCZK } from '@/lib/utils/format';

interface CfProject { id: number; name: string; }

interface CfItem {
  id: number; type: string; name: string; amount: number; paymentDate: string;
  certainty: string; category: string; isPaid: boolean; counterparty: string | null;
  project: { id: number; name: string } | null;
}

const CATEGORIES = [
  'pozemky','projekce','urady','subdodavky','mzdy+rezie','DPH','uroky','investice','prodeje','cerpani banky/investor','ostatni'
];

export default function PolozkyPage() {
  const [items, setItems] = useState<CfItem[]>([]);
  const [projects, setProjects] = useState<CfProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterCertainty, setFilterCertainty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Bulk selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Bulk shift
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftDays, setShiftDays] = useState(7);
  const [shiftLoading, setShiftLoading] = useState(false);

  // Recurring series form
  const [showSeries, setShowSeries] = useState(false);
  const [series, setSeries] = useState({
    type: 'out', name: '', amount: '', certainty: 'B', category: 'ostatni',
    projectId: '', counterparty: '', note: '', startDate: '', frequency: 'monthly', occurrences: '3',
  });
  const [seriesLoading, setSeriesLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/cashflow/items').then(r => r.json()),
      fetch('/api/cashflow/projects').then(r => r.json()),
    ]).then(([d, p]) => {
      setItems(Array.isArray(d) ? d : []);
      setProjects(Array.isArray(p) ? p : []);
      setSelected(new Set());
      setLoading(false);
    });
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filterType !== 'all' && i.type !== filterType) return false;
      if (filterCertainty !== 'all' && i.certainty !== filterCertainty) return false;
      if (filterCategory !== 'all' && i.category !== filterCategory) return false;
      if (filterProject !== 'all' && (i.project?.id?.toString() ?? '') !== filterProject) return false;
      if (filterStatus === 'paid' && !i.isPaid) return false;
      if (filterStatus === 'pending' && i.isPaid) return false;
      return true;
    });
  }, [items, filterType, filterCertainty, filterCategory, filterProject, filterStatus]);

  // Summary
  const summary = useMemo(() => {
    const totalIn = filtered.filter(i => i.type === 'in').reduce((s, i) => s + i.amount, 0);
    const totalOut = filtered.filter(i => i.type === 'out').reduce((s, i) => s + i.amount, 0);
    const pending = filtered.filter(i => !i.isPaid).length;
    return { count: filtered.length, totalIn, totalOut, balance: totalIn - totalOut, pending };
  }, [filtered]);

  const togglePaid = async (id: number, current: boolean) => {
    await fetch(`/api/cashflow/items/${id}/paid`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPaid: !current }) });
    load();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Smazat polozku?')) return;
    await fetch(`/api/cashflow/items/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => i.id)));
    }
  };

  const handleBulkShift = async () => {
    if (selected.size === 0) return;
    setShiftLoading(true);
    try {
      await fetch('/api/cashflow/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), shiftDays }),
      });
      setShowShiftModal(false);
      load();
    } finally {
      setShiftLoading(false);
    }
  };

  const handleSeriesSubmit = async () => {
    setSeriesLoading(true);
    try {
      const res = await fetch('/api/cashflow/items/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...series,
          amount: parseFloat(series.amount),
          occurrences: parseInt(series.occurrences),
          projectId: series.projectId || null,
        }),
      });
      if (res.ok) {
        setShowSeries(false);
        setSeries({ type: 'out', name: '', amount: '', certainty: 'B', category: 'ostatni', projectId: '', counterparty: '', note: '', startDate: '', frequency: 'monthly', occurrences: '3' });
        load();
      }
    } finally {
      setSeriesLoading(false);
    }
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('cs-CZ'); } catch { return d; }
  };

  const selectCls = "px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white";

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={() => setShowSeries(!showSeries)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" /></svg>
          Serie
        </button>
        <Link href="/cashflow/polozky/nova" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nova polozka
        </Link>
      </div>

      {/* Recurring series form */}
      {showSeries && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-sm">Vytvorit opakovanou serii</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <select value={series.type} onChange={e => setSeries(s => ({ ...s, type: e.target.value }))} className={selectCls}>
              <option value="in">Prijem</option><option value="out">Vydaj</option>
            </select>
            <input placeholder="Nazev" value={series.name} onChange={e => setSeries(s => ({ ...s, name: e.target.value }))} className={selectCls} />
            <input type="number" placeholder="Castka" value={series.amount} onChange={e => setSeries(s => ({ ...s, amount: e.target.value }))} className={selectCls} />
            <select value={series.certainty} onChange={e => setSeries(s => ({ ...s, certainty: e.target.value }))} className={selectCls}>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option>
            </select>
            <select value={series.category} onChange={e => setSeries(s => ({ ...s, category: e.target.value }))} className={selectCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={series.projectId} onChange={e => setSeries(s => ({ ...s, projectId: e.target.value }))} className={selectCls}>
              <option value="">Bez projektu</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input placeholder="Protistrana" value={series.counterparty} onChange={e => setSeries(s => ({ ...s, counterparty: e.target.value }))} className={selectCls} />
            <input type="date" value={series.startDate} onChange={e => setSeries(s => ({ ...s, startDate: e.target.value }))} className={selectCls} />
            <select value={series.frequency} onChange={e => setSeries(s => ({ ...s, frequency: e.target.value }))} className={selectCls}>
              <option value="weekly">Tyden</option><option value="biweekly">2 tydny</option>
              <option value="monthly">Mesic</option><option value="quarterly">Kvartal</option>
            </select>
            <input type="number" min={2} max={24} placeholder="Pocet" value={series.occurrences} onChange={e => setSeries(s => ({ ...s, occurrences: e.target.value }))} className={selectCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSeriesSubmit} disabled={seriesLoading || !series.name || !series.amount || !series.startDate}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {seriesLoading ? 'Vytvari se...' : 'Vytvorit serii'}
            </button>
            <button onClick={() => setShowSeries(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Zrusit</button>
          </div>
        </div>
      )}

      {/* Advanced filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
          <option value="all">Typ: Vse</option><option value="in">Prijem</option><option value="out">Vydaj</option>
        </select>
        <select value={filterCertainty} onChange={e => setFilterCertainty(e.target.value)} className={selectCls}>
          <option value="all">Jistota: Vse</option><option value="A">A</option><option value="B">B</option><option value="C">C</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls}>
          <option value="all">Kategorie: Vse</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={selectCls}>
          <option value="all">Projekt: Vse</option>
          {projects.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="all">Stav: Vse</option><option value="pending">Cekajici</option><option value="paid">Uhrazeno</option>
        </select>
      </div>

      {/* Summary row */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-6 text-sm">
        <span className="text-gray-600">Celkem: <strong>{summary.count}</strong> polozek</span>
        <span className="text-emerald-600">Prijmy: <strong>{formatCZK(summary.totalIn)}</strong></span>
        <span className="text-red-600">Vydaje: <strong>{formatCZK(summary.totalOut)}</strong></span>
        <span className={summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}>Bilance: <strong>{formatCZK(summary.balance)}</strong></span>
        <span className="text-amber-600">Cekajici: <strong>{summary.pending}</strong></span>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <span className="text-sm text-blue-700 font-medium">Vybrano: {selected.size}</span>
          <button onClick={() => setShowShiftModal(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Posunout vybrane
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-blue-600 hover:text-blue-800">Zrusit vyber</button>
        </div>
      )}

      {/* Shift modal */}
      {showShiftModal && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <span className="text-sm">Posunout {selected.size} polozek o</span>
          <input type="number" value={shiftDays} onChange={e => setShiftDays(parseInt(e.target.value) || 0)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <span className="text-sm">dni</span>
          <button onClick={handleBulkShift} disabled={shiftLoading}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {shiftLoading ? 'Posouvam...' : 'Posunout'}
          </button>
          <button onClick={() => setShowShiftModal(false)} className="text-sm text-gray-600 hover:text-gray-800">Zrusit</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Zadne polozky</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-center w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll} className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazev</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projekt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Protistrana</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Castka</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jistota</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Uhrazeno</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akce</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${selected.has(item.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-2.5 text-center">
                      <input type="checkbox" checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.type === 'in' ? 'Prijem' : 'Vydaj'}</div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{item.project?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{item.counterparty || '—'}</td>
                    <td className={`px-4 py-2.5 text-sm text-right font-medium tabular-nums ${item.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.type === 'in' ? '+' : '-'}{formatCZK(item.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-sm">{fmtDate(item.paymentDate)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.certainty === 'A' ? 'bg-emerald-100 text-emerald-700' : item.certainty === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{item.certainty}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{item.category}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => togglePaid(item.id, item.isPaid)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        {item.isPaid ? 'Uhrazeno' : 'Oznacit'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/cashflow/polozky/${item.id}`} className="text-primary-600 hover:text-primary-700 text-sm mr-3">Upravit</Link>
                      <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-600 text-sm">Smazat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
