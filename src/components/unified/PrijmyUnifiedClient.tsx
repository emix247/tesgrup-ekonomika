'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { UNIT_TYPES, EXTRA_CATEGORIES, SALE_STATUSES } from '@/lib/utils/constants';
import { formatCZK, formatNumber } from '@/lib/utils/format';
import EditableCell from '@/components/ui/EditableCell';
import DonutChart from '@/components/charts/DonutChart';

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

interface Sale {
  id: string;
  unitId: string | null;
  buyerName: string | null;
  status: string;
  reservationDate: string | null;
  contractDate: string | null;
  paymentDate: string | null;
  agreedPrice: number | null;
  depositAmount: number | null;
  depositPaid: boolean | null;
  notes: string | null;
}

interface Props {
  projectId: string;
  initialUnits: Unit[];
  initialExtras: Extra[];
  initialSales: Sale[];
}

export default function PrijmyUnifiedClient({ projectId, initialUnits, initialExtras, initialSales }: Props) {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [extras, setExtras] = useState<Extra[]>(initialExtras);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitType: 'dum', label: '', area: '', pricePerM2: '', totalPrice: '', plannedSaleMonth: '' });
  const [extraForm, setExtraForm] = useState({ category: 'garaz', label: '', quantity: '1', unitPrice: '' });

  // Editing state
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitEditForm, setUnitEditForm] = useState({ unitType: '', label: '', area: '', pricePerM2: '', totalPrice: '', plannedSaleMonth: '' });
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [extraEditForm, setExtraEditForm] = useState({ category: '', label: '', quantity: '', unitPrice: '' });

  // Sale editing state
  const [editingSaleUnitId, setEditingSaleUnitId] = useState<string | null>(null);
  const [saleForm, setSaleForm] = useState({
    status: 'rezervace', buyerName: '', agreedPrice: '', reservationDate: '', contractDate: '', paymentDate: '', depositAmount: '', notes: '',
  });

  const unitsTotal = units.reduce((s, u) => s + (u.totalPrice || 0), 0);
  const extrasTotal = extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
  const totalPlanned = unitsTotal + extrasTotal;

  // Sales stats
  const activeSales = sales.filter(s => s.status !== 'stornovano');
  const contractedValue = activeSales.filter(s => ['smlouva', 'zaplaceno', 'predano'].includes(s.status))
    .reduce((s, sale) => s + (sale.agreedPrice || 0), 0);
  const paidValue = activeSales.filter(s => ['zaplaceno', 'predano'].includes(s.status))
    .reduce((s, sale) => s + (sale.agreedPrice || 0), 0);

  function getSaleForUnit(unitId: string) {
    return sales.find(s => s.unitId === unitId && s.status !== 'stornovano');
  }

  const apiPrijmy = `/api/projekty/${projectId}/prijmy`;
  const apiProdeje = `/api/projekty/${projectId}/prodeje`;

  // Sale editing
  function startEditSale(unitId: string) {
    const existing = getSaleForUnit(unitId);
    setEditingSaleUnitId(unitId);
    setEditingUnitId(null);
    setEditingExtraId(null);
    if (existing) {
      setSaleForm({
        status: existing.status,
        buyerName: existing.buyerName || '',
        agreedPrice: existing.agreedPrice?.toString() || '',
        reservationDate: existing.reservationDate || '',
        contractDate: existing.contractDate || '',
        paymentDate: existing.paymentDate || '',
        depositAmount: existing.depositAmount?.toString() || '',
        notes: existing.notes || '',
      });
    } else {
      setSaleForm({
        status: 'rezervace', buyerName: '', agreedPrice: '', reservationDate: '', contractDate: '', paymentDate: '', depositAmount: '', notes: '',
      });
    }
  }

  async function saveSale() {
    if (!editingSaleUnitId) return;
    const existing = getSaleForUnit(editingSaleUnitId);
    const payload: Record<string, unknown> = {
      status: saleForm.status,
      buyerName: saleForm.buyerName || null,
      agreedPrice: saleForm.agreedPrice ? parseFloat(saleForm.agreedPrice) : null,
      reservationDate: saleForm.reservationDate || null,
      contractDate: saleForm.contractDate || null,
      paymentDate: saleForm.paymentDate || null,
      depositAmount: saleForm.depositAmount ? parseFloat(saleForm.depositAmount) : null,
      notes: saleForm.notes || null,
    };

    if (existing) {
      // Update existing sale
      const res = await fetch(apiProdeje, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existing.id, ...payload }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSales(prev => prev.map(s => s.id === updated.id ? updated as Sale : s));
        setEditingSaleUnitId(null);
        router.refresh();
      }
    } else {
      // Create new sale
      const res = await fetch(apiProdeje, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: editingSaleUnitId, ...payload }),
      });
      if (res.ok) {
        const created = await res.json();
        setSales(prev => [...prev, created as Sale]);
        setEditingSaleUnitId(null);
        router.refresh();
      }
    }
  }

  async function deleteSale(saleId: string) {
    const res = await fetch(`${apiProdeje}?id=${saleId}`, { method: 'DELETE' });
    if (res.ok) {
      setSales(prev => prev.filter(s => s.id !== saleId));
      setEditingSaleUnitId(null);
      router.refresh();
    }
  }

  function handleUnitUpdate(updated?: Record<string, unknown>) {
    if (!updated || !updated.id) { router.refresh(); return; }
    setUnits(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } as Unit : u));
    router.refresh();
  }

  function handleExtraUpdate(updated?: Record<string, unknown>) {
    if (!updated || !updated.id) { router.refresh(); return; }
    setExtras(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } as Extra : e));
    router.refresh();
  }

  // Edit unit
  function startEditUnit(u: Unit) {
    setEditingUnitId(u.id);
    setEditingExtraId(null);
    setUnitEditForm({
      unitType: u.unitType,
      label: u.label || '',
      area: u.area?.toString() || '',
      pricePerM2: u.pricePerM2?.toString() || '',
      totalPrice: u.totalPrice?.toString() || '',
      plannedSaleMonth: u.plannedSaleMonth?.toString() || '',
    });
  }

  async function saveEditUnit() {
    if (!editingUnitId) return;
    const res = await fetch(apiPrijmy, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingUnitId,
        unitType: unitEditForm.unitType,
        label: unitEditForm.label || null,
        area: unitEditForm.area ? parseFloat(unitEditForm.area) : null,
        pricePerM2: unitEditForm.pricePerM2 ? parseFloat(unitEditForm.pricePerM2) : null,
        totalPrice: unitEditForm.totalPrice ? parseFloat(unitEditForm.totalPrice) : null,
        plannedSaleMonth: unitEditForm.plannedSaleMonth ? parseInt(unitEditForm.plannedSaleMonth) : null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUnits(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } as Unit : u));
      setEditingUnitId(null);
      router.refresh();
    }
  }

  // Edit extra
  function startEditExtra(e: Extra) {
    setEditingExtraId(e.id);
    setEditingUnitId(null);
    setExtraEditForm({
      category: e.category,
      label: e.label || '',
      quantity: e.quantity.toString(),
      unitPrice: e.unitPrice.toString(),
    });
  }

  async function saveEditExtra() {
    if (!editingExtraId) return;
    const res = await fetch(apiPrijmy, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingExtraId,
        type: 'extra',
        category: extraEditForm.category,
        label: extraEditForm.label || null,
        quantity: parseInt(extraEditForm.quantity) || 1,
        unitPrice: parseFloat(extraEditForm.unitPrice) || 0,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setExtras(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } as Extra : e));
      setEditingExtraId(null);
      router.refresh();
    }
  }

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(apiPrijmy, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitType: unitForm.unitType, label: unitForm.label,
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
    const res = await fetch(apiPrijmy, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'extra', category: extraForm.category, label: extraForm.label,
        quantity: parseInt(extraForm.quantity) || 1, unitPrice: parseFloat(extraForm.unitPrice) || 0,
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
    await fetch(`${apiPrijmy}?id=${id}`, { method: 'DELETE' });
    setUnits(units.filter(u => u.id !== id));
    router.refresh();
  }

  async function deleteExtra(id: string) {
    await fetch(`${apiPrijmy}?id=${id}&type=extra`, { method: 'DELETE' });
    setExtras(extras.filter(e => e.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Summary with donuts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-around flex-wrap gap-6">
          <DonutChart
            data={[
              { name: 'Jednotky', value: unitsTotal },
              { name: 'Extras', value: extrasTotal },
            ]}
            centerValue={formatCZK(totalPlanned)}
            centerLabel="Plánované"
            size={150}
            title="Plánované příjmy"
          />
          <DonutChart
            data={[
              { name: 'Smluvní', value: contractedValue, color: '#3b82f6' },
              { name: 'Zbývá', value: Math.max(0, totalPlanned - contractedValue), color: '#e5e7eb' },
            ]}
            centerValue={formatCZK(contractedValue)}
            centerLabel="Se smlouvou"
            size={150}
            title="Smluvní příjmy"
          />
          <DonutChart
            data={[
              { name: 'Zaplaceno', value: paidValue, color: '#10b981' },
              { name: 'Zbývá', value: Math.max(0, totalPlanned - paidValue), color: '#e5e7eb' },
            ]}
            centerValue={formatCZK(paidValue)}
            centerLabel="Přijato"
            size={150}
            title="Přijaté platby"
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Prodejní jednotky</h2>
          <button onClick={() => setShowUnitForm(!showUnitForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {showUnitForm ? 'Zrušit' : '+ Přidat jednotku'}
          </button>
        </div>

        {showUnitForm && (
          <form onSubmit={addUnit} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-3">
              <select value={unitForm.unitType} onChange={e => setUnitForm({ ...unitForm, unitType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(UNIT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input placeholder="Označení" value={unitForm.label} onChange={e => setUnitForm({ ...unitForm, label: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Plocha m²" value={unitForm.area} onChange={e => setUnitForm({ ...unitForm, area: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Kč/m²" value={unitForm.pricePerM2} onChange={e => setUnitForm({ ...unitForm, pricePerM2: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Celková cena" value={unitForm.totalPrice} onChange={e => setUnitForm({ ...unitForm, totalPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Přidat</button>
            </div>
          </form>
        )}

        {units.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Zatím žádné prodejní jednotky</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Označení</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Plocha</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kč/m²</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cena</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prodej</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {units.map(u => {
                const sale = getSaleForUnit(u.id);
                const isEditing = editingUnitId === u.id;
                const isSaleEditing = editingSaleUnitId === u.id;
                return (
                  <Fragment key={u.id}>
                    {isEditing ? (
                      <tr className="bg-primary-50/50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-6 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Typ</label>
                              <select value={unitEditForm.unitType} onChange={e => setUnitEditForm({ ...unitEditForm, unitType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                {Object.entries(UNIT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Označení</label>
                              <input value={unitEditForm.label} onChange={e => setUnitEditForm({ ...unitEditForm, label: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Plocha (m²)</label>
                              <input type="number" value={unitEditForm.area} onChange={e => setUnitEditForm({ ...unitEditForm, area: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kč/m²</label>
                              <input type="number" value={unitEditForm.pricePerM2} onChange={e => setUnitEditForm({ ...unitEditForm, pricePerM2: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Celková cena</label>
                              <input type="number" value={unitEditForm.totalPrice} onChange={e => setUnitEditForm({ ...unitEditForm, totalPrice: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Plán. měsíc prodeje</label>
                              <input type="number" value={unitEditForm.plannedSaleMonth} onChange={e => setUnitEditForm({ ...unitEditForm, plannedSaleMonth: e.target.value })}
                                min={1} max={60} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={saveEditUnit} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Uložit</button>
                            <button onClick={() => setEditingUnitId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300">Zrušit</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-2.5 text-sm">
                          <EditableCell
                            value={u.unitType} field="unitType" entityId={u.id} apiEndpoint={apiPrijmy} type="select"
                            options={Object.entries(UNIT_TYPES).map(([k, v]) => ({ value: k, label: v }))}
                            formatFn={(v) => UNIT_TYPES[v as keyof typeof UNIT_TYPES] || String(v)}
                            onSave={handleUnitUpdate}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-sm">
                          <EditableCell value={u.label} field="label" entityId={u.id} apiEndpoint={apiPrijmy} onSave={handleUnitUpdate} />
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right">
                          <EditableCell value={u.area} field="area" entityId={u.id} apiEndpoint={apiPrijmy} type="number"
                            formatFn={(v) => v ? `${formatNumber(Number(v), 1)} m²` : '—'} onSave={handleUnitUpdate} className="text-right" />
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right">
                          <EditableCell value={u.pricePerM2} field="pricePerM2" entityId={u.id} apiEndpoint={apiPrijmy} type="number"
                            formatFn={(v) => v ? formatCZK(Number(v)) : '—'} onSave={handleUnitUpdate} className="text-right" />
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right font-medium">
                          <EditableCell value={u.totalPrice} field="totalPrice" entityId={u.id} apiEndpoint={apiPrijmy} type="number"
                            formatFn={(v) => v ? formatCZK(Number(v)) : '—'} onSave={handleUnitUpdate} className="text-right" />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => startEditSale(u.id)} className="group cursor-pointer" title="Upravit prodej">
                            {sale ? <SaleBadge status={sale.status} buyer={sale.buyerName} clickable /> : (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Přidat prodej
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => startEditUnit(u)} className="text-gray-400 hover:text-primary-600 p-0.5" title="Upravit">
                              <PencilIcon />
                            </button>
                            <button onClick={() => deleteUnit(u.id)} className="text-gray-400 hover:text-red-600 p-0.5" title="Smazat">
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {/* Sale edit row (expandable below unit) */}
                    {isSaleEditing && !isEditing && (
                      <tr className="bg-amber-50/60">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">
                              {sale ? 'Upravit prodej' : 'Nový prodej'} — {u.label || UNIT_TYPES[u.unitType as keyof typeof UNIT_TYPES] || u.unitType}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Stav</label>
                              <select value={saleForm.status} onChange={e => setSaleForm({ ...saleForm, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                {Object.entries(SALE_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kupující</label>
                              <input value={saleForm.buyerName} onChange={e => setSaleForm({ ...saleForm, buyerName: e.target.value })}
                                placeholder="Jméno kupujícího"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Dohodnutá cena (Kč)</label>
                              <input type="number" value={saleForm.agreedPrice} onChange={e => setSaleForm({ ...saleForm, agreedPrice: e.target.value })}
                                placeholder={u.totalPrice?.toString() || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Záloha (Kč)</label>
                              <input type="number" value={saleForm.depositAmount} onChange={e => setSaleForm({ ...saleForm, depositAmount: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Datum rezervace</label>
                              <input type="date" value={saleForm.reservationDate} onChange={e => setSaleForm({ ...saleForm, reservationDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Datum smlouvy</label>
                              <input type="date" value={saleForm.contractDate} onChange={e => setSaleForm({ ...saleForm, contractDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Datum platby</label>
                              <input type="date" value={saleForm.paymentDate} onChange={e => setSaleForm({ ...saleForm, paymentDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Poznámky</label>
                              <input value={saleForm.notes} onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button onClick={saveSale} className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700">
                              {sale ? 'Uložit' : 'Vytvořit prodej'}
                            </button>
                            <button onClick={() => setEditingSaleUnitId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300">
                              Zrušit
                            </button>
                            {sale && (
                              <button onClick={() => deleteSale(sale.id)} className="ml-auto px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200">
                                Smazat prodej
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-6 py-3 text-sm text-right">Celkem jednotky:</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(unitsTotal)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Extras Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Doplňkové položky</h2>
          <button onClick={() => setShowExtraForm(!showExtraForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {showExtraForm ? 'Zrušit' : '+ Přidat položku'}
          </button>
        </div>

        {showExtraForm && (
          <form onSubmit={addExtra} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-5 gap-3">
              <select value={extraForm.category} onChange={e => setExtraForm({ ...extraForm, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(EXTRA_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input placeholder="Popis" value={extraForm.label} onChange={e => setExtraForm({ ...extraForm, label: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Počet" value={extraForm.quantity} onChange={e => setExtraForm({ ...extraForm, quantity: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Cena za kus" value={extraForm.unitPrice} onChange={e => setExtraForm({ ...extraForm, unitPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Přidat</button>
            </div>
          </form>
        )}

        {extras.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Zatím žádné doplňkové položky</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popis</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Počet</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cena/ks</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Celkem</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {extras.map(e => {
                const isEditing = editingExtraId === e.id;
                return isEditing ? (
                  <tr key={e.id} className="bg-primary-50/50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Kategorie</label>
                          <select value={extraEditForm.category} onChange={ev => setExtraEditForm({ ...extraEditForm, category: ev.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            {Object.entries(EXTRA_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Popis</label>
                          <input value={extraEditForm.label} onChange={ev => setExtraEditForm({ ...extraEditForm, label: ev.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Počet</label>
                          <input type="number" value={extraEditForm.quantity} onChange={ev => setExtraEditForm({ ...extraEditForm, quantity: ev.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cena/ks (Kč)</label>
                          <input type="number" value={extraEditForm.unitPrice} onChange={ev => setExtraEditForm({ ...extraEditForm, unitPrice: ev.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={saveEditExtra} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Uložit</button>
                        <button onClick={() => setEditingExtraId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300">Zrušit</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-2.5 text-sm">
                      <EditableCell value={e.category} field="category" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} type="select"
                        options={Object.entries(EXTRA_CATEGORIES).map(([k, v]) => ({ value: k, label: v }))}
                        formatFn={(v) => EXTRA_CATEGORIES[v as keyof typeof EXTRA_CATEGORIES] || String(v)}
                        onSave={handleExtraUpdate} />
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <EditableCell value={e.label} field="label" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} onSave={handleExtraUpdate} />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      <EditableCell value={e.quantity} field="quantity" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} type="number"
                        onSave={handleExtraUpdate} className="text-right" />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      <EditableCell value={e.unitPrice} field="unitPrice" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} type="number"
                        formatFn={(v) => formatCZK(Number(v) || 0)} onSave={handleExtraUpdate} className="text-right" />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{formatCZK(e.totalPrice || 0)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => startEditExtra(e)} className="text-gray-400 hover:text-primary-600 p-0.5" title="Upravit">
                          <PencilIcon />
                        </button>
                        <button onClick={() => deleteExtra(e.id)} className="text-gray-400 hover:text-red-600 p-0.5" title="Smazat">
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-6 py-3 text-sm text-right">Celkem extras:</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(extrasTotal)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SaleBadge({ status, buyer, clickable }: { status: string; buyer: string | null; clickable?: boolean }) {
  const styles: Record<string, string> = {
    rezervace: 'bg-amber-100 text-amber-700',
    smlouva: 'bg-blue-100 text-blue-700',
    zaplaceno: 'bg-emerald-100 text-emerald-700',
    predano: 'bg-violet-100 text-violet-700',
    stornovano: 'bg-red-100 text-red-700',
  };
  const label = SALE_STATUSES[status as keyof typeof SALE_STATUSES] || status;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'} ${clickable ? 'hover:ring-2 hover:ring-offset-1 hover:ring-amber-300 transition-all cursor-pointer' : ''}`}
      title={buyer ? `${buyer} — klikni pro editaci` : 'Klikni pro editaci'}>
      {label}
      {buyer && <span className="max-w-[60px] truncate text-[9px] opacity-70">{buyer}</span>}
    </span>
  );
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
