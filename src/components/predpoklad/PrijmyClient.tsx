'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UNIT_TYPES, EXTRA_CATEGORIES } from '@/lib/utils/constants';
import { formatCZK, formatNumber } from '@/lib/utils/format';

interface Unit {
  id: string;
  unitType: string;
  label: string | null;
  area: number | null;
  pricePerM2: number | null;
  totalPrice: number | null;
  plannedSaleMonth: number | null;
}

interface Extra {
  id: string;
  category: string;
  label: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number | null;
}

interface Props {
  projectId: string;
  initialUnits: Unit[];
  initialExtras: Extra[];
}

export default function PrijmyClient({ projectId, initialUnits, initialExtras }: Props) {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [extras, setExtras] = useState<Extra[]>(initialExtras);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitType: 'dum', label: '', area: '', pricePerM2: '', totalPrice: '', plannedSaleMonth: '' });
  const [extraForm, setExtraForm] = useState({ category: 'garaz', label: '', quantity: '1', unitPrice: '' });

  const unitsTotal = units.reduce((s, u) => s + (u.totalPrice || 0), 0);
  const extrasTotal = extras.reduce((s, e) => s + (e.totalPrice || 0), 0);

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/prijmy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitType: unitForm.unitType,
        label: unitForm.label,
        area: unitForm.area ? parseFloat(unitForm.area) : undefined,
        pricePerM2: unitForm.pricePerM2 ? parseFloat(unitForm.pricePerM2) : undefined,
        totalPrice: unitForm.totalPrice ? parseFloat(unitForm.totalPrice) : undefined,
        plannedSaleMonth: unitForm.plannedSaleMonth ? parseInt(unitForm.plannedSaleMonth) : undefined,
      }),
    });
    if (res.ok) {
      const unit = await res.json();
      setUnits([...units, unit]);
      setUnitForm({ unitType: 'dum', label: '', area: '', pricePerM2: '', totalPrice: '', plannedSaleMonth: '' });
      setShowUnitForm(false);
      router.refresh();
    }
  }

  async function addExtra(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/prijmy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'extra',
        category: extraForm.category,
        label: extraForm.label,
        quantity: parseInt(extraForm.quantity) || 1,
        unitPrice: parseFloat(extraForm.unitPrice) || 0,
      }),
    });
    if (res.ok) {
      const extra = await res.json();
      setExtras([...extras, extra]);
      setExtraForm({ category: 'garaz', label: '', quantity: '1', unitPrice: '' });
      setShowExtraForm(false);
      router.refresh();
    }
  }

  async function deleteUnit(id: string) {
    await fetch(`/api/projekty/${projectId}/prijmy?id=${id}`, { method: 'DELETE' });
    setUnits(units.filter(u => u.id !== id));
    router.refresh();
  }

  async function deleteExtra(id: string) {
    await fetch(`/api/projekty/${projectId}/prijmy?id=${id}&type=extra`, { method: 'DELETE' });
    setExtras(extras.filter(e => e.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Prodejní jednotky</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatCZK(unitsTotal)}</div>
          <div className="text-xs text-gray-400 mt-1">{units.length} jednotek</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Doplňkové položky</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatCZK(extrasTotal)}</div>
          <div className="text-xs text-gray-400 mt-1">{extras.length} položek</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celkové příjmy</div>
          <div className="text-2xl font-bold text-primary-600 mt-1">{formatCZK(unitsTotal + extrasTotal)}</div>
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Prodejní jednotky</h2>
          <button
            onClick={() => setShowUnitForm(!showUnitForm)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {showUnitForm ? 'Zrušit' : '+ Přidat jednotku'}
          </button>
        </div>

        {showUnitForm && (
          <form onSubmit={addUnit} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-3">
              <select
                value={unitForm.unitType}
                onChange={e => setUnitForm({ ...unitForm, unitType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(UNIT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input
                placeholder="Označení"
                value={unitForm.label}
                onChange={e => setUnitForm({ ...unitForm, label: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Plocha m²"
                value={unitForm.area}
                onChange={e => setUnitForm({ ...unitForm, area: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Kč/m²"
                value={unitForm.pricePerM2}
                onChange={e => setUnitForm({ ...unitForm, pricePerM2: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Celková cena"
                value={unitForm.totalPrice}
                onChange={e => setUnitForm({ ...unitForm, totalPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                Přidat
              </button>
            </div>
          </form>
        )}

        {units.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            Zatím žádné prodejní jednotky
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Označení</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Plocha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kč/m²</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Celková cena</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {units.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{UNIT_TYPES[u.unitType as keyof typeof UNIT_TYPES] || u.unitType}</td>
                  <td className="px-6 py-3 text-sm">{u.label || '—'}</td>
                  <td className="px-6 py-3 text-sm text-right">{u.area ? `${formatNumber(u.area, 1)} m²` : '—'}</td>
                  <td className="px-6 py-3 text-sm text-right">{u.pricePerM2 ? formatCZK(u.pricePerM2) : '—'}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium">{u.totalPrice ? formatCZK(u.totalPrice) : '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => deleteUnit(u.id)} className="text-xs text-gray-400 hover:text-red-600">Smazat</button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-6 py-3 text-sm text-right">Celkem:</td>
                <td className="px-6 py-3 text-sm text-right">{formatCZK(unitsTotal)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Extras Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Doplňkové položky</h2>
          <button
            onClick={() => setShowExtraForm(!showExtraForm)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {showExtraForm ? 'Zrušit' : '+ Přidat položku'}
          </button>
        </div>

        {showExtraForm && (
          <form onSubmit={addExtra} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-5 gap-3">
              <select
                value={extraForm.category}
                onChange={e => setExtraForm({ ...extraForm, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(EXTRA_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input
                placeholder="Popis"
                value={extraForm.label}
                onChange={e => setExtraForm({ ...extraForm, label: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Počet"
                value={extraForm.quantity}
                onChange={e => setExtraForm({ ...extraForm, quantity: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Cena za kus"
                value={extraForm.unitPrice}
                onChange={e => setExtraForm({ ...extraForm, unitPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                Přidat
              </button>
            </div>
          </form>
        )}

        {extras.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            Zatím žádné doplňkové položky
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popis</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Počet</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cena/ks</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Celkem</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {extras.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{EXTRA_CATEGORIES[e.category as keyof typeof EXTRA_CATEGORIES] || e.category}</td>
                  <td className="px-6 py-3 text-sm">{e.label || '—'}</td>
                  <td className="px-6 py-3 text-sm text-right">{e.quantity}</td>
                  <td className="px-6 py-3 text-sm text-right">{formatCZK(e.unitPrice)}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium">{formatCZK(e.totalPrice || 0)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => deleteExtra(e.id)} className="text-xs text-gray-400 hover:text-red-600">Smazat</button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-6 py-3 text-sm text-right">Celkem:</td>
                <td className="px-6 py-3 text-sm text-right">{formatCZK(extrasTotal)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
