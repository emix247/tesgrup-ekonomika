'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCZK } from '@/lib/utils/format';

interface DataPoint {
  label: string;
  plannedCumulative: number;
  actualCumulative: number;
}

interface Props {
  data: DataPoint[];
}

export default function SCurveChart({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">S-křivka čerpání</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => formatCZK(value)} />
          <Legend />
          <Line type="monotone" dataKey="plannedCumulative" name="Plán" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="actualCumulative" name="Skutečnost" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
