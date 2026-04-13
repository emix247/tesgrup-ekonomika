import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfCashBalances } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export async function GET() {
  const balances = await db.select().from(cfCashBalances).orderBy(desc(cfCashBalances.date)).limit(10);
  return NextResponse.json(balances);
}
export async function POST(req: NextRequest) {
  const { accountAmount, cashAmount, date, note } = await req.json();
  if (accountAmount === undefined || cashAmount === undefined || !date) return NextResponse.json({ error: 'Chybí data' }, { status: 400 });
  const acc = parseFloat(accountAmount), cash = parseFloat(cashAmount);
  const [balance] = await db.insert(cfCashBalances).values({ accountAmount: acc, cashAmount: cash, amount: acc + cash, date, note: note || null, createdAt: new Date().toISOString() }).returning();
  return NextResponse.json(balance, { status: 201 });
}
