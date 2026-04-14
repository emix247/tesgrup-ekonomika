'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCZK } from '@/lib/utils/format';

interface PaymentRow {
  id: string; amount: number; paymentDate: string; label: string | null;
  buyerName: string | null; unitLabel: string | null; unitType: string | null;
  projectName: string | null; projectId: string; notes: string | null;
}

interface Summary {
  total: number; totalDanene: number; totalNedanene: number;
  thisMonthTotal: number; thisQuarterTotal: number; activeContracts: number;
  monthly: Record<string, number>; byProject: Record<string, number>;
}

interface DevProject { id: string; name: string; }
interface Unit { id: string; unitType: string; label: string | null; totalPrice: number | null; }
interface Sale { id: string; unitId: string | null; buyerName: string | null; agreedPrice: number | null; status: string; }

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function PrijmyGlobalPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editNedanene, setEditNedanene] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = (p: PaymentRow) => {
    setEditingId(p.id);
    setEditAmount(String(p.amount));
    setEditDate(p.paymentDate);
    setEditLabel(p.label || '');
    setEditNedanene(p.notes === 'nedanene');
  };

  const saveEdit = async (paymentId: string, projectId: string) => {
    setEditSaving(true);
    try {
      await fetch(`/api/projekty/${projectId}/platby`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentId,
          amount: parseFloat(editAmount),
          paymentDate: editDate,
          label: editLabel || null,
          notes: editNedanene ? 'nedanene' : null,
        }),
      });
      setEditingId(null);
      loadData();
    } finally { setEditSaving(false); }
  };

  // Payment form state
  const [showForm, setShowForm] = useState(false);
  const [formProject, setFormProject] = useState('');
  const [formUnits, setFormUnits] = useState<Unit[]>([]);
  const [formSales, setFormSales] = useState<Sale[]>([]);
  const [formUnitsLoading, setFormUnitsLoading] = useState(false);
  const [formUnit, setFormUnit] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<'oficialni' | 'nedanene'>('oficialni');
  const [formBuyer, setFormBuyer] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
    }).catch(() => {
      setError('Nepodařilo se načíst data.');
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  // Load units + sales when project changes in form
  useEffect(() => {
    if (!formProject) { setFormUnits([]); setFormSales([]); setFormUnit(''); return; }
    setFormUnitsLoading(true);
    Promise.all([
      fetch(`/api/projekty/${formProject}/prijmy`).then(r => r.json()),
      fetch(`/api/projekty/${formProject}/prodeje`).then(r => r.json()),
    ]).then(([data, sales]) => {
      const units = Array.isArray(data?.units) ? data.units : (Array.isArray(data) ? data : []);
      setFormUnits(units);
      setFormSales(Array.isArray(sales) ? sales : []);
      setFormUnit('');
      setFormUnitsLoading(false);
    }).catch(() => { setFormUnits([]); setFormSales([]); setFormUnitsLoading(false); });
  }, [formProject]);

  const handleDeletePayment = async (paymentId: string, projectId: string) => {
    if (!confirm('Opravdu chcete smazat tuto platbu?')) return;
    setDeleting(paymentId);
    try {
      const res = await fetch(`/api/projekty/${projectId}/platby?id=${paymentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      loadData();
    } catch { alert('Nepodařilo se smazat.'); }
    finally { setDeleting(null); }
  };

  const handleFormSubmit = async () => {
    if (!formProject || !formUnit || !formAmount || !formDate) {
      setFormError('Vyplňte projekt, jednotku, částku a datum.');
      return;
    }
    setFormError('');
    setFormSubmitting(true);
    try {
      // Find or create sale for this unit
      let saleId = '';
      const existingSale = formSales.find(s => s.unitId === formUnit);
      if (existingSale) {
        saleId = existingSale.id;
      } else {
        // Create a new sale automatically
        const unit = formUnits.find(u => u.id === formUnit);
        const saleRes = await fetch(`/api/projekty/${formProject}/prodeje`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitId: formUnit,
            buyerName: formBuyer || null,
            status: 'zaloha',
            agreedPrice: unit?.totalPrice || 0,
          }),
        });
        if (!saleRes.ok) { setFormError('Nepodařilo se vytvořit prodej.'); return; }
        const newSale = await saleRes.json();
        saleId = newSale.id;
      }

      // Create the payment
      const label = formType === 'nedanene'
        ? `${formLabel || 'Nedaněný příjem'}`.trim()
        : formLabel || null;

      const res = await fetch(`/api/projekty/${formProject}/platby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId,
          amount: parseFloat(formAmount),
          paymentDate: formDate,
          label,
          notes: formType === 'nedanene' ? 'nedanene' : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Chyba při ukládání.');
        return;
      }
      // Reset form & reload
      setFormProject(''); setFormUnit(''); setFormAmount(''); setFormLabel('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormType('oficialni'); setFormBuyer('');
      setShowForm(false);
      loadData();
    } finally { setFormSubmitting(false); }
  };

  const filtered = filterProject ? payments.filter(p => p.projectId === filterProject) : payments;
  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('cs-CZ'); } catch { return d; } };

  const monthlyData = summary ? Object.entries(summary.monthly).map(([month, amount]) => ({
    name: month.substring(5) + '/' + month.substring(2, 4), amount,
  })) : [];
  const projMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
  const projectData = summary ? Object.entries(summary.byProject).map(([id, amount], i) => ({
    name: projMap[id] || id, value: amount, color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0) : [];
  const fmtAxis = (v: number) => { if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `${(v/1e3).toFixed(0)}k`; return `${v}`; };

  const selectCls = 'px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white w-full';

  // Find unit info for selected unit
  const selectedUnit = formUnits.find(u => u.id === formUnit);
  const existingSaleForUnit = formSales.find(s => s.unitId === formUnit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Developerské příjmy</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Přidat platbu
        </button>
      </div>

      {/* Add payment form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold">Nová platba</h3>
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{formError}</div>}

          {/* Payment type */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formType === 'oficialni'} onChange={() => setFormType('oficialni')} className="text-primary-600" />
              <span className="text-sm font-medium">Oficiální příjem</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formType === 'nedanene'} onChange={() => setFormType('nedanene')} className="text-primary-600" />
              <span className="text-sm font-medium text-orange-600">Nedaněný příjem</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Projekt *</label>
              <select value={formProject} onChange={e => setFormProject(e.target.value)} className={selectCls}>
                <option value="">Vyberte projekt...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jednotka *</label>
              <select value={formUnit} onChange={e => setFormUnit(e.target.value)} className={selectCls}
                disabled={!formProject || formUnitsLoading}>
                <option value="">{formUnitsLoading ? 'Načítám...' : formProject ? 'Vyberte jednotku...' : 'Nejprve vyberte projekt'}</option>
                {formUnits.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.label || u.unitType} {u.totalPrice ? `(${formatCZK(u.totalPrice)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kupující</label>
              <input type="text" value={formBuyer} onChange={e => setFormBuyer(e.target.value)}
                placeholder={existingSaleForUnit?.buyerName || 'Jméno kupujícího'}
                className={selectCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Částka (Kč) *</label>
              <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                placeholder="0" className={selectCls} />
              {selectedUnit?.totalPrice && (
                <div className="text-[10px] text-gray-400 mt-1">Celková cena jednotky: {formatCZK(selectedUnit.totalPrice)}</div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum platby *</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className={selectCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Popis</label>
              <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)}
                placeholder={formType === 'nedanene' ? 'Nedaněný příjem' : 'Např. 1. záloha'} className={selectCls} />
            </div>
          </div>

          {formType === 'nedanene' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
              Nedaněný příjem nebude zahrnut do daňového výpočtu (DPPO/DPFO). Bude evidován zvlášť.
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleFormSubmit} disabled={formSubmitting}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {formSubmitting ? 'Ukládám...' : 'Uložit platbu'}
            </button>
            <button onClick={() => { setShowForm(false); setFormError(''); }}
              className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">Zrušit</button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-center gap-2">
          {error}
          <button onClick={loadData} className="ml-auto text-red-700 underline text-sm">Zkusit znovu</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500">Celkové příjmy</div>
                  <div className="text-xl font-bold mt-1 text-emerald-600">{formatCZK(summary.total)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500">Daněné příjmy</div>
                  <div className="text-xl font-bold mt-1 text-blue-600">{formatCZK(summary.totalDanene)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500">Nedaněné příjmy</div>
                  <div className="text-xl font-bold mt-1 text-orange-600">{formatCZK(summary.totalNedanene)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500">Tento měsíc</div>
                  <div className="text-xl font-bold mt-1">{formatCZK(summary.thisMonthTotal)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500">Aktivní smlouvy</div>
                  <div className="text-xl font-bold mt-1">{summary.activeContracts}</div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Všechny projekty</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold">Přijaté platby ({filtered.length})</h2>
            </div>
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">Žádné platby — přidejte první tlačítkem nahoře.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead><tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projekt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jednotka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kupující</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popis</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(p => {
                      const isNedanene = p.notes === 'nedanene';
                      const isEditing = editingId === p.id;

                      if (isEditing) {
                        return (
                          <tr key={p.id} className="bg-primary-50/30">
                            <td className="px-4 py-2 text-sm">
                              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-32" />
                            </td>
                            <td className="px-4 py-2 text-sm font-medium">{p.projectName || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{p.unitLabel || p.unitType || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{p.buyerName || '—'}</td>
                            <td className="px-4 py-2 text-sm text-right">
                              <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-28 text-right" />
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={editNedanene} onChange={e => setEditNedanene(e.target.checked)}
                                  className="rounded border-gray-300 text-orange-500" />
                                <span className="text-xs">{editNedanene ? 'Nedaněný' : 'Oficiální'}</span>
                              </label>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                                placeholder="Popis" className="px-2 py-1 border border-gray-300 rounded text-sm w-full" />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => saveEdit(p.id, p.projectId)} disabled={editSaving}
                                  className="text-emerald-600 hover:text-emerald-700 text-xs font-medium disabled:opacity-50">
                                  {editSaving ? '...' : 'Uložit'}
                                </button>
                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 text-xs">Zrušit</button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id} className={`hover:bg-gray-50 ${isNedanene ? 'bg-orange-50/30' : ''}`}>
                          <td className="px-4 py-2.5 text-sm">{fmtDate(p.paymentDate)}</td>
                          <td className="px-4 py-2.5 text-sm font-medium">{p.projectName || '—'}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">{p.unitLabel || p.unitType || '—'}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">{p.buyerName || '—'}</td>
                          <td className={`px-4 py-2.5 text-sm text-right font-medium tabular-nums ${isNedanene ? 'text-orange-600' : 'text-emerald-600'}`}>{formatCZK(p.amount)}</td>
                          <td className="px-4 py-2.5 text-sm">
                            <button
                              onClick={async () => {
                                await fetch(`/api/projekty/${p.projectId}/platby`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: p.id, notes: isNedanene ? null : 'nedanene' }),
                                });
                                loadData();
                              }}
                              className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer hover:opacity-80 transition-opacity ${isNedanene ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}
                              title="Klikni pro přepnutí typu"
                            >
                              {isNedanene ? 'Nedaněný' : 'Oficiální'}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500">{p.label || '—'}</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => startEdit(p)} className="text-primary-600 hover:text-primary-700 text-xs">Upravit</button>
                              <button onClick={() => handleDeletePayment(p.id, p.projectId)} disabled={deleting === p.id}
                                className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50">{deleting === p.id ? '...' : 'Smazat'}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
