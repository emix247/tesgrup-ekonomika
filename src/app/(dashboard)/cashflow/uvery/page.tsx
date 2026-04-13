'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCZK } from '@/lib/utils/format';

interface Loan {
  id: number; creditor: string; amount: number; startDate: string; dueDate: string;
  interestRate: number | null; collateral: string | null; note: string | null; status: string;
}

export default function UveryPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); fetch('/api/cashflow/loans').then(r=>r.json()).then(d => { setLoans(Array.isArray(d)?d:[]); setLoading(false); }); };
  useEffect(load, []);

  const deleteLoan = async (id: number) => {
    if (!confirm('Smazat úvěr?')) return;
    await fetch(`/api/cashflow/loans/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleStatus = async (loan: Loan) => {
    const newStatus = loan.status === 'active' ? 'repaid' : 'active';
    await fetch(`/api/cashflow/loans/${loan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    load();
  };

  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('cs-CZ'); } catch { return d; } };
  const active = loans.filter(l => l.status === 'active');
  const totalActive = active.reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Investorské úvěry</h1>
        <Link href="/cashflow/uvery/novy" className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nový úvěr
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500">Aktivní úvěry</div>
          <div className="text-2xl font-bold mt-1">{active.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500">Celková výše</div>
          <div className="text-2xl font-bold mt-1">{formatCZK(totalActive)}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Žádné úvěry</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Věřitel</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Čerpání</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Splatnost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Úrok</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stav</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akce</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {loans.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-medium">{l.creditor}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums">{formatCZK(l.amount)}</td>
                    <td className="px-4 py-2.5 text-sm">{fmtDate(l.startDate)}</td>
                    <td className="px-4 py-2.5 text-sm">{fmtDate(l.dueDate)}</td>
                    <td className="px-4 py-2.5 text-sm text-right">{l.interestRate ? `${l.interestRate} %` : '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => toggleStatus(l)} className={`px-2 py-0.5 text-xs font-medium rounded-full ${l.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {l.status === 'active' ? 'Aktivní' : 'Splaceno'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/cashflow/uvery/${l.id}`} className="text-primary-600 hover:text-primary-700 text-sm mr-3">Upravit</Link>
                      <button onClick={() => deleteLoan(l.id)} className="text-red-500 hover:text-red-600 text-sm">Smazat</button>
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
