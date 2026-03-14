'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { COST_CATEGORIES, PAYMENT_STATUSES } from '@/lib/utils/constants';
import { formatCZK, formatNumber, formatDate } from '@/lib/utils/format';
import EditableCell from '@/components/ui/EditableCell';
import MiniProgressBar from '@/components/charts/MiniProgressBar';

interface ForecastCost {
  id: string;
  category: string;
  label: string | null;
  amount: number;
  area: number | null;
  ratePerM2: number | null;
  notes: string | null;
  sortOrder: number | null;
}

interface ActualCost {
  id: string;
  category: string;
  supplier: string | null;
  description: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  amount: number;
  paymentStatus: string;
  paymentDate: string | null;
}

interface Props {
  projectId: string;
  initialForecast: ForecastCost[];
  initialActual: ActualCost[];
}

export default function NakladyUnifiedClient({ projectId, initialForecast, initialActual }: Props) {
  const router = useRouter();
  const [forecast, setForecast] = useState<ForecastCost[]>(initialForecast);
  const [actual, setActual] = useState<ActualCost[]>(initialActual);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showForecastForm, setShowForecastForm] = useState(false);
  const [showActualForm, setShowActualForm] = useState(false);
  const [useAreaCalc, setUseAreaCalc] = useState(false);
  const [alsoActual, setAlsoActual] = useState(false);

  const [forecastForm, setForecastForm] = useState({
    category: 'pozemek', label: '', amount: '', area: '', ratePerM2: '', notes: '',
  });
  const [actualForm, setActualForm] = useState({
    category: 'pozemek', supplier: '', description: '', invoiceNumber: '', invoiceDate: '', amount: '', paymentStatus: 'neuhrazeno',
  });

  const forecastTotal = forecast.reduce((s, c) => s + c.amount, 0);
  const actualTotal = actual.reduce((s, c) => s + c.amount, 0);
  const variance = actualTotal - forecastTotal;

  // Group by category
  const grouped = Object.entries(COST_CATEGORIES).map(([key, name]) => {
    const forecastItems = forecast.filter(c => c.category === key);
    const actualItems = actual.filter(c => c.category === key);
    const forecastSum = forecastItems.reduce((s, c) => s + c.amount, 0);
    const actualSum = actualItems.reduce((s, c) => s + c.amount, 0);
    return { key, name, forecastItems, actualItems, forecastSum, actualSum };
  }).filter(g => g.forecastItems.length > 0 || g.actualItems.length > 0);

  function toggleCategory(key: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function addForecastCost(e: React.FormEvent) {
    e.preventDefault();
    const amount = useAreaCalc
      ? (parseFloat(forecastForm.area) || 0) * (parseFloat(forecastForm.ratePerM2) || 0)
      : parseFloat(forecastForm.amount) || 0;

    const res = await fetch(`/api/projekty/${projectId}/naklady`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: forecastForm.category, label: forecastForm.label, amount,
        area: useAreaCalc ? parseFloat(forecastForm.area) || undefined : undefined,
        ratePerM2: useAreaCalc ? parseFloat(forecastForm.ratePerM2) || undefined : undefined,
        notes: forecastForm.notes,
      }),
    });
    if (res.ok) {
      const cost = await res.json();
      setForecast([...forecast, cost]);

      // If "also actual cost" is checked, create an actual cost entry too
      if (alsoActual) {
        const actualRes = await fetch(`/api/projekty/${projectId}/skutecne-naklady`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: forecastForm.category,
            description: forecastForm.label || forecastForm.notes || '',
            amount,
            paymentStatus: 'uhrazeno',
          }),
        });
        if (actualRes.ok) {
          const actualCost = await actualRes.json();
          setActual(prev => [...prev, actualCost]);
        }
      }

      setForecastForm({ category: 'pozemek', label: '', amount: '', area: '', ratePerM2: '', notes: '' });
      setAlsoActual(false);
      setShowForecastForm(false);
      router.refresh();
    }
  }

  async function addActualCost(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/skutecne-naklady`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: actualForm.category, supplier: actualForm.supplier,
        description: actualForm.description, invoiceNumber: actualForm.invoiceNumber,
        invoiceDate: actualForm.invoiceDate || undefined,
        amount: parseFloat(actualForm.amount) || 0,
        paymentStatus: actualForm.paymentStatus,
      }),
    });
    if (res.ok) {
      const cost = await res.json();
      setActual([...actual, cost]);
      setActualForm({ category: 'pozemek', supplier: '', description: '', invoiceNumber: '', invoiceDate: '', amount: '', paymentStatus: 'neuhrazeno' });
      setShowActualForm(false);
      router.refresh();
    }
  }

  async function deleteForecast(id: string) {
    await fetch(`/api/projekty/${projectId}/naklady?id=${id}`, { method: 'DELETE' });
    setForecast(forecast.filter(c => c.id !== id));
    router.refresh();
  }

  async function deleteActual(id: string) {
    await fetch(`/api/projekty/${projectId}/skutecne-naklady?id=${id}`, { method: 'DELETE' });
    setActual(actual.filter(c => c.id !== id));
    router.refresh();
  }

  const apiNaklady = `/api/projekty/${projectId}/naklady`;
  const apiSkutecne = `/api/projekty/${projectId}/skutecne-naklady`;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Plánované náklady</div>
          <div className="text-2xl font-bold mt-1">{formatCZK(forecastTotal)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Skutečné náklady</div>
          <div className="text-2xl font-bold mt-1">{formatCZK(actualTotal)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Odchylka</div>
          <div className={`text-2xl font-bold mt-1 ${variance > 0 ? 'text-red-600' : variance < 0 ? 'text-emerald-600' : ''}`}>
            {variance > 0 ? '+' : ''}{formatCZK(variance)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Čerpání</div>
          <MiniProgressBar value={actualTotal} max={forecastTotal} color={actualTotal > forecastTotal ? 'red' : 'blue'} className="mt-3" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={() => { setShowForecastForm(!showForecastForm); setShowActualForm(false); }}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
          {showForecastForm ? 'Zrušit' : '+ Plánovaný náklad'}
        </button>
        <button onClick={() => { setShowActualForm(!showActualForm); setShowForecastForm(false); }}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
          {showActualForm ? 'Zrušit' : '+ Skutečný náklad'}
        </button>
      </div>

      {/* Forecast Form */}
      {showForecastForm && (
        <form onSubmit={addForecastCost} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Nový plánovaný náklad</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select value={forecastForm.category} onChange={e => setForecastForm({ ...forecastForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(COST_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
              <input value={forecastForm.label} onChange={e => setForecastForm({ ...forecastForm, label: e.target.value })}
                placeholder="např. Přípojka vody" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!useAreaCalc} onChange={() => setUseAreaCalc(false)} className="text-primary-600" />
              Celková částka
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={useAreaCalc} onChange={() => setUseAreaCalc(true)} className="text-primary-600" />
              Plocha × sazba
            </label>
          </div>
          {useAreaCalc ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plocha (m²)</label>
                <input type="number" value={forecastForm.area} onChange={e => setForecastForm({ ...forecastForm, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sazba (Kč/m²)</label>
                <input type="number" value={forecastForm.ratePerM2} onChange={e => setForecastForm({ ...forecastForm, ratePerM2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celkem</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">
                  {formatCZK((parseFloat(forecastForm.area) || 0) * (parseFloat(forecastForm.ratePerM2) || 0))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Částka (Kč)</label>
              <input type="number" value={forecastForm.amount} onChange={e => setForecastForm({ ...forecastForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={alsoActual}
                onChange={e => setAlsoActual(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">
                Zároveň přidat jako skutečný náklad
              </span>
              {alsoActual && (
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  Bude vytvořen i skutečný náklad (uhrazeno)
                </span>
              )}
            </label>
            <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Přidat</button>
          </div>
        </form>
      )}

      {/* Actual Cost Form */}
      {showActualForm && (
        <form onSubmit={addActualCost} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Nový skutečný náklad</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select value={actualForm.category} onChange={e => setActualForm({ ...actualForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(COST_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dodavatel</label>
              <input value={actualForm.supplier} onChange={e => setActualForm({ ...actualForm, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
              <input value={actualForm.description} onChange={e => setActualForm({ ...actualForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Číslo faktury</label>
              <input value={actualForm.invoiceNumber} onChange={e => setActualForm({ ...actualForm, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum faktury</label>
              <input type="date" value={actualForm.invoiceDate} onChange={e => setActualForm({ ...actualForm, invoiceDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Částka (Kč)</label>
              <input type="number" value={actualForm.amount} onChange={e => setActualForm({ ...actualForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">Přidat</button>
        </form>
      )}

      {/* Unified Table */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          Zatím žádné náklady. Přidejte plánovaný nebo skutečný náklad.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie / Položka</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Plán</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Skutečnost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rozdíl</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Čerpání</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-10"></th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(group => {
                const diff = group.actualSum - group.forecastSum;
                const isExpanded = expandedCategories.has(group.key);
                return (
                  <Fragment key={group.key}>
                    {/* Category header */}
                    <tr className="bg-gray-50/80 cursor-pointer hover:bg-gray-100/80" onClick={() => toggleCategory(group.key)}>
                      <td className="px-6 py-2.5 text-sm font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                          {group.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-right">{formatCZK(group.forecastSum)}</td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-right">{formatCZK(group.actualSum)}</td>
                      <td className={`px-4 py-2.5 text-sm font-semibold text-right ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-emerald-600' : ''}`}>
                        {diff !== 0 ? `${diff > 0 ? '+' : ''}${formatCZK(diff)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <MiniProgressBar value={group.actualSum} max={group.forecastSum} color={group.actualSum > group.forecastSum ? 'red' : 'emerald'} />
                      </td>
                      <td></td>
                    </tr>

                    {/* Expanded items */}
                    {isExpanded && (
                      <>
                        {/* Forecast items */}
                        {group.forecastItems.length > 0 && (
                          <tr className="border-t border-gray-100">
                            <td colSpan={6} className="px-10 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-blue-50/30">
                              Plánované položky
                            </td>
                          </tr>
                        )}
                        {group.forecastItems.map(item => (
                          <tr key={`f-${item.id}`} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-6 py-2 text-sm text-gray-600 pl-10">
                              <EditableCell
                                value={item.label}
                                field="label"
                                entityId={item.id}
                                apiEndpoint={apiNaklady}
                                placeholder="Bez popisu"
                                onSave={() => router.refresh()}
                              />
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              <EditableCell
                                value={item.amount}
                                field="amount"
                                entityId={item.id}
                                apiEndpoint={apiNaklady}
                                type="number"
                                formatFn={(v) => formatCZK(Number(v) || 0)}
                                onSave={() => router.refresh()}
                                className="text-right"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-400">—</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-400">—</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-400">
                              {item.area ? `${formatNumber(item.area, 0)} m²` : ''}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => deleteForecast(item.id)} className="text-xs text-gray-400 hover:text-red-600">✕</button>
                            </td>
                          </tr>
                        ))}

                        {/* Actual items */}
                        {group.actualItems.length > 0 && (
                          <tr className="border-t border-gray-100">
                            <td colSpan={6} className="px-10 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-emerald-50/30">
                              Skutečné náklady (faktury)
                            </td>
                          </tr>
                        )}
                        {group.actualItems.map(item => (
                          <tr key={`a-${item.id}`} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-6 py-2 text-sm text-gray-600 pl-10">
                              <div className="flex items-center gap-2">
                                <span>{item.supplier || item.description || '—'}</span>
                                {item.invoiceNumber && (
                                  <span className="text-xs text-gray-400">#{item.invoiceNumber}</span>
                                )}
                                <PaymentBadge status={item.paymentStatus} />
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-400">—</td>
                            <td className="px-4 py-2 text-sm text-right">
                              <EditableCell
                                value={item.amount}
                                field="amount"
                                entityId={item.id}
                                apiEndpoint={apiSkutecne}
                                type="number"
                                formatFn={(v) => formatCZK(Number(v) || 0)}
                                onSave={() => router.refresh()}
                                className="text-right"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-400">
                              {item.invoiceDate ? formatDate(item.invoiceDate) : '—'}
                            </td>
                            <td></td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => deleteActual(item.id)} className="text-xs text-gray-400 hover:text-red-600">✕</button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </Fragment>
                );
              })}
              {/* Grand total */}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="px-6 py-3 text-sm">Celkem</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(forecastTotal)}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(actualTotal)}</td>
                <td className={`px-4 py-3 text-sm text-right ${variance > 0 ? 'text-red-600' : variance < 0 ? 'text-emerald-600' : ''}`}>
                  {variance !== 0 ? `${variance > 0 ? '+' : ''}${formatCZK(variance)}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <MiniProgressBar value={actualTotal} max={forecastTotal} color={actualTotal > forecastTotal ? 'red' : 'blue'} />
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    neuhrazeno: 'bg-red-100 text-red-700',
    castecne_uhrazeno: 'bg-amber-100 text-amber-700',
    uhrazeno: 'bg-emerald-100 text-emerald-700',
  };
  const label = PAYMENT_STATUSES[status as keyof typeof PAYMENT_STATUSES] || status;
  return <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{label}</span>;
}
