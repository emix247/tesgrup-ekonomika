// Shared chart color palette used across all visualization components
export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#84cc16', // lime-500
] as const;

// Semantic colors for specific use cases
export const SEMANTIC_COLORS = {
  plan: '#3b82f6',       // blue — planned/forecast
  actual: '#10b981',     // emerald — actual/real
  variance: '#ef4444',   // red — variance/overrun
  revenue: '#3b82f6',    // blue — revenue
  cost: '#ef4444',       // red — costs
  profit: '#10b981',     // emerald — profit
  financing: '#f59e0b',  // amber — financing
  tax: '#f97316',        // orange — taxes
} as const;

// Sale status colors
export const SALE_STATUS_COLORS: Record<string, string> = {
  rezervace: '#f59e0b',  // amber
  smlouva: '#3b82f6',    // blue
  zaplaceno: '#10b981',  // emerald
  predano: '#8b5cf6',    // violet
  stornovano: '#ef4444', // red
};

// Payment status colors
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  neuhrazeno: '#ef4444',
  castecne_uhrazeno: '#f59e0b',
  uhrazeno: '#10b981',
};

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
