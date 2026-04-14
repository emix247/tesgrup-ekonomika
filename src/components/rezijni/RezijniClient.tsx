'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCZK } from '@/lib/utils/format';

interface OverheadCost {
  id: string;
  name: string;
  monthlyAmount: number;
  category: string | null;
  isActive: boolean | null;
}

interface Allocation {
  id: string;
  projectId: string;
  allocationPercent: number;
}

interface Props {
  initialCosts: OverheadCost[];
  initialAllocations: Allocation[];
  projects: { id: string; name: string }[];
}

export default function RezijniClient({ initialCosts, initialAllocations, projects }: Props) {
  const router = useRouter();
  const [costs, setCosts] = useState(initialCosts);
  const [allocations, setAllocations] = useState(initialAllocations);
  const [showCostForm, setShowCostForm] = useState(false);
  const [showAllocForm, setShowAllocForm] = useState(false);
  const [costForm, setCostForm] = useState({ name: '', monthlyAmount: '', category: '' });
  const [allocForm, setAllocForm] = useState({ projectId: '', allocationPercent: '' });
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [editCostForm, setEditCostForm] = useState({ name: '', monthlyAmount: '', category: '' });
  const [editingAllocId, setEditingAllocId] = useState<string | null>(null);
  const [editAllocForm, setEditAllocForm] = useState({ projectId: '', allocationPercent: '' });

  const totalMonthly = costs.filter(c => c.isActive !== false).reduce((s, c) => s + c.monthlyAmount, 0);
  const totalAllocatedPercent = allocations.reduce((s, a) => s + a.allocationPercent, 0);
  const uncoveredPercent = Math.max(0, 100 - totalAllocatedPercent);
  const uncoveredMonthly = totalMonthly * (uncoveredPercent / 100);

  // ── Cost CRUD ──

  async function addCost(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/rezijni-naklady', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: costForm.name,
        monthlyAmount: parseFloat(costForm.monthlyAmount) || 0,
        category: costForm.category,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setCosts([...costs, item]);
      setCostForm({ name: '', monthlyAmount: '', category: '' });
      setShowCostForm(false);
      router.refresh();
    }
  }

  function startEditCost(c: OverheadCost) {
    setEditingCostId(c.id);
    setEditCostForm({ name: c.name, monthlyAmount: String(c.monthlyAmount), category: c.category || '' });
  }

  async function saveEditCost(id: string) {
    const res = await fetch('/api/rezijni-naklady', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: editCostForm.name,
        monthlyAmount: parseFloat(editCostForm.monthlyAmount) || 0,
        category: editCostForm.category,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCosts(costs.map(c => c.id === id ? updated : c));
      setEditingCostId(null);
      router.refresh();
    }
  }

  async function deleteCost(id: string) {
    await fetch(`/api/rezijni-naklady?id=${id}`, { method: 'DELETE' });
    setCosts(costs.filter(c => c.id !== id));
    router.refresh();
  }

  // ── Allocation CRUD ──

  const [allocError, setAllocError] = useState('');

  async function addAllocation(e: React.FormEvent) {
    e.preventDefault();
    setAllocError('');

    const newPercent = parseFloat(allocForm.allocationPercent) || 0;

    // Check if project already has an allocation
    if (allocations.some(a => a.projectId === allocForm.projectId)) {
      setAllocError('Projekt již má alokaci');
      return;
    }

    // Check if total would exceed 100%
    if (totalAllocatedPercent + newPercent > 100) {
      setAllocError(`Celková alokace by překročila 100 % (aktuálně ${totalAllocatedPercent.toFixed(1)} %, přidáváte ${newPercent} %)`);
      return;
    }

    const res = await fetch('/api/rezijni-naklady/alokace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: allocForm.projectId,
        allocationPercent: newPercent,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setAllocations([...allocations, item]);
      setAllocForm({ projectId: '', allocationPercent: '' });
      setShowAllocForm(false);
      router.refresh();
    }
  }

  function startEditAlloc(a: Allocation) {
    setEditingAllocId(a.id);
    setEditAllocForm({ projectId: a.projectId, allocationPercent: String(a.allocationPercent) });
  }

  async function saveEditAlloc(id: string) {
    const res = await fetch('/api/rezijni-naklady/alokace', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        projectId: editAllocForm.projectId,
        allocationPercent: parseFloat(editAllocForm.allocationPercent) || 0,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAllocations(allocations.map(a => a.id === id ? updated : a));
      setEditingAllocId(null);
      router.refresh();
    }
  }

  async function deleteAllocation(id: string) {
    await fetch(`/api/rezijni-naklady/alokace?id=${id}`, { method: 'DELETE' });
    setAllocations(allocations.filter(a => a.id !== id));
    router.refresh();
  }

  const inputCls = 'px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Režijní náklady</h1>
        <p className="text-sm text-gray-500 mt-1">Fixní měsíční náklady firmy a jejich alokace do projektů</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celkové měsíční režie</div>
          <div className="text-2xl font-bold mt-1">{formatCZK(totalMonthly)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Alokováno</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{totalAllocatedPercent.toFixed(0)} %</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Nepokrytá režie</div>
          <div className={`text-2xl font-bold mt-1 ${uncoveredMonthly > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatCZK(uncoveredMonthly)}/měs.
          </div>
        </div>
      </div>

      {/* Overhead Costs Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Fixní náklady</h2>
          <button onClick={() => setShowCostForm(!showCostForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {showCostForm ? 'Zrušit' : '+ Přidat náklad'}
          </button>
        </div>

        {showCostForm && (
          <form onSubmit={addCost} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input placeholder="Název (např. Kancelář)" value={costForm.name} onChange={e => setCostForm({ ...costForm, name: e.target.value })} required className={inputCls} />
              <input type="number" placeholder="Měsíční částka" value={costForm.monthlyAmount} onChange={e => setCostForm({ ...costForm, monthlyAmount: e.target.value })} required className={inputCls} />
              <input placeholder="Kategorie" value={costForm.category} onChange={e => setCostForm({ ...costForm, category: e.target.value })} className={inputCls} />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Přidat</button>
            </div>
          </form>
        )}

        {costs.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Žádné fixní náklady</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Název</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Měsíčně</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ročně</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costs.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  {editingCostId === c.id ? (
                    <>
                      <td className="px-6 py-2">
                        <input value={editCostForm.name} onChange={e => setEditCostForm({ ...editCostForm, name: e.target.value })} className={`${inputCls} w-full`} />
                      </td>
                      <td className="px-6 py-2">
                        <input value={editCostForm.category} onChange={e => setEditCostForm({ ...editCostForm, category: e.target.value })} className={`${inputCls} w-full`} />
                      </td>
                      <td className="px-6 py-2">
                        <input type="number" value={editCostForm.monthlyAmount} onChange={e => setEditCostForm({ ...editCostForm, monthlyAmount: e.target.value })} className={`${inputCls} w-full text-right`} />
                      </td>
                      <td className="px-6 py-2 text-sm text-right text-gray-400">
                        {formatCZK((parseFloat(editCostForm.monthlyAmount) || 0) * 12)}
                      </td>
                      <td className="px-6 py-2 text-right space-x-2">
                        <button onClick={() => saveEditCost(c.id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Uložit</button>
                        <button onClick={() => setEditingCostId(null)} className="text-xs text-gray-400 hover:text-gray-600">Zrušit</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 text-sm font-medium">{c.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{c.category || '—'}</td>
                      <td className="px-6 py-3 text-sm text-right">{formatCZK(c.monthlyAmount)}</td>
                      <td className="px-6 py-3 text-sm text-right">{formatCZK(c.monthlyAmount * 12)}</td>
                      <td className="px-6 py-3 text-right space-x-2">
                        <button onClick={() => startEditCost(c)} className="text-xs text-primary-600 hover:text-primary-700">Upravit</button>
                        <button onClick={() => deleteCost(c.id)} className="text-xs text-gray-400 hover:text-red-600">Smazat</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={2} className="px-6 py-3 text-sm text-right">Celkem:</td>
                <td className="px-6 py-3 text-sm text-right">{formatCZK(totalMonthly)}</td>
                <td className="px-6 py-3 text-sm text-right">{formatCZK(totalMonthly * 12)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Allocation Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Alokace do projektů</h2>
          <button onClick={() => setShowAllocForm(!showAllocForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {showAllocForm ? 'Zrušit' : '+ Přidat alokaci'}
          </button>
        </div>

        {showAllocForm && (
          <form onSubmit={addAllocation} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            {allocError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{allocError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={allocForm.projectId} onChange={e => setAllocForm({ ...allocForm, projectId: e.target.value })} required className={inputCls}>
                <option value="">Vyberte projekt</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" step="0.1" placeholder="Podíl (%)" value={allocForm.allocationPercent} onChange={e => setAllocForm({ ...allocForm, allocationPercent: e.target.value })} required className={inputCls} />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Přidat</button>
            </div>
          </form>
        )}

        {allocations.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Žádné alokace</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projekt</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Podíl</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Měsíčně</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ročně</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allocations.map(a => {
                const proj = projects.find(p => p.id === a.projectId);
                const monthly = totalMonthly * (a.allocationPercent / 100);
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    {editingAllocId === a.id ? (
                      <>
                        <td className="px-6 py-2">
                          <select value={editAllocForm.projectId} onChange={e => setEditAllocForm({ ...editAllocForm, projectId: e.target.value })} className={`${inputCls} w-full`}>
                            <option value="">Vyberte projekt</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-2">
                          <input type="number" step="0.1" value={editAllocForm.allocationPercent} onChange={e => setEditAllocForm({ ...editAllocForm, allocationPercent: e.target.value })} className={`${inputCls} w-full text-right`} />
                        </td>
                        <td className="px-6 py-2 text-sm text-right text-gray-400">
                          {formatCZK(totalMonthly * ((parseFloat(editAllocForm.allocationPercent) || 0) / 100))}
                        </td>
                        <td className="px-6 py-2 text-sm text-right text-gray-400">
                          {formatCZK(totalMonthly * ((parseFloat(editAllocForm.allocationPercent) || 0) / 100) * 12)}
                        </td>
                        <td className="px-6 py-2 text-right space-x-2">
                          <button onClick={() => saveEditAlloc(a.id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Uložit</button>
                          <button onClick={() => setEditingAllocId(null)} className="text-xs text-gray-400 hover:text-gray-600">Zrušit</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3 text-sm font-medium">{proj?.name || a.projectId}</td>
                        <td className="px-6 py-3 text-sm text-right">{a.allocationPercent} %</td>
                        <td className="px-6 py-3 text-sm text-right">{formatCZK(monthly)}</td>
                        <td className="px-6 py-3 text-sm text-right">{formatCZK(monthly * 12)}</td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button onClick={() => startEditAlloc(a)} className="text-xs text-primary-600 hover:text-primary-700">Upravit</button>
                          <button onClick={() => deleteAllocation(a.id)} className="text-xs text-gray-400 hover:text-red-600">Smazat</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
