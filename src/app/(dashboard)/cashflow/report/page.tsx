'use client';

import { useEffect, useState } from 'react';
import { formatCZK, formatDate } from '@/lib/utils/format';
import { format } from 'date-fns';

interface WeekRow {
  label: string; weekStart: string; weekEnd: string;
  inflows: number; outflows: number; startCash: number; endCash: number;
}
interface ForecastData {
  weeks: WeekRow[]; minCash: number; semaphore: string; runwayWeeks: number;
  startCash: number; minBuffer: number; criticalCash: number; baseBPct: number;
  biggestInflow: { name: string; amount: number } | null;
  biggestOutflow: { name: string; amount: number } | null;
}

const SEM_TEXT: Record<string, string> = { green: 'V POŘÁDKU', orange: 'POZOR', red: 'KRITICKÉ' };

export default function ReportPage() {
  const [base, setBase] = useState<ForecastData | null>(null);
  const [cons, setCons] = useState<ForecastData | null>(null);
  const [opt, setOpt] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/cashflow/forecast?scenario=base').then(r => r.json()),
      fetch('/api/cashflow/forecast?scenario=conservative').then(r => r.json()),
      fetch('/api/cashflow/forecast?scenario=optimistic').then(r => r.json()),
    ]).then(([b, c, o]) => { setBase(b); setCons(c); setOpt(o); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Načítám data pro report...</div>;
  if (!base) return <div className="p-8 text-red-600">Chyba načítání dat.</div>;

  const today = format(new Date(), 'd. M. yyyy');

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 15mm; size: A4; }
          nav, aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      <div className="no-print flex gap-2 mb-6">
        <button onClick={() => window.print()}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 9.456l-.003-.062m0 .062a48.536 48.536 0 0 1-.003.062" /></svg>
          Tisk / Uložit jako PDF
        </button>
        <button onClick={() => window.history.back()}
          className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Zpět</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-0 print:rounded-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-4 border-b-2 border-gray-800">
          <div>
            <div className="text-3xl font-bold text-gray-900">Cashflow 13W Report</div>
            <div className="text-gray-500 mt-1">13-týdenní cashflow forecast — Tesgrup Development</div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="font-semibold text-gray-800">Datum sestavení</div>
            <div>{today}</div>
          </div>
        </div>

        {/* Semaphore */}
        <div className={`mb-6 rounded-xl p-4 ${base.semaphore === 'green' ? 'bg-emerald-50 border border-emerald-200' : base.semaphore === 'orange' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="text-lg font-bold">Stav cashflow: {SEM_TEXT[base.semaphore]}</div>
          <div className="text-sm text-gray-600 mt-1">Základní scénář (A + {base.baseBPct}% B)</div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Počáteční cash', value: formatCZK(base.startCash), sub: 'aktuální zůstatek' },
            { label: 'Min cash (Base)', value: formatCZK(base.minCash), sub: `buffer: ${formatCZK(base.minBuffer)}` },
            { label: 'Min cash (Konz.)', value: formatCZK(cons?.minCash ?? 0), sub: 'jen jisté položky (A)' },
            { label: 'Runway', value: base.runwayWeeks === -1 ? '> 13 týdnů' : `${base.runwayWeeks} týdnů`, sub: 'do kritické hranice' },
          ].map(k => (
            <div key={k.label} className="border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">{k.label}</div>
              <div className="text-lg font-bold text-gray-900">{k.value}</div>
              <div className="text-xs text-gray-400">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Scenarios */}
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Přehled scénářů</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Konzervativní', desc: 'Jen jisté (A=100%)', d: cons },
            { label: 'Základní', desc: `A=100%, B=${base.baseBPct}%`, d: base },
            { label: 'Optimistický', desc: 'A+B+C = 100%', d: opt },
          ].map(({ label, desc, d }) => (
            <div key={label} className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-800 mb-1">{label}</div>
              <div className="text-xs text-gray-400 mb-3">{desc}</div>
              <div className="text-sm"><span className="text-gray-500">Min cash:</span> <strong>{formatCZK(d?.minCash ?? 0)}</strong></div>
              <div className="text-sm"><span className="text-gray-500">Stav:</span> <strong>{SEM_TEXT[d?.semaphore ?? 'green']}</strong></div>
            </div>
          ))}
        </div>

        {/* Weekly table */}
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Týdenní přehled — Základní scénář</h2>
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-3 py-2 text-left">Týden</th>
              <th className="px-3 py-2 text-left">Datum</th>
              <th className="px-3 py-2 text-right">Start Cash</th>
              <th className="px-3 py-2 text-right">Příjmy</th>
              <th className="px-3 py-2 text-right">Výdaje</th>
              <th className="px-3 py-2 text-right">End Cash</th>
            </tr>
          </thead>
          <tbody>
            {base.weeks.map((w, i) => {
              const isLow = w.endCash < base.criticalCash;
              const isWarn = !isLow && w.endCash < base.minBuffer;
              return (
                <tr key={i} style={{ background: isLow ? '#fef2f2' : isWarn ? '#fffbeb' : i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td className="px-3 py-1.5 font-semibold text-primary-800">{w.label}</td>
                  <td className="px-3 py-1.5 text-gray-500 text-xs">{formatDate(w.weekStart)} – {formatDate(w.weekEnd)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatCZK(w.startCash)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-emerald-700">{w.inflows > 0 ? `+${formatCZK(w.inflows)}` : '–'}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{w.outflows > 0 ? `−${formatCZK(w.outflows)}` : '–'}</td>
                  <td className={`px-3 py-1.5 text-right tabular-nums font-bold ${isLow ? 'text-red-700' : isWarn ? 'text-amber-700' : ''}`}>
                    {formatCZK(w.endCash)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 flex justify-between">
          <span>Cashflow 13W — Tesgrup Development</span>
          <span>Buffer: {formatCZK(base.minBuffer)} | Kritická: {formatCZK(base.criticalCash)}</span>
          <span>Generováno: {today}</span>
        </div>
      </div>
    </>
  );
}
