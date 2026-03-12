'use client';

import { useState } from 'react';
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
  agreedPrice: number | null;
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
  const [sales] = useState<Sale[]>(initialSales);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitType: 'dum', label: '', area: '', pricePerM2: '', totalPrice: '', plannedSaleMonth: '' });
  const [extraForm, setExtraForm] = useState({ category: 'garaz', label: '', quantity: '1', unitPrice: '' });

  const unitsTotal = units.reduce((s, u) => s + (u.totalPrice || 0), 0);
  const extrasTotal = extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
  const totalPlanned = unitsTotal + extrasTotal;

  // Sales stats
  const activeSales = sales.filter(s => s.status !== 'stornovano');
  const contractedValue = activeSales.filter(s => ['smlouva', 'zaplaceno', 'predano'].includes(s.status))
    .reduce((s, sale) => s + (sale.agreedPrice || 0), 0);
  const paidValue = activeSales.filter(s => ['zaplaceno', 'predano'].includes(s.status))
    .reduce((s, sale) => s + (sale.agreedPrice || 0), 0);

  // Get sale for a unit
  function getSaleForUnit(unitId: string) {
    return sales.find(s => s.unitId === unitId && s.status !== 'stornovano');
  }

  const apiPrijmy = `/api/projekty/${projectId}/prijmy`;

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
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {units.map(u => {
                const sale = getSaleForUnit(u.id);
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-2.5 text-sm">
                      <EditableCell
                        value={u.unitType}
                        field="unitType"
                        entityId={u.id}
                        apiEndpoint={apiPrijmy}
                        type="select"
                        options={Object.entries(UNIT_TYPES).map(([k, v]) => ({ value: k, label: v }))}
                        formatFn={(v) => UNIT_TYPES[v as keyof typeof UNIT_TYPES] || String(v)}
                        onSave={() => router.refresh()}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <EditableCell value={u.label} field="label" entityId={u.id} apiEndpoint={apiPrijmy} onSave={() => router.refresh()} />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      <EditableCell value={u.area} field="area" entityId={u.id} apiEndpoint={apiPrijmy} type="number"
                        formatFn={(v) => v ? `${formatNumber(Number(v), 1)} m²` : '—'} onSave={() => router.refresh()} className="text-right" />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      <EditableCell value={u.pricePerM2} field="pricePerM2" entityId={u.id} apiEndpoint={apiPrijmy} type="number"
                        formatFn={(v) => v ? formatCZK(Number(v)) : '—'} onSave={() => router.refresh()} className="text-right" />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">
                      <EditableCell value={u.totalPrice} field="totalPrice" entityId={u.id} apiEndpoint={apiPrijmy} type="number"
                        formatFn={(v) => v ? formatCZK(Number(v)) : '—'} onSave={() => router.refresh()} className="text-right" />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {sale ? <SaleBadge status={sale.status} buyer={sale.buyerName} /> : (
                        <span className="text-xs text-gray-400">Neprodáno</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => deleteUnit(u.id)} className="text-xs text-gray-400 hover:text-red-600">✕</button>
                    </td>
                  </tr>
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
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {extras.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-2.5 text-sm">
                    <EditableCell value={e.category} field="category" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} type="select"
                      options={Object.entries(EXTRA_CATEGORIES).map(([k, v]) => ({ value: k, label: v }))}
                      formatFn={(v) => EXTRA_CATEGORIES[v as keyof typeof EXTRA_CATEGORIES] || String(v)}
                      onSave={() => router.refresh()} />
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <EditableCell value={e.label} field="label" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} onSave={() => router.refresh()} />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right">
                    <EditableCell value={e.quantity} field="quantity" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} type="number"
                      onSave={() => router.refresh()} className="text-right" />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right">
                    <EditableCell value={e.unitPrice} field="unitPrice" entityId={e.id} apiEndpoint={`${apiPrijmy}?type=extra`} type="number"
                      formatFn={(v) => formatCZK(Number(v) || 0)} onSave={() => router.refresh()} className="text-right" />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium">{formatCZK(e.totalPrice || 0)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => deleteExtra(e.id)} className="text-xs text-gray-400 hover:text-red-600">✕</button>
                  </td>
                </tr>
              ))}
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

function SaleBadge({ status, buyer }: { status: string; buyer: string | null }) {
  const styles: Record<string, string> = {
    rezervace: 'bg-amber-100 text-amber-700',
    smlouva: 'bg-blue-100 text-blue-700',
    zaplaceno: 'bg-emerald-100 text-emerald-700',
    predano: 'bg-violet-100 text-violet-700',
    stornovano: 'bg-red-100 text-red-700',
  };
  const label = SALE_STATUSES[status as keyof typeof SALE_STATUSES] || status;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}
      title={buyer || undefined}>
      {label}
    </span>
  );
}
