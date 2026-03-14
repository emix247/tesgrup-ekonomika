'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatCZK, formatPercent, formatDate } from '@/lib/utils/format';
import { calculateFinancingSummary } from '@/lib/calculations/financing';
import EditableCell from '@/components/ui/EditableCell';
import DonutChart from '@/components/charts/DonutChart';

interface FinancingData {
  equityAmount: number;
  bankLoanAmount: number | null;
  bankLoanRate: number | null;
  bankLoanDurationMonths: number | null;
  bankLoanFee: number | null;
  bankLoanStartDate: string | null;
  investorLoanAmount: number | null;
  investorLoanRate: number | null;
  investorLoanDurationMonths: number | null;
  investorLoanStartDate: string | null;
  notes: string | null;
}

interface Drawdown {
  id: string;
  loanType: string;
  plannedDate: string | null;
  actualDate: string | null;
  plannedAmount: number | null;
  actualAmount: number | null;
  purpose: string | null;
}

const defaults: FinancingData = {
  equityAmount: 0, bankLoanAmount: 0, bankLoanRate: 0, bankLoanDurationMonths: 0,
  bankLoanFee: 0, bankLoanStartDate: '', investorLoanAmount: 0, investorLoanRate: 0,
  investorLoanDurationMonths: 0, investorLoanStartDate: '', notes: '',
};

interface Props {
  projectId: string;
  initialFinancing: FinancingData | undefined;
  initialDrawdowns: Drawdown[];
}

