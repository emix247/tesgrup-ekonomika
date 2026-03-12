'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCZK } from '@/lib/utils/format';
import { SEMANTIC_COLORS } from '@/lib/utils/chart-colors';

interface DataPoint {
  category: string;
  plan: number;
  actual: number;
}

interface Props {
  data: DataPoint[];
  title?: string;
  layout?: 'horizontal' | 'vertical';
}

export default function BarComparisonChart({ data, title, layout = 'vertical' }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 45)}>
        {layout === 'horizontal' ? (
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={160} />
            <Tooltip formatter={(value: number) => formatCZK(value)} />
            <Legend />
            <Bar dataKey="plan" name="Plán" fill={SEMANTIC_COLORS.plan} radius={[0, 4, 4, 0]} barSize={14} />
            <Bar dataKey="actual" name="Skutečnost" fill={SEMANTIC_COLORS.actual} radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={80} />
            <YAxis tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: number) => formatCZK(value)} />
            <Legend />
            <Bar dataKey="plan" name="Plán" fill={SEMANTIC_COLORS.plan} radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Skutečnost" fill={SEMANTIC_COLORS.actual} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
