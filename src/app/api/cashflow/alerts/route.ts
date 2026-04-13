import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems, cfInvestorLoans, cfParameters } from '@/lib/db/schema';
import { addDays } from 'date-fns';
export const dynamic = 'force-dynamic';
export async function GET() {
  const params = await db.select().from(cfParameters);
  const pm: Record<string, number> = {};
  for (const p of params) pm[p.key] = parseFloat(p.value);
  const threshold = pm.alertThreshold ?? 500000;
  const daysAhead = pm.alertDaysAhead ?? 21;
  const nowStr = new Date().toISOString().split('T')[0];
  const cutoff = addDays(new Date(), daysAhead).toISOString().split('T')[0];
  const allItems = await db.select().from(cfItems);
  const items = allItems.filter(i => i.paymentDate >= nowStr && i.paymentDate <= cutoff && i.amount >= threshold);
  const loanCutoff = addDays(new Date(), daysAhead * 2).toISOString().split('T')[0];
  const allLoans = await db.select().from(cfInvestorLoans);
  const loans = allLoans.filter(l => l.status === 'active' && l.dueDate >= nowStr && l.dueDate <= loanCutoff);
  return NextResponse.json({ items, loans, threshold, daysAhead });
}
