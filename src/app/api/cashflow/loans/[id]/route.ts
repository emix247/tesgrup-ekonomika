import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfInvestorLoans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [loan] = await db.select().from(cfInvestorLoans).where(eq(cfInvestorLoans.id, parseInt(id)));
  if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(loan);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const u: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.creditor) u.creditor = body.creditor;
  if (body.amount !== undefined) u.amount = parseFloat(body.amount);
  if (body.startDate) u.startDate = body.startDate;
  if (body.dueDate) u.dueDate = body.dueDate;
  if (body.interestRate !== undefined) u.interestRate = body.interestRate ? parseFloat(body.interestRate) : null;
  if (body.collateral !== undefined) u.collateral = body.collateral || null;
  if (body.note !== undefined) u.note = body.note || null;
  if (body.status) u.status = body.status;
  const [loan] = await db.update(cfInvestorLoans).set(u).where(eq(cfInvestorLoans.id, parseInt(id))).returning();
  return NextResponse.json(loan);
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(cfInvestorLoans).where(eq(cfInvestorLoans.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
