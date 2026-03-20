'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/lib/utils/chart-colors';

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  title?: string;
}

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 140,
  title,
}: DonutChartProps) {
  const filteredData = data.filter((d) => d.value > 0);
  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        {title && <div className="text-sm font-medium text-gray-500">{title}</div>}
        <span className="text-sm text-gray-400">Žádná data</span>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const mainValue = filteredData[0]?.value || 0;
  const percentage = total > 0 ? Math.round((mainValue / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-1 min-w-0 max-w-full">
      {title && <div className="text-sm font-medium text-gray-500">{title}</div>}

      {/* Value displayed prominently ABOVE the chart */}
      {centerValue && (
        <div className="text-xl font-bold text-gray-900 mt-1">{centerValue}</div>
      )}
      {centerLabel && (
        <div className="text-xs text-gray-400">{centerLabel}</div>
      )}

      {/* Donut with percentage inside */}
      <div className="relative max-w-full" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.34}
              outerRadius={size * 0.46}
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
              startAngle={90}
              endAngle={-270}
            >
              {filteredData.map((entry, i) => (
                <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Only show percentage inside the ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-lg font-semibold text-gray-700">{percentage} %</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
        {filteredData.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color || CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-gray-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
