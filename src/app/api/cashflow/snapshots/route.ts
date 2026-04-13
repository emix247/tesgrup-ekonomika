import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfWeeklySnapshots, cfItems, cfCashBalances, cfParameters } from '@/lib/db/schema';
import { buildForecast } from '@/lib/calculations/cashflow-forecast';
import { desc } from 'drizzle-orm';
import { getISOWeek, getYear } from 'date-fns';
export const dynamic = 'force-dynamic';
export async function GET() {
  const snapshots = await db.select().from(cfWeeklySnapshots).orderBy(desc(cfWeeklySnapshots.createdAt));
  return NextResponse.json(snapshots.map(s => {
    let summary = null;
    try { const d = JSON.parse(s.data); summary = { startCash: d.startCash, baseMinCash: d.base?.minCash, baseSemaphore: d.base?.semaphore, itemCount: d.itemCount }; } catch {}
    return { ...s, summary };
  }));
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const note = body.note || null;
  const params = await db.select().from(cfParameters);
  const pm: Record<string, number> = {};
  for (const p of params) pm[p.key] = parseFloat(p.value);
  const minBuffer = pm.minCashBuffer ?? 2500000;
  const criticalCash = pm.criticalCash ?? 500000;
  const baseBPct = pm.baseBPercent ?? 50;
  const balances = await db.select().from(cfCashBalances).orderBy(desc(cfCashBalances.date)).limit(1);
  const startCash = balances[0]?.amount ?? 0;
  const items = await db.select().from(cfItems);
  const conservative = buildForecast(items, startCash, 'conservative', baseBPct, minBuffer, criticalCash);
  const base = buildForecast(items, startCash, 'base', baseBPct, minBuffer, criticalCash);
  const optimistic = buildForecast(items, startCash, 'optimistic', baseBPct, minBuffer, criticalCash);
  const now = new Date();
  const weekLabel = `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
  const data = JSON.stringify({ startCash, itemCount: items.length, parameters: { minBuffer, criticalCash, baseBPct }, conservative: { minCash: conservative.minCash, semaphore: conservative.semaphore, weeks: conservative.weeks }, base: { minCash: base.minCash, semaphore: base.semaphore, weeks: base.weeks }, optimistic: { minCash: optimistic.minCash, semaphore: optimistic.semaphore, weeks: optimistic.weeks } });
  const [snapshot] = await db.insert(cfWeeklySnapshots).values({ weekLabel, note, data, createdAt: now.toISOString() }).returning();
  return NextResponse.json(snapshot, { status: 201 });
}