export default function FinancovaniUnifiedClient({ projectId, initialFinancing, initialDrawdowns }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FinancingData>(initialFinancing ? { ...defaults, ...initialFinancing } : defaults);
  const [drawdowns, setDrawdowns] = useState<Drawdown[]>(initialDrawdowns);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDrawdownForm, setShowDrawdownForm] = useState(false);
  const [drawdownForm, setDrawdownForm] = useState({
    loanType: 'bank', plannedDate: '', actualDate: '', plannedAmount: '', actualAmount: '', purpose: '',
  });

  const summary = useMemo(() => calculateFinancingSummary(form), [form]);

  function handleChange(field: keyof FinancingData, value: string) {
    // String fields: notes, dates
    if (field === 'notes' || field === 'bankLoanStartDate' || field === 'investorLoanStartDate') {
      setForm({ ...form, [field]: value });
    } else {
      setForm({ ...form, [field]: parseFloat(value) || 0 });
    }
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/projekty/${projectId}/financovani`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function addDrawdown(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/cerpani`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanType: drawdownForm.loanType,
        plannedDate: drawdownForm.plannedDate || undefined,
        actualDate: drawdownForm.actualDate || undefined,
        plannedAmount: drawdownForm.plannedAmount ? parseFloat(drawdownForm.plannedAmount) : undefined,
        actualAmount: drawdownForm.actualAmount ? parseFloat(drawdownForm.actualAmount) : undefined,
        purpose: drawdownForm.purpose,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setDrawdowns([...drawdowns, item]);
      setDrawdownForm({ loanType: 'bank', plannedDate: '', actualDate: '', plannedAmount: '', actualAmount: '', purpose: '' });
      setShowDrawdownForm(false);
      router.refresh();
    }
  }

  async function deleteDrawdown(id: string) {
    await fetch(`/api/projekty/${projectId}/cerpani?id=${id}`, { method: 'DELETE' });
    setDrawdowns(drawdowns.filter(d => d.id !== id));
    router.refresh();
  }

  const totalPlannedDrawdown = drawdowns.reduce((s, d) => s + (d.plannedAmount || 0), 0);
  const totalActualDrawdown = drawdowns.reduce((s, d) => s + (d.actualAmount || 0), 0);
  const apiCerpani = `/api/projekty/${projectId}/cerpani`;

  const hasAccruedInterest = summary.totalAccruedInterest > 0;

  return (
    <div className="space-y-6">
      {/* Summary with DonutChart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <DonutChart
            data={[
              { name: 'Vlastní kapitál', value: form.equityAmount, color: '#10b981' },
              { name: 'Bankovní úvěr', value: form.bankLoanAmount || 0, color: '#3b82f6' },
              { name: 'Investorská půjčka', value: form.investorLoanAmount || 0, color: '#8b5cf6' },
            ]}
            centerValue={formatCZK(summary.totalCapital)}
            centerLabel="Celkem"
            size={160}
            title="Kapitálová struktura"
          />
          <div className="grid grid-cols-2 gap-4 flex-1 min-w-[300px]">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Celkový kapitál</div>
              <div className="text-xl font-bold mt-1">{formatCZK(summary.totalCapital)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">LTV</div>
              <div className="text-xl font-bold mt-1">{formatPercent(summary.ltv)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Celkový dluh</div>
              <div className="text-xl font-bold mt-1">{formatCZK(summary.totalDebt)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Plánované náklady financování</div>
              <div className="text-xl font-bold text-red-600 mt-1">{formatCZK(summary.totalFinancingCost)}</div>
            </div>
          </div>
        </div>

        {/* Accrued interest highlight */}
        {hasAccruedInterest && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm font-medium text-amber-800">Naběhlý úrok k dnešnímu dni</div>
                <div className="text-xs text-amber-600 mt-0.5">
                  {summary.bankElapsedMonths > 0 && `Banka: ${Math.round(summary.bankElapsedMonths)} měs.`}
                  {summary.bankElapsedMonths > 0 && summary.investorElapsedMonths > 0 && ' · '}
                  {summary.investorElapsedMonths > 0 && `Investor: ${Math.round(summary.investorElapsedMonths)} měs.`}
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-700">{formatCZK(summary.totalAccruedInterest)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Financing Configuration - compact grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold">Nastavení financování</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Equity */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" /> Vlastní kapitál
            </h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Částka (Kč)</label>
              <input type="number" value={form.equityAmount || ''} onChange={e => handleChange('equityAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          {/* Bank loan */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" /> Bankovní úvěr
            </h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Výše (Kč)</label>
              <input type="number" value={form.bankLoanAmount || ''} onChange={e => handleChange('bankLoanAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Úrok (% p.a.)</label>
                <input type="number" step="0.1" value={form.bankLoanRate || ''} onChange={e => handleChange('bankLoanRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Doba (měs.)</label>
                <input type="number" value={form.bankLoanDurationMonths || ''} onChange={e => handleChange('bankLoanDurationMonths', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Počátek čerpání</label>
              <input type="date" value={form.bankLoanStartDate || ''} onChange={e => handleChange('bankLoanStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Poplatek za úvěr (Kč)</label>
              <input type="number" value={form.bankLoanFee || ''} onChange={e => handleChange('bankLoanFee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            {/* Carry cost info */}
            {(summary.bankCarry.totalInterest > 0 || summary.bankAccrued.totalInterest > 0) && (
              <div className="p-2.5 bg-blue-50 rounded-lg space-y-1">
                <div className="text-xs text-blue-600">
                  Celkový plán. úrok: <span className="font-semibold text-blue-800">{formatCZK(summary.bankCarry.totalInterest)}</span>
                </div>
                <div className="text-xs text-blue-600">
                  Měsíční splátka úroku: <span className="font-semibold text-blue-800">{formatCZK(summary.bankCarry.monthlyPayment)}</span>
                </div>
                {summary.bankAccrued.totalInterest > 0 && (
                  <div className="text-xs text-amber-600 pt-1 border-t border-blue-200">
                    Naběhlý úrok ({Math.round(summary.bankElapsedMonths)} měs.): <span className="font-semibold text-amber-700">{formatCZK(summary.bankAccrued.totalInterest)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Investor loan */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-violet-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" /> Investorská půjčka
            </h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Výše (Kč)</label>
              <input type="number" value={form.investorLoanAmount || ''} onChange={e => handleChange('investorLoanAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Úrok (% p.a.)</label>
                <input type="number" step="0.1" value={form.investorLoanRate || ''} onChange={e => handleChange('investorLoanRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Doba (měs.)</label>
                <input type="number" value={form.investorLoanDurationMonths || ''} onChange={e => handleChange('investorLoanDurationMonths', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Počátek čerpání</label>
              <input type="date" value={form.investorLoanStartDate || ''} onChange={e => handleChange('investorLoanStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            {/* Carry cost info */}
            {(summary.investorCarry.totalInterest > 0 || summary.investorAccrued.totalInterest > 0) && (
              <div className="p-2.5 bg-violet-50 rounded-lg space-y-1">
                <div className="text-xs text-violet-600">
                  Celkový plán. úrok: <span className="font-semibold text-violet-800">{formatCZK(summary.investorCarry.totalInterest)}</span>
                </div>
                <div className="text-xs text-violet-600">
                  Měsíční splátka úroku: <span className="font-semibold text-violet-800">{formatCZK(summary.investorCarry.monthlyPayment)}</span>
                </div>
                {summary.investorAccrued.totalInterest > 0 && (
                  <div className="text-xs text-amber-600 pt-1 border-t border-violet-200">
                    Naběhlý úrok ({Math.round(summary.investorElapsedMonths)} měs.): <span className="font-semibold text-amber-700">{formatCZK(summary.investorAccrued.totalInterest)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          {saving ? 'Ukládám...' : saved ? '✓ Uloženo' : 'Uložit financování'}
        </button>
      </div>

      {/* Drawdowns */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Čerpání úvěru</h2>
          <button onClick={() => setShowDrawdownForm(!showDrawdownForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {showDrawdownForm ? 'Zrušit' : '+ Přidat čerpání'}
          </button>
        </div>

        {showDrawdownForm && (
          <form onSubmit={addDrawdown} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-3">
              <select value={drawdownForm.loanType} onChange={e => setDrawdownForm({ ...drawdownForm, loanType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="bank">Banka</option>
                <option value="investor">Investor</option>
              </select>
              <input placeholder="Účel" value={drawdownForm.purpose} onChange={e => setDrawdownForm({ ...drawdownForm, purpose: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Plán (Kč)" value={drawdownForm.plannedAmount} onChange={e => setDrawdownForm({ ...drawdownForm, plannedAmount: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="date" value={drawdownForm.plannedDate} onChange={e => setDrawdownForm({ ...drawdownForm, plannedDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder="Skutečnost (Kč)" value={drawdownForm.actualAmount} onChange={e => setDrawdownForm({ ...drawdownForm, actualAmount: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Přidat</button>
            </div>
          </form>
        )}

        {drawdowns.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Zatím žádná čerpání</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Účel</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Plán</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plán. datum</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Skutečnost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skut. datum</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drawdowns.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-2.5 text-sm">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${d.loanType === 'bank' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                      {d.loanType === 'bank' ? 'Banka' : 'Investor'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <EditableCell value={d.purpose} field="purpose" entityId={d.id} apiEndpoint={apiCerpani} onSave={() => router.refresh()} />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right">
                    <EditableCell value={d.plannedAmount} field="plannedAmount" entityId={d.id} apiEndpoint={apiCerpani} type="number"
                      formatFn={(v) => v ? formatCZK(Number(v)) : '—'} onSave={() => router.refresh()} className="text-right" />
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <EditableCell value={d.plannedDate} field="plannedDate" entityId={d.id} apiEndpoint={apiCerpani} type="date"
                      formatFn={(v) => v ? formatDate(String(v)) : '—'} onSave={() => router.refresh()} />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right">
                    <EditableCell value={d.actualAmount} field="actualAmount" entityId={d.id} apiEndpoint={apiCerpani} type="number"
                      formatFn={(v) => v ? formatCZK(Number(v)) : '—'} onSave={() => router.refresh()} className="text-right" />
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <EditableCell value={d.actualDate} field="actualDate" entityId={d.id} apiEndpoint={apiCerpani} type="date"
                      formatFn={(v) => v ? formatDate(String(v)) : '—'} onSave={() => router.refresh()} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => deleteDrawdown(d.id)} className="text-xs text-gray-400 hover:text-red-600">✕</button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                <td colSpan={2} className="px-6 py-3 text-sm">Celkem</td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(totalPlannedDrawdown)}</td>
                <td></td>
                <td className="px-4 py-3 text-sm text-right">{formatCZK(totalActualDrawdown)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
