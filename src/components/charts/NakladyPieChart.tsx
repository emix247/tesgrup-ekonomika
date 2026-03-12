'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { COST_CATEGORIES } from '@/lib/utils/constants';
import { formatCZK } from '@/lib/utils/format';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6', '#84cc16'];

interface Props {
  costs: { category: string; amount: number }[];
}

export default function NakladyPieChart({ costs }: Props) {
  const grouped = Object.entries(COST_CATEGORIES).map(([key, name]) => {
    const total = costs.filter(c => c.category === key).reduce((s, c) => s + c.amount, 0);
    return { name, value: total };
  }).filter(g => g.value > 0);

  if (grouped.length === 0) return null;

  const total = grouped.reduce((s, g) => s + g.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Rozložení nákladů</h3>
      <div className="flex items-start gap-6">
        {/* Pie chart – no labels on the chart itself */}
        <div className="flex-shrink-0" style={{ width: 220, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={grouped}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                dataKey="value"
                label={false}
                labelLine={false}
                strokeWidth={2}
                stroke="#fff"
              >
                {grouped.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCZK(value)}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend – clean vertical list next to the chart */}
        <div className="flex-1 min-w-0">
          <div className="space-y-1.5">
            {grouped.map((g, i) => {
              const pct = total > 0 ? ((g.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={g.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-gray-700 truncate flex-1 min-w-0">{g.name}</span>
                  <span className="text-gray-400 flex-shrink-0 tabular-nums">{pct} %</span>
                  <span className="text-gray-600 font-medium flex-shrink-0 tabular-nums text-right" style={{ minWidth: 100 }}>
                    {formatCZK(g.value)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm font-semibold">
            <div className="w-3 h-3 flex-shrink-0" />
            <span className="text-gray-900 flex-1">Celkem</span>
            <span className="text-gray-500 flex-shrink-0 tabular-nums">100 %</span>
            <span className="text-gray-900 flex-shrink-0 tabular-nums text-right" style={{ minWidth: 100 }}>
              {formatCZK(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
