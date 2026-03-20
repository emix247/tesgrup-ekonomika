'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, PieChart, Pie, Legend,
} from 'recharts';
import { CHART_COLORS, SEMANTIC_COLORS } from '@/lib/utils/chart-colors';
import { formatCZK } from '@/lib/utils/format';

interface ProjectData {
  name: string;
  revenue: number;
  forecastCost: number;
  grossProfit: number;
  netProfit: number;
  financingCost: number;
}

interface Props {
  projects: ProjectData[];
  portfolioRevenue: number;
  portfolioCosts: number;
  portfolioFinancing: number;
  portfolioTax: number;
  portfolioNetProfit: number;
}

export default function PortfolioCharts({
  projects,
  portfolioRevenue,
  portfolioCosts,
  portfolioFinancing,
  portfolioTax,
  portfolioNetProfit,
}: Props) {
  // Waterfall data
  const waterfallData = [
    { name: 'Výnosy', value: portfolioRevenue, fill: SEMANTIC_COLORS.revenue },
    { name: 'Náklady', value: -portfolioCosts, fill: SEMANTIC_COLORS.cost },
    { name: 'Financování', value: -portfolioFinancing, fill: SEMANTIC_COLORS.financing },
    { name: 'Daně', value: -portfolioTax, fill: SEMANTIC_COLORS.tax },
    { name: 'Čistý zisk', value: portfolioNetProfit, fill: portfolioNetProfit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.cost },
  ];

  // Project comparison data
  const comparisonData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '…' : p.name,
    fullName: p.name,
    Výnosy: p.revenue,
    Náklady: p.forecastCost,
    'Hrubý zisk': p.grossProfit,
    'Čistý zisk': p.netProfit,
  }));

  // Donut data — revenue distribution
  const revenueDonut = projects
    .filter(p => p.revenue > 0)
    .map((p, i) => ({ name: p.name, value: p.revenue, color: CHART_COLORS[i % CHART_COLORS.length] }));

  // Donut data — cost distribution
  const costDonut = projects
    .filter(p => p.forecastCost > 0)
    .map((p, i) => ({ name: p.name, value: p.forecastCost, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const formatAxis = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return `${v}`;
  };

  const tooltipFormatter = (value: number) => formatCZK(Math.abs(value));

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Infografika portfolia</h2>

      {/* Row 1: Waterfall + Project Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Waterfall */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Rozpad zisku portfolia</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={waterfallData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11 }} />
              <Tooltip formatter={tooltipFormatter} />
              <ReferenceLine y={0} stroke="#d1d5db" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project comparison bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Porovnání projektů</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCZK(value), name]}
                labelFormatter={(label: string) => {
                  const item = comparisonData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#d1d5db" />
              <Bar dataKey="Výnosy" fill={SEMANTIC_COLORS.revenue} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Náklady" fill={SEMANTIC_COLORS.cost} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Čistý zisk" fill={SEMANTIC_COLORS.profit} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Donut charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Rozložení výnosů</h3>
          {revenueDonut.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={revenueDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                  startAngle={90}
                  endAngle={-270}
                  label={false}
                  labelLine={false}
                >
                  {revenueDonut.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCZK(value)} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">Žádná data</div>
          )}
        </div>

        {/* Cost distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Rozložení nákladů</h3>
          {costDonut.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={costDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                  startAngle={90}
                  endAngle={-270}
                  label={false}
                  labelLine={false}
                >
                  {costDonut.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCZK(value)} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">Žádná data</div>
          )}
        </div>
      </div>
    </div>
  );
}
