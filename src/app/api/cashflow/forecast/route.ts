import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems, cfCashBalances, cfParameters } from '@/lib/db/schema';
import { buildForecast, Scenario } from '@/lib/calculations/cashflow-forecast';
import { desc } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scenario = (searchParams.get('scenario') || 'base') as Scenario;
  const projectId = searchParams.get('projectId');
  const params = await db.select().from(cfParameters);
  const pm: Record<string, number> = {};
  for (const p of params) pm[p.key] = parseFloat(p.value);
  const minBuffer = pm.minCashBuffer ?? 2500000;
  const criticalCash = pm.criticalCash ?? 500000;
  const baseBPct = pm.baseBPercent ?? 50;
  const balances = await db.select().from(cfCashBalances).orderBy(desc(cfCashBalances.date)).limit(1);
  const startCash = balances[0]?.amount ?? 0;
  let items = await db.select().from(cfItems);
  if (projectId) items = items.filter(i => i.projectId === parseInt(projectId));
  const effectiveStart = projectId ? 0 : startCash;
  const result = buildForecast(items, effectiveStart, scenario, baseBPct, minBuffer, criticalCash);
  return NextResponse.json({ ...result, startCash: effectiveStart, isProjectView: !!projectId, minBuffer, criticalCash, baseBPct });
}
