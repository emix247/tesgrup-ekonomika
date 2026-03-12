'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Props {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function MiniSparkline({ data, color = '#3b82f6', width = 80, height = 30 }: Props) {
  if (data.length < 2) return <div style={{ width, height }} />;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
