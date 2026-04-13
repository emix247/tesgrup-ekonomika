import { startOfWeek, addWeeks, getISOWeek, getYear, isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';

export const WEEKS = 13;
export type Scenario = 'conservative' | 'base' | 'optimistic';

export interface WeekRow {
  weekNumber: number; year: number; label: string;
  weekStart: string; weekEnd: string;
  inflows: number; outflows: number; startCash: number; endCash: number;
}

export interface ForecastResult {
  weeks: WeekRow[]; minCash: number;
  semaphore: 'green' | 'orange' | 'red'; runwayWeeks: number;
  biggestInflow: { name: string; amount: number; date: string } | null;
  biggestOutflow: { name: string; amount: number; date: string } | null;
}

export interface RawItem {
  id: number; type: string; name: string; amount: number; paymentDate: string; certainty: string;
}

function certMultiplier(certainty: string, scenario: Scenario, baseBPct: number): number {
  if (certainty === 'A') return 1;
  if (certainty === 'B') {
    if (scenario === 'conservative') return 0;
    if (scenario === 'base') return baseBPct / 100;
    return 1;
  }
  return scenario === 'optimistic' ? 1 : 0;
}

export function buildForecast(items: RawItem[], startCash: number, scenario: Scenario, baseBPct: number, minBuffer: number, criticalCash: number): ForecastResult {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weeks: WeekRow[] = [];
  let runningCash = startCash;

  for (let i = 0; i < WEEKS; i++) {
    const weekStart = addWeeks(currentWeekStart, i);
    const start = startOfDay(weekStart);
    const end = endOfDay(addDays(weekStart, 6));
    let inflows = 0, outflows = 0;

    for (const item of items) {
      const pd = new Date(item.paymentDate);
      if (!isWithinInterval(pd, { start, end })) continue;
      const effective = item.amount * certMultiplier(item.certainty, scenario, baseBPct);
      if (item.type === 'in') inflows += effective; else outflows += effective;
    }

    const startCashWeek = runningCash;
    const endCash = startCashWeek + inflows - outflows;
    runningCash = endCash;

    weeks.push({
      weekNumber: getISOWeek(weekStart), year: getYear(weekStart),
      label: `T${i + 1} (W${String(getISOWeek(weekStart)).padStart(2, '0')})`,
      weekStart: weekStart.toISOString(), weekEnd: addDays(weekStart, 6).toISOString(),
      inflows, outflows, startCash: startCashWeek, endCash,
    });
  }

  const minCash = Math.min(...weeks.map(w => w.endCash));
  let semaphore: 'green' | 'orange' | 'red' = 'green';
  if (minCash < criticalCash) semaphore = 'red';
  else if (weeks.slice(0, 4).some(w => w.endCash < minBuffer) || minCash < minBuffer) semaphore = 'orange';

  let runwayWeeks = -1;
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].endCash < criticalCash) { runwayWeeks = i; break; }
  }

  const next2End = endOfDay(addDays(addWeeks(currentWeekStart, 2), -1));
  let biggestInflow: ForecastResult['biggestInflow'] = null;
  let biggestOutflow: ForecastResult['biggestOutflow'] = null;
  for (const item of items) {
    const pd = new Date(item.paymentDate);
    if (!isWithinInterval(pd, { start: currentWeekStart, end: next2End })) continue;
    const effective = item.amount * certMultiplier(item.certainty, scenario, baseBPct);
    if (effective === 0) continue;
    if (item.type === 'in' && (!biggestInflow || effective > biggestInflow.amount))
      biggestInflow = { name: item.name, amount: effective, date: item.paymentDate };
    if (item.type === 'out' && (!biggestOutflow || effective > biggestOutflow.amount))
      biggestOutflow = { name: item.name, amount: effective, date: item.paymentDate };
  }

  return { weeks, minCash, semaphore, runwayWeeks, biggestInflow, biggestOutflow };
}
