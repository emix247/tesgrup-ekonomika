'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { formatCZK } from '@/lib/utils/format';

interface Props {
  revenue: number;
  costs: number;
  financingCosts: number;
  taxBurden: number;
  netProfit: number;
}

export default function ProfitWaterfallChart({ revenue, costs, financingCosts, taxBurden, netProfit }: Props) {
  const data = [
    { name: 'Příjmy', value: revenue, fill: '#3b82f6' },
    { name: 'Náklady', value: -costs, fill: '#ef4444' },
    { name: 'Financování', value: -financingCosts, fill: '#f59e0b' },
    { name: 'Daně', value: -taxBurden, fill: '#f97316' },
    { name: 'Čistý zisk', value: netProfit, fill: netProfit >= 0 ? '#10b981' : '#ef4444' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Vodopádový graf zisku</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
          <YAxis tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} width={50} />
          <Tooltip formatter={(value: number) => formatCZK(Math.abs(value))} />
          <ReferenceLine y={0} stroke="#d1d5db" />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
