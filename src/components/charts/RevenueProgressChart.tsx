'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SALE_STATUS_COLORS } from '@/lib/utils/chart-colors';
import { useTheme } from 'next-themes';

interface Props {
  available: number;
  reserved: number;
  contracted: number;
  paid: number;
  handed: number;
  cancelled?: number;
}

export default function RevenueProgressChart({ available, reserved, contracted, paid, handed, cancelled = 0 }: Props) {
  const { resolvedTheme } = useTheme();
  const availableColor = resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db';
  const data = [
    {
      name: 'Jednotky',
      Dostupné: available,
      Rezervace: reserved,
      Smlouva: contracted,
      Zaplaceno: paid,
      Předáno: handed,
      ...(cancelled > 0 ? { Stornováno: cancelled } : {}),
    },
  ];

  const total = available + reserved + contracted + paid + handed;
  if (total === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Stav prodeje jednotek</h3>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip />
          <Bar dataKey="Dostupné" stackId="a" fill={availableColor} radius={[4, 0, 0, 4]} />
          <Bar dataKey="Rezervace" stackId="a" fill={SALE_STATUS_COLORS.rezervace} />
          <Bar dataKey="Smlouva" stackId="a" fill={SALE_STATUS_COLORS.smlouva} />
          <Bar dataKey="Zaplaceno" stackId="a" fill={SALE_STATUS_COLORS.zaplaceno} />
          <Bar dataKey="Předáno" stackId="a" fill={SALE_STATUS_COLORS.predano} radius={[0, 4, 4, 0]} />
          {cancelled > 0 && <Bar dataKey="Stornováno" stackId="a" fill={SALE_STATUS_COLORS.stornovano} />}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3">
        <LegendItem color={availableColor} label={`Dostupné (${available})`} />
        <LegendItem color={SALE_STATUS_COLORS.rezervace} label={`Rezervace (${reserved})`} />
        <LegendItem color={SALE_STATUS_COLORS.smlouva} label={`Smlouva (${contracted})`} />
        <LegendItem color={SALE_STATUS_COLORS.zaplaceno} label={`Zaplaceno (${paid})`} />
        <LegendItem color={SALE_STATUS_COLORS.predano} label={`Předáno (${handed})`} />
        {cancelled > 0 && <LegendItem color={SALE_STATUS_COLORS.stornovano} label={`Stornováno (${cancelled})`} />}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
