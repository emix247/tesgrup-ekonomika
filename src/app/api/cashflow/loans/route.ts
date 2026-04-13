import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfInvestorLoans } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export async function GET() {
  const loans = await db.select().from(cfInvestorLoans).orderBy(asc(cfInvestorLoans.dueDate));
  return NextResponse.json(loans);
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { creditor, amount, startDate, dueDate, interestRate, collateral, note, status } = body;
  if (!creditor || !amount || !startDate || !dueDate) return NextResponse.json({ error: 'Chybí povinné pole' }, { status: 400 });
  const now = new Date().toISOString();
  const [loan] = await db.insert(cfInvestorLoans).values({ creditor, amount: parseFloat(amount), startDate, dueDate, interestRate: interestRate ? parseFloat(interestRate) : null, collateral: collateral || null, note: note || null, status: status || 'active', createdAt: now, updatedAt: now }).returning();
  return NextResponse.json(loan, { status: 201 });
}
